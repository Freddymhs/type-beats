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
 * `Tone.Transport.schedule` / `Tone.Transport.start` / `pause` / `stop`.
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
  start: () => void
  pause: () => void
  stop: () => void
  schedule: (cb: (time: number) => void, time: number) => number
  clear: (id: number) => void
  bpm: { value: number }
}

const asTransport = (): TransportLike => Tone.getTransport() as unknown as TransportLike

const DEFAULT_VELOCITY = makeVelocity(100)

export class SongTransport {
  private current: ScheduledSong | null = null
  private status: TransportStatus['state'] = 'stopped'
  private readonly toneManager: ToneManager

  constructor(toneManager: ToneManager) {
    this.toneManager = toneManager
  }

  loadSong(song: Song, tempoMultiplier: number): void {
    this.cancelScheduled()
    const transport = asTransport()
    transport.bpm.value = song.tempoBPM * tempoMultiplier
    this.scheduleNotes(song)
  }

  play(): void {
    const transport = asTransport()
    if (this.status === 'started') return
    transport.start()
    this.status = 'started'
  }

  pause(): void {
    const transport = asTransport()
    if (this.status !== 'started') return
    transport.pause()
    this.status = 'paused'
  }

  stop(): void {
    const transport = asTransport()
    transport.stop()
    this.cancelScheduled()
    this.status = 'stopped'
  }

  setTempoMultiplier(song: Song, multiplier: number): void {
    const transport = asTransport()
    transport.bpm.value = song.tempoBPM * multiplier
  }

  getStatus(): TransportStatus {
    const transport = asTransport()
    const positionSeconds = transport.position ?? transport.currentTime ?? 0
    return { state: this.status, positionSeconds }
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

  private scheduleNotes(song: Song): void {
    const transport = asTransport()
    const noteIds: number[] = []
    const startOffset = transport.currentTime ?? 0
    for (const note of song.notes) {
      const id = transport.schedule((time: number) => {
        this.toneManager.playNote(midiPitch(note.pitch), DEFAULT_VELOCITY, note.duration, time)
      }, startOffset + note.startTime)
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
