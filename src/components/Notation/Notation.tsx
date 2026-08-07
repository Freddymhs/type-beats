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
  NOTATION_DEFAULT_FILL,
  NOTATION_HEIGHT,
  NOTATION_HIGHLIGHT_FILL,
  NOTATION_PADDING,
  NOTATION_STAVE_WIDTH,
  NOTATION_STAVE_X,
  NOTATION_STAVE_Y,
  NOTATION_WIDTH,
} from './Notation.constants.ts'
import { buildStaveNotes, toNotationChords } from './notationHelpers.ts'

import styles from './Notation.module.css'

const HIGHLIGHT_LOOK_AHEAD_SECONDS = 0.05
const HIGHLIGHT_LOOK_BEHIND_SECONDS = 0.4

const isChordActive = (startTime: number, currentTime: number): boolean =>
  currentTime >= startTime - HIGHLIGHT_LOOK_BEHIND_SECONDS &&
  currentTime <= startTime + HIGHLIGHT_LOOK_AHEAD_SECONDS

const renderNotation = (
  container: HTMLDivElement,
  chords: ReturnType<typeof toNotationChords>,
  width: number,
  height: number,
): (() => void) => {
  container.replaceChildren()
  if (chords.length === 0) return () => undefined

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()
  context.setFillStyle(NOTATION_DEFAULT_FILL)

  const stave = new Stave(NOTATION_STAVE_X, NOTATION_STAVE_Y, NOTATION_STAVE_WIDTH)
  stave.setContext(context).draw()

  const staveNotes = buildStaveNotes(chords)
  const voice = new Voice({
    num_beats: Math.max(1, staveNotes.length),
    beat_value: 4,
  }).setStrict(false)
  voice.addTickables(staveNotes)

  new Formatter().joinVoices([voice]).format([voice], NOTATION_STAVE_WIDTH)
  voice.draw(context, stave)

  const svg = container.querySelector('svg')
  if (svg !== null) {
    svg.setAttribute('class', styles.stave ?? '')
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))
    // Tag every chord's <g> so the highlight pass can find them by index.
    const noteGroups = svg.querySelectorAll<SVGGElement>('g.vf-stavenote')
    noteGroups.forEach((group, idx) => {
      group.setAttribute('data-notation-chord', String(idx))
      group.setAttribute('fill', NOTATION_DEFAULT_FILL)
    })
  }

  return () => {
    staveNotes.forEach((n) => {
      n.getSVGElement?.()?.remove?.()
    })
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
  const { currentTime } = useTransportClock()

  const chords = useMemo(() => {
    if (song === null) return []
    const effectiveBpm = song.tempoBPM * tempoMultiplier
    return toNotationChords(song.notes, effectiveBpm)
  }, [song, tempoMultiplier])

  const activeChordIndex = useMemo(() => {
    if (currentTime === null) return -1
    return chords.findIndex((chord) => isChordActive(chord.startTime, currentTime))
  }, [chords, currentTime])

  // Re-render the stave whenever the song or tempo changes.
  useEffect(() => {
    const container = containerRef.current
    if (container === null) return
    const cleanup = renderNotation(container, chords, NOTATION_WIDTH, NOTATION_HEIGHT)
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
    <div className={styles.wrapper} aria-label="Music notation">
      <div
        ref={containerRef}
        className={styles.canvas}
        style={{ width: NOTATION_WIDTH, height: NOTATION_HEIGHT, padding: NOTATION_PADDING }}
      />
    </div>
  )
}
