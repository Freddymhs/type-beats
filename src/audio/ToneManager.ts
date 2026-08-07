/**
 * ToneManager — singleton wrapper around Tone.js.
 *
 * Disciplina (CLAUDE.md §0):
 *   - Tone.js instances NEVER live in Redux. AudioContext no serializa.
 *   - Esta clase owns AudioContext + Map<TimbreId, Tone.PolySynth>.
 *   - Redux guarda solo `selectedTimbreId: string`; el bridge se hace
 *     en un useEffect que llama `swapSynth`.
 *
 * Single source of timing = `Tone.Transport.currentTime` (no Date.now).
 *
 * Browser autoplay: `start()` debe llamarse desde un click handler real
 * antes del primer note. Una vez unlocked, el AudioContext queda vivo.
 *
 * Polyphony: each timbre owns a PolySynth wrapping Synth (4 voices by
 * default — enough for typical chiptune 4-voice polyphony from the concept).
 */

import * as Tone from 'tone'
import type { Envelope, MidiPitch, Timbre, Velocity } from '../types/index.ts'

const DEFAULT_TIMBRE_ID = 'square'
const DEFAULT_VOLUME_DB = -6
const DEFAULT_POLYPHONY = 4

const envelopeToToneOptions = (envelope: Envelope): Partial<Tone.SynthOptions> =>
  ({
    envelope: {
      attack: envelope.attack,
      decay: envelope.decay,
      sustain: envelope.sustain,
      release: envelope.release,
    },
  }) as Partial<Tone.SynthOptions>

interface ActiveNote {
  readonly pitch: MidiPitch
  readonly velocity: Velocity
  readonly scheduledAt: number
}

export interface ToneManagerState {
  readonly started: boolean
  readonly activeTimbreId: string | null
  readonly masterVolumeDb: number
  readonly activeNoteCount: number
}

type TimbreSynth = Tone.PolySynth<Tone.Synth>

export class ToneManager {
  private synths: Map<string, TimbreSynth> = new Map()
  private activeTimbreId: string | null = null
  private activeSynth: TimbreSynth | null = null
  private readonly activeNotes: Map<MidiPitch, ActiveNote> = new Map()
  private started = false
  private masterVolumeDb = DEFAULT_VOLUME_DB

  /**
   * Unlock the AudioContext. MUST be called from a user gesture handler
   * (click, keydown) on first use. Subsequent calls are no-ops.
   */
  async start(): Promise<void> {
    if (this.started) return
    await Tone.start()
    this.started = true
  }

  isStarted(): boolean {
    return this.started
  }

  getState(): ToneManagerState {
    return {
      started: this.started,
      activeTimbreId: this.activeTimbreId,
      masterVolumeDb: this.masterVolumeDb,
      activeNoteCount: this.activeNotes.size,
    }
  }

  /**
   * Compile a Timbre into a live PolySynth(Synth) and make it the active synth.
   * Existing synths are kept (warm pool) — only one is connected at a time.
   */
  swapSynth(timbre: Timbre): void {
    const { id } = timbre
    let synth = this.synths.get(id)
    if (synth === undefined) {
      const polyOptions = {
        voice: Tone.Synth,
        maxPolyphony: DEFAULT_POLYPHONY,
        volume: DEFAULT_VOLUME_DB,
        options: envelopeToToneOptions(timbre.envelope),
      }
      synth = new Tone.PolySynth(polyOptions as unknown as Tone.PolySynthOptions<Tone.Synth>)
      this.synths.set(id, synth)
    }

    if (this.activeSynth !== synth) {
      if (this.activeSynth !== null) {
        this.activeSynth.disconnect()
        this.activeNotes.clear()
      }
      synth.toDestination()
      this.activeSynth = synth
    }
    this.activeSynth.volume.value = this.masterVolumeDb
    this.activeTimbreId = id
  }

  getActiveTimbreId(): string | null {
    return this.activeTimbreId
  }

  setMasterVolumeDb(db: number): void {
    this.masterVolumeDb = db
    if (this.activeSynth !== null) {
      this.activeSynth.volume.value = db
    }
  }

  /**
   * Schedule a note. If `at` is omitted, plays immediately (AudioContext time).
   * Uses Tone.Transport scheduling semantics — single source of truth for timing.
   */
  playNote(pitch: MidiPitch, velocity: Velocity, duration: number, at?: number): void {
    if (this.activeSynth === null) {
      throw new Error('ToneManager: no active synth — call swapSynth() first')
    }
    const frequency = Tone.Frequency(pitch, 'midi').toFrequency()
    const normalizedVelocity = (velocity / 127) as number
    this.activeSynth.triggerAttackRelease(frequency, duration, at, normalizedVelocity)
  }

  /**
   * Hold a note (sustained) until releaseNote() is called or panic().
   */
  holdNote(pitch: MidiPitch, velocity: Velocity, at?: number): void {
    if (this.activeSynth === null) {
      throw new Error('ToneManager: no active synth — call swapSynth() first')
    }
    const frequency = Tone.Frequency(pitch, 'midi').toFrequency()
    const normalizedVelocity = (velocity / 127) as number
    const scheduledAt = at ?? Tone.now()
    this.activeSynth.triggerAttack(frequency, scheduledAt, normalizedVelocity)
    this.activeNotes.set(pitch, { pitch, velocity, scheduledAt })
  }

  releaseNote(pitch: MidiPitch, at?: number): void {
    if (this.activeSynth === null) return
    if (!this.activeNotes.has(pitch)) return
    const scheduledAt = at ?? Tone.now()
    const frequency = Tone.Frequency(pitch, 'midi').toFrequency()
    this.activeSynth.triggerRelease(frequency, scheduledAt)
    this.activeNotes.delete(pitch)
  }

  /**
   * Release all active notes immediately. Use on panic / context loss / unmount.
   */
  panic(): void {
    if (this.activeSynth === null) return
    this.activeSynth.releaseAll()
    this.activeNotes.clear()
  }

  /**
   * Tear down all synths and reset state. Call on unmount or full reset.
   */
  dispose(): void {
    this.panic()
    for (const synth of this.synths.values()) {
      synth.dispose()
    }
    this.synths.clear()
    this.activeSynth = null
    this.activeTimbreId = null
    this.started = false
  }
}

let singleton: ToneManager | null = null

/**
 * Returns the process-wide ToneManager. Lazy-initialized so SSR / tests
 * without a window don't trigger Tone.js side effects.
 */
export const getToneManager = (): ToneManager => {
  if (singleton === null) {
    singleton = new ToneManager()
  }
  return singleton
}

/**
 * Test-only reset hook. Allows Vitest to spin up fresh instances between runs.
 */
export const __resetToneManagerForTests = (): void => {
  if (singleton !== null) {
    singleton.dispose()
    singleton = null
  }
}

export const DEFAULT_TONE_TIMBRE_ID = DEFAULT_TIMBRE_ID
