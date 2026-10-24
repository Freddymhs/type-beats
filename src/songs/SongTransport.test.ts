import { describe, expect, it, beforeEach, vi } from 'vitest'

import { SongTransport, __resetSongTransportForTests } from './SongTransport.ts'
import { midiPitch, type Note } from '../types/index.ts'
import type { ToneManager } from '../audio/ToneManager.ts'
import type { Song } from '../types/index.ts'

interface ScheduledCallback {
  readonly cb: (time: number) => void
  readonly time: number
}

const fakeTransport = {
  state: 'stopped',
  currentTime: 10,
  seconds: 0,
  bpm: { value: 120 },
  position: '0:0:0',
  start: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  schedule: vi.fn(),
  clear: vi.fn(),
  scheduled: [] as ScheduledCallback[],
}

let nextId = 0

vi.mock('tone', () => ({
  getTransport: () => fakeTransport,
}))

const makeNote = (pitch: number, startTime: number, duration = 0.5): Note => ({
  pitch: midiPitch(pitch),
  startTime,
  duration,
})

const makeSong = (notes: ReadonlyArray<Note>, tempoBPM = 120): Song => ({
  id: 'test-song',
  name: 'Test Song',
  source: 'PD',
  tempoBPM,
  notes,
  metadata: { composer: 'test', license: 'PD' },
})

describe('SongTransport — tempo scaling (BUG-023)', () => {
  let toneManager: ToneManager
  let transport: SongTransport

  beforeEach(() => {
    __resetSongTransportForTests()
    fakeTransport.scheduled = []
    fakeTransport.currentTime = 10
    fakeTransport.bpm.value = 120
    fakeTransport.schedule.mockClear()
    fakeTransport.schedule.mockImplementation((cb: (time: number) => void, time: number) => {
      fakeTransport.scheduled.push({ cb, time })
      return nextId++
    })
    fakeTransport.clear.mockClear()
    nextId = 0
    toneManager = {
      playNote: vi.fn(),
      panic: vi.fn(),
    } as unknown as ToneManager
    transport = new SongTransport(toneManager)
  })

  it('schedules notes at scaled wall-clock times when tempoMultiplier < 1', () => {
    const song = makeSong([makeNote(60, 0), makeNote(64, 5), makeNote(67, 10)])

    transport.loadSong(song, 0.5)

    const times = fakeTransport.scheduled.map((s) => s.time)
    // Per BUG-035: PRE_ROLL_SECONDS (5, was 2 — BUG-042) is added so audio fires after the
    // visual has had time to fall. startOffset (10) + 5 + note.startTime/safe.
    expect(times[0]).toBe(15) // 10 + 5 + 0
    expect(times[1]).toBe(25) // 10 + 5 + 5/0.5
    expect(times[2]).toBe(35) // 10 + 5 + 10/0.5
  })

  it('schedules notes at identity wall-clock times when tempoMultiplier = 1', () => {
    const song = makeSong([makeNote(60, 0), makeNote(64, 5)])
    transport.loadSong(song, 1)

    const times = fakeTransport.scheduled.map((s) => s.time)
    expect(times[0]).toBe(15) // 10 + 5 + 0
    expect(times[1]).toBe(20) // 10 + 5 + 5
  })

  it('schedules notes at compressed wall-clock times when tempoMultiplier > 1', () => {
    const song = makeSong([makeNote(60, 0), makeNote(64, 10)])
    transport.loadSong(song, 2)

    const times = fakeTransport.scheduled.map((s) => s.time)
    expect(times[0]).toBe(15) // 10 + 5 + 0
    expect(times[1]).toBe(20) // 10 + 5 + 10/2
  })

  it('schedules ALL notes regardless of pitch range (BUG-029)', () => {
    const song = makeSong([
      makeNote(48, 0), // C3
      makeNote(72, 1), // C5 (out of FallingNotes range, still plays)
      makeNote(83, 2), // B5
    ])
    transport.loadSong(song, 1)
    expect(fakeTransport.schedule).toHaveBeenCalledTimes(3)
  })

  it('updates transport.bpm.value when tempoMultiplier changes', () => {
    const song = makeSong([], 140)
    transport.loadSong(song, 1)
    expect(fakeTransport.bpm.value).toBe(140)

    transport.setTempoMultiplier(song, 0.5)
    expect(fakeTransport.bpm.value).toBe(70)

    transport.setTempoMultiplier(song, 2)
    expect(fakeTransport.bpm.value).toBe(280)
  })

  it('cancels previous schedule when re-loading a song', () => {
    const song1 = makeSong([makeNote(60, 0)])
    const song2 = makeSong([makeNote(64, 0)])
    transport.loadSong(song1, 1)
    expect(fakeTransport.schedule).toHaveBeenCalledTimes(1)

    transport.loadSong(song2, 1)
    expect(fakeTransport.clear).toHaveBeenCalledTimes(1)
    expect(fakeTransport.schedule).toHaveBeenCalledTimes(2)
  })

  it('does not crash on tempoMultiplier = 0 (uses safe default 1)', () => {
    const song = makeSong([makeNote(60, 0), makeNote(64, 5)])
    transport.loadSong(song, 0)
    const times = fakeTransport.scheduled.map((s) => s.time)
    expect(times[0]).toBe(15) // 10 + 5 + 0 (safe default multiplier = 1)
    expect(times[1]).toBe(20) // 10 + 5 + 5
  })

  it('calls toneManager.playNote with the correct pitch on each scheduled callback', () => {
    const song = makeSong([makeNote(60, 0), makeNote(64, 5)])
    transport.loadSong(song, 1)

    // Manually fire the scheduled callbacks to verify they route to playNote.
    const playNote = toneManager.playNote as ReturnType<typeof vi.fn>
    playNote.mockClear()
    for (const scheduled of fakeTransport.scheduled) {
      scheduled.cb(scheduled.time)
    }

    expect(playNote).toHaveBeenCalledTimes(2)
    // First call: C4 (60), second: E4 (64)
    expect(playNote.mock.calls[0]?.[0]).toBe(midiPitch(60))
    expect(playNote.mock.calls[1]?.[0]).toBe(midiPitch(64))
  })

  // Per BUG-035: every note is delayed by PRE_ROLL_SECONDS so the user has
  // time to see notes falling before audio catches up. Same offset is
  // applied in FallingNotes.computeTransformY for visual sync.
  it('applies PRE_ROLL_SECONDS offset to every scheduled note (BUG-035)', () => {
    const song = makeSong([makeNote(60, 0), makeNote(64, 5), makeNote(67, 10)])
    transport.loadSong(song, 1)

    const times = fakeTransport.scheduled.map((s) => s.time)
    // All notes should be PRE_ROLL_SECONDS (3, BUG-041) later than startOffset (10).
    const expectedBase = 10 + 5 // startOffset + PRE_ROLL
    expect(times[0]).toBe(expectedBase + 0)
    expect(times[1]).toBe(expectedBase + 5)
    expect(times[2]).toBe(expectedBase + 10)
  })
})
