/**
 * Notation — music-notation display (sheet music) for the active song.
 *
 * Per CLAUDE.md §0:
 *   - Timing source of truth is `Tone.Transport.currentTime`; CSS/
 *     React re-renders derive from it (via useTransportClock).
 *   - No `Date.now()` / `setInterval` for note timing.
 *
 * Renders one horizontal stave containing every chord of the active song
 * via VexFlow. The active chord is highlighted by swapping its SVG
 * fill color on a rAF tick. Complements FallingNotes (which gives
 * memory-lane practice); Notation shows the score side-by-side.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import { Formatter, Renderer, Stave, Voice } from 'vexflow'

import { useTransportClock } from '../../audio/useTransportClock.ts'
import type { RootState } from '../../store/index.ts'

import {
  NOTATION_CHORDS_PER_STAVE,
  NOTATION_CONTAINER_PADDING,
  NOTATION_DEFAULT_FILL,
  NOTATION_HEIGHT_PER_STAVE,
  NOTATION_HIGHLIGHT_FILL,
  NOTATION_PADDING,
  NOTATION_STAVE_GAP,
  NOTATION_STAVE_WIDTH,
  NOTATION_STAVE_X,
  NOTATION_STAVE_Y,
  NOTATION_WIDTH,
} from './Notation.constants.ts'
import { buildStaveNotes, toNotationChords } from './notationHelpers.ts'

import styles from './Notation.module.css'

const HIGHLIGHT_LOOK_AHEAD_SECONDS = 0.05
const HIGHLIGHT_LOOK_BEHIND_SECONDS = 0.4

const isChordActive = (
  startTime: number,
  currentTime: number,
  tempoMultiplier: number,
): boolean => {
  // Per BUG-023: startTime is song seconds; currentTime is wall-clock
  // elapsed since transport.start(). Convert startTime to wall-clock.
  const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
  const wallStart = startTime / safeMultiplier
  return (
    currentTime >= wallStart - HIGHLIGHT_LOOK_BEHIND_SECONDS &&
    currentTime <= wallStart + HIGHLIGHT_LOOK_AHEAD_SECONDS
  )
}

const chunkChords = <T,>(
  items: ReadonlyArray<T>,
  size: number,
): ReadonlyArray<ReadonlyArray<T>> => {
  if (items.length === 0 || size <= 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const renderNotation = (
  container: HTMLDivElement,
  chords: ReturnType<typeof toNotationChords>,
  width: number,
): (() => void) => {
  container.replaceChildren()
  if (chords.length === 0) return () => undefined

  const chunks = chunkChords(chords, NOTATION_CHORDS_PER_STAVE)
  const totalHeight =
    chunks.length * NOTATION_HEIGHT_PER_STAVE +
    Math.max(0, chunks.length - 1) * NOTATION_STAVE_GAP +
    NOTATION_CONTAINER_PADDING

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, totalHeight)
  const context = renderer.getContext()
  context.setFillStyle(NOTATION_DEFAULT_FILL)

  chunks.forEach((chunk, staveIndex) => {
    const staveY = NOTATION_STAVE_Y + staveIndex * (NOTATION_HEIGHT_PER_STAVE + NOTATION_STAVE_GAP)
    const stave = new Stave(NOTATION_STAVE_X, staveY, NOTATION_STAVE_WIDTH)
    stave.setContext(context).draw()

    const staveNotes = buildStaveNotes(chunk)
    const voice = new Voice({
      num_beats: Math.max(1, staveNotes.length),
      beat_value: 4,
    }).setStrict(false)
    voice.addTickables(staveNotes)

    new Formatter().joinVoices([voice]).format([voice], NOTATION_STAVE_WIDTH)
    voice.draw(context, stave)
  })

  const svg = container.querySelector('svg')
  if (svg !== null) {
    svg.setAttribute('class', styles.stave ?? '')
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(totalHeight))
    svg.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`)
    // Tag every chord's <g> with its global chord index so the highlight
    // pass can find them by index across all staves.
    const noteGroups = svg.querySelectorAll<SVGGElement>('g.vf-stavenote')
    noteGroups.forEach((group, idx) => {
      group.setAttribute('data-notation-chord', String(idx))
      group.setAttribute('fill', NOTATION_DEFAULT_FILL)
    })
  }

  return () => {
    context.clear()
  }
}

export const Notation = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const song = useSelector((state: RootState) => {
    const id = state.songs.activeSongId
    return id === null ? null : (state.songs.byId[id] ?? null)
  })
  const tempoMultiplier = useSelector((state: RootState) => state.songs.tempoMultiplier)
  const showNotation = useSelector((state: RootState) => state.settings.showNotation)
  const { currentTime } = useTransportClock()

  const chords = useMemo(() => {
    if (song === null) return []
    const effectiveBpm = song.tempoBPM * tempoMultiplier
    return toNotationChords(song.notes, effectiveBpm)
  }, [song, tempoMultiplier])

  const activeChordIndex = useMemo(() => {
    if (currentTime === null) return -1
    return chords.findIndex((chord) => isChordActive(chord.startTime, currentTime, tempoMultiplier))
  }, [chords, currentTime, tempoMultiplier])

  // Re-render the stave whenever the song or tempo changes.
  useEffect(() => {
    const container = containerRef.current
    if (container === null) return
    const cleanup = renderNotation(container, chords, NOTATION_WIDTH)
    return cleanup
  }, [chords])

  // Sync the highlight via rAF; cheap to do even when transport is paused
  // because we early-out when currentTime is null.
  useEffect(() => {
    if (containerRef.current === null) return
    const container = containerRef.current
    let rafId = 0
    const tick = () => {
      const svg = container.querySelector('svg')
      if (svg !== null) {
        const fills = svg.querySelectorAll<SVGElement>('[data-notation-chord]')
        fills.forEach((el, idx) => {
          const isActive = idx === activeChordIndex
          el.setAttribute('fill', isActive ? NOTATION_HIGHLIGHT_FILL : NOTATION_DEFAULT_FILL)
        })
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [activeChordIndex])

  return (
    <div className={styles.wrapper} aria-label="Music notation" data-visible={showNotation}>
      {showNotation ? (
        <div
          ref={containerRef}
          className={styles.canvas}
          style={{ width: NOTATION_WIDTH, padding: NOTATION_PADDING }}
        />
      ) : null}
    </div>
  )
}
