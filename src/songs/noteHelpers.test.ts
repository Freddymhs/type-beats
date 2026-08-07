import { describe, expect, it } from 'vitest'

import { concatNotes, expandSpec, p } from './noteHelpers.ts'

describe('noteHelpers', () => {
  describe('p()', () => {
    it('maps C4 to MIDI 60', () => {
      expect(p('C4')).toBe(60)
    })

    it('maps F#5 to MIDI 78', () => {
      expect(p('F#5')).toBe(78)
    })

    it('throws on bad notation', () => {
      expect(() => p('H4')).toThrow()
    })
  })

  describe('expandSpec()', () => {
    it('produces one note per spec token with cumulative startTime', () => {
      const out = expandSpec(
        [
          { pitch: 'C4', beats: 1 },
          { pitch: 'D4', beats: 1 },
        ],
        0.5,
      )
      expect(out).toHaveLength(2)
      expect(out[0]!.startTime).toBe(0)
      expect(out[0]!.duration).toBe(0.5)
      expect(out[1]!.startTime).toBe(0.5)
      expect(out[1]!.duration).toBe(0.5)
    })

    it('honors fractional beats', () => {
      const out = expandSpec([{ pitch: 'C4', beats: 0.25 }], 1.0)
      expect(out[0]!.duration).toBe(0.25)
    })
  })

  describe('concatNotes()', () => {
    it('offsets second chunk by total duration of first', () => {
      const merged = concatNotes([
        [{ pitch: p('C4'), startTime: 0, duration: 1 }],
        [{ pitch: p('E4'), startTime: 0, duration: 2 }],
      ])
      expect(merged[0]!.startTime).toBe(0)
      expect(merged[1]!.startTime).toBe(1)
    })

    it('preserves intra-chunk start offsets', () => {
      const merged = concatNotes([
        [
          { pitch: p('C4'), startTime: 0, duration: 1 },
          { pitch: p('E4'), startTime: 1, duration: 1 },
        ],
        [{ pitch: p('G4'), startTime: 0, duration: 1 }],
      ])
      expect(merged[0]!.startTime).toBe(0)
      expect(merged[1]!.startTime).toBe(1)
      expect(merged[2]!.startTime).toBe(2)
    })
  })
})
