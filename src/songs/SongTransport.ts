/**
 * SongTransport — drives Tone.Transport for the active song.
 *
 * Responsibilities:
 *   - Schedule every note of the active song against Transport time.
 *   - Apply the tempo multiplier on top of the song's BPM.
 *   - Track play/pause/stop state and reset scheduling on song change.
 *
 * Notes are scheduled forward from Transport.currentTime (or 0 if stopped)
 * using `Tone.Transport.schedule`. On song change we cancel pending
 * callbacks and re-schedule from the current transport position so
 * switching mid-song keeps the playback anchor stable.
 *
 * Per CLAUDE.md §0: this class is the only place that calls
 * `Tone.Transport.start` / `pause` / `stop`. The loop wrap-around is
 * performed by the TransportBridge via `jumpTo` (a single Transport
 * start-with-offset) — keeping the heavy scheduling logic here simple.
 */

import * as Tone from 'tone'

import { midiPitch, velocity as makeVelocity, type Song } from '../types/index.ts'
import type { ToneManager } from '../audio/ToneManager.ts'

interface ScheduledSong {
  readonly song: Song
  readonly noteIds: number[]
}

export interface TransportStatus {
  readonly state: 'stopped' | 'started' | 'paused'
  readonly positionSeconds: number
}

interface TransportLike {
  state: string
  currentTime?: number
  position?: number
  start: (time?: number, offset?: number) => void
  pause: (time?: number) => void
  stop: (time?: number) => void
  schedule: (cb: (time: number) => void, time: number) => number
  clear: (id: number) => number
  bpm: { value: number }
}

const asTransport = (): TransportLike => Tone.getTransport() as unknown as TransportLike

const DEFAULT_VELOCITY = makeVelocity(100)

// Per BUG-035: pre-roll before audio starts so the user can see notes
// falling and prepare their hands. Same value is applied in FallingNotes'
// computeTransformY so audio fires when the visual reaches the hit line.
const PRE_ROLL_SECONDS = 5

export class SongTransport {
  private current: ScheduledSong | null = null
  private status: TransportStatus['state'] = 'stopped'
  // Per UV-002: Transport.seconds is wall-clock since first start
  // (5 minutes after dev server boot, etc.). To report a song-relative
  // position, capture the offset at each `play()` and compute the delta
  // on every read. `startedAtWall` is null between stop/play cycles.
  private startedAtWall: number | null = null
  private pausedAt: number | null = null
  private readonly toneManager: ToneManager

  constructor(toneManager: ToneManager) {
    this.toneManager = toneManager
  }

  loadSong(song: Song, tempoMultiplier: number): void {
    this.cancelScheduled()
    const transport = asTransport()
    transport.bpm.value = song.tempoBPM * tempoMultiplier
    this.scheduleNotes(song, tempoMultiplier)
  }

  play(): void {
    const transport = asTransport()
    if (this.status === 'started') return
    transport.start()
    this.status = 'started'
    this.startedAtWall =
      (transport as unknown as { seconds?: number }).seconds ?? transport.currentTime ?? null
    this.pausedAt = null
  }

  pause(): void {
    const transport = asTransport()
    if (this.status !== 'started') return
    transport.pause()
    this.status = 'paused'
    this.pausedAt =
      (transport as unknown as { seconds?: number }).seconds ?? transport.currentTime ?? null
  }

  stop(): void {
    const transport = asTransport()
    transport.stop()
    this.cancelScheduled()
    this.status = 'stopped'
    this.startedAtWall = null
    this.pausedAt = null
  }

  /**
   * Restart playback at the given position (seconds from song start).
   * Used by the loop wrap-around in the TransportBridge.
   */
  jumpTo(positionSeconds: number): void {
    const transport = asTransport()
    if (this.status === 'started') {
      transport.start(undefined, positionSeconds)
    } else {
      transport.start(undefined, positionSeconds)
      transport.pause()
    }
    // Re-anchor the wall-clock cursor so the song-relative cursor
    // resumes from positionSeconds.
    const wallNow =
      (transport as unknown as { seconds?: number }).seconds ?? transport.currentTime ?? 0
    this.startedAtWall = wallNow - positionSeconds
    this.pausedAt = null
  }

  getCurrentPositionSeconds(): number {
    const transport = asTransport()
    const wallNow =
      (transport as unknown as { seconds?: number }).seconds ?? transport.currentTime ?? 0
    if (this.startedAtWall === null) return 0
    if (this.status === 'paused' && this.pausedAt !== null) {
      return Math.max(0, this.pausedAt - this.startedAtWall)
    }
    return Math.max(0, wallNow - this.startedAtWall)
  }

  setTempoMultiplier(song: Song, multiplier: number): void {
    const transport = asTransport()
    transport.bpm.value = song.tempoBPM * multiplier
  }

  getStatus(): TransportStatus {
    return { state: this.status, positionSeconds: this.getCurrentPositionSeconds() }
  }

  dispose(): void {
    this.cancelScheduled()
    this.stop()
  }

  private cancelScheduled(): void {
    if (this.current === null) return
    const transport = asTransport()
    for (const id of this.current.noteIds) {
      transport.clear(id)
    }
    this.current = null
  }

  private scheduleNotes(song: Song, tempoMultiplier: number): void {
    const transport = asTransport()
    const noteIds: number[] = []
    // Per BUG-023: Tone.Transport.bpm.value does NOT retroactively rescale
    // events scheduled with raw seconds. Schedule at scaled AudioContext
    // times so slower tempos actually slow playback.
    // Per BUG-035: add PRE_ROLL_SECONDS so audio fires PRE_ROLL_SECONDS
    // after transport.start() — gives the user time to see notes falling
    // before the music catches up. FallingNotes applies the same offset
    // so audio and visual stay in sync.
    const startOffset = transport.currentTime ?? 0
    const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
    for (const note of song.notes) {
      const scaledStart = startOffset + PRE_ROLL_SECONDS + note.startTime / safeMultiplier
      const id = transport.schedule((time: number) => {
        this.toneManager.playNote(midiPitch(note.pitch), DEFAULT_VELOCITY, note.duration, time)
      }, scaledStart)
      noteIds.push(id)
    }
    this.current = { song, noteIds }
  }
}

let singleton: SongTransport | null = null

export const getSongTransport = (toneManager: ToneManager): SongTransport => {
  if (singleton === null) {
    singleton = new SongTransport(toneManager)
  }
  return singleton
}

export const __resetSongTransportForTests = (): void => {
  if (singleton !== null) {
    singleton.dispose()
    singleton = null
  }
}
