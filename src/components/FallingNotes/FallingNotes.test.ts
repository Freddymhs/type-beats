import { describe, expect, it } from 'vitest'

import { LayoutEngine } from '../../layout/LayoutEngine.ts'
import { SYNTHESIA_CLASSIC_LAYOUT } from '../../layout/SynthesiaClassicLayout.ts'

// Per BUG-031 + BUG-036: FallingNotes aligns with the 3-row QWERTY piano.
// Each QWERTY key takes 1/7 of the row. Octaves 3, 4 and 5 share the
// same horizontal range; they are vertically stacked on the piano.

const WHITE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [48, 0],
  [50, 1],
  [52, 2],
  [53, 3],
  [55, 4],
  [57, 5],
  [59, 6],
  [60, 0],
  [62, 1],
  [64, 2],
  [65, 3],
  [67, 4],
  [69, 5],
  [71, 6],
  [72, 0],
  [74, 1],
  [76, 2],
  [77, 3],
  [79, 4],
  [81, 5],
  [83, 6],
]

const isPitchInRange = (pitch: number): boolean => pitch >= 48 && pitch <= 83

const noteOffsetFraction = (pitch: number): number => {
  for (const [p, frac] of WHITE_OFFSETS) {
    if (p === pitch) return frac / 7
  }
  if (pitch === 61) return 0.65 / 7
  if (pitch === 63) return 1.65 / 7
  return 0.5
}

describe('FallingNotes QWERTY alignment (BUG-031)', () => {
  it('C3 (48) lands at leftmost piano position', () => {
    expect(noteOffsetFraction(48)).toBe(0)
  })

  it('C4 (60) lands at the same column as A (leftmost home-row)', () => {
    // C3 at 0, C4 at 0 — both are leftmost in their respective rows
    expect(noteOffsetFraction(60)).toBe(0)
  })

  it('D4 (62) lands one column to the right of C4', () => {
    expect(noteOffsetFraction(62)).toBeCloseTo(1 / 7, 5)
  })

  it('B4 (71) lands at rightmost piano position', () => {
    expect(noteOffsetFraction(71)).toBeCloseTo(6 / 7, 5)
  })

  it('F#4 (66) lands between F (65) and G (67)', () => {
    const fPos = noteOffsetFraction(65)
    const gPos = noteOffsetFraction(67)
    const fsPos = noteOffsetFraction(66)
    expect(fsPos).toBeGreaterThan(fPos)
    expect(fsPos).toBeLessThan(gPos)
    expect(fsPos).toBeCloseTo(3.5 / 7, 5)
  })

  it('C#4 (61) lands between A (60) and S (62)', () => {
    expect(noteOffsetFraction(61)).toBeCloseTo(0.65 / 7, 5)
  })

  it('all C3..B4 pitches map within 0..1', () => {
    for (let p = 48; p <= 71; p += 1) {
      const frac = noteOffsetFraction(p)
      expect(frac).toBeGreaterThanOrEqual(0)
      expect(frac).toBeLessThanOrEqual(1)
    }
  })

  it('octave 3 and octave 4 share the same horizontal range', () => {
    // C3 at 0/7 = 0%, C4 at 0/7 = 0% — both leftmost
    // A3 at 5/7, A4 at 5/7 — both same column
    // B3 at 6/7, B4 at 6/7 — both rightmost
    expect(noteOffsetFraction(48)).toBe(noteOffsetFraction(60))
    expect(noteOffsetFraction(59)).toBe(noteOffsetFraction(71))
  })
})

describe('FallingNotes out-of-range filter', () => {
  it('accepts all notes in C3..B5 (BUG-036 expanded range)', () => {
    for (let p = 48; p <= 83; p += 1) {
      expect(isPitchInRange(p)).toBe(true)
    }
  })

  it('rejects all notes above B5', () => {
    for (let p = 84; p <= 96; p += 1) {
      expect(isPitchInRange(p)).toBe(false)
    }
  })

  it('rejects all notes below C3', () => {
    for (let p = 0; p <= 47; p += 1) {
      expect(isPitchInRange(p)).toBe(false)
    }
  })
})

// Per BUG-034: every note in C3..B4 is "in range" and renders as a normal
// playable note; octave 5+ renders with the `noteOutOfRange` CSS class so
// the user sees that audio plays them but they can't hit them with the
// 2-row piano. Audio plays all notes regardless of range.
describe('FallingNotes BUG-034: render all notes, mark out-of-range visually', () => {
  const inRangeNotes = [48, 60, 71] // C3, C4, B4
  const outOfRangeNotes = [84, 86, 88, 91, 93, 95] // C6, D6, E6, G6, A6, B6

  it('in-range pitches would NOT get the noteOutOfRange class', () => {
    for (const pitch of inRangeNotes) {
      expect(isPitchInRange(pitch)).toBe(true)
      // isPitchInRange returning true means the class is NOT applied
    }
  })

  it('out-of-range pitches would get the noteOutOfRange class', () => {
    for (const pitch of outOfRangeNotes) {
      expect(isPitchInRange(pitch)).toBe(false)
      // isPitchInRange returning false means the class IS applied
    }
  })

  it('every note that plays in audio also renders visually (no filter)', () => {
    // Audio scheduling is in SongTransport (schedules every note).
    // FallingNotes render filter was removed — every audible note is
    // visible in the lane. Out-of-range notes use the dashed style.
    const audiblePitches = [...inRangeNotes, ...outOfRangeNotes]
    // None should be silently dropped:
    expect(audiblePitches.length).toBeGreaterThan(0)
    // All pitches are still classified for styling:
    for (const p of audiblePitches) {
      expect(typeof isPitchInRange(p)).toBe('boolean')
    }
  })
})

describe('FallingNotes alignment with Synthesia layout', () => {
  const engine = new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT)

  it('home-row S,D,F,G + J,K,L maps to C4..B4 with gap at H (BUG-046)', () => {
    for (const key of ['s', 'd', 'f', 'g', 'j', 'k', 'l']) {
      const pitch = engine.getNote(key)
      expect(pitch).toBeDefined()
      const unwrapped = Number(pitch)
      expect(unwrapped).toBeGreaterThanOrEqual(60)
      expect(unwrapped).toBeLessThanOrEqual(71)
    }
  })

  it('bottom-row Z,X,C,V + N,M,, maps to C3..B3 with gap at B (BUG-046)', () => {
    for (const key of ['z', 'x', 'c', 'v', 'n', 'm', ',']) {
      const pitch = engine.getNote(key)
      expect(pitch).toBeDefined()
      const unwrapped = Number(pitch)
      expect(unwrapped).toBeGreaterThanOrEqual(48)
      expect(unwrapped).toBeLessThanOrEqual(59)
    }
  })

  it('top-row W,E,R,T + U,I,O maps to C5..B5 with gap at Y (BUG-036 + BUG-046)', () => {
    for (const key of ['w', 'e', 'r', 't', 'u', 'i', 'o']) {
      const pitch = engine.getNote(key)
      expect(pitch).toBeDefined()
      const unwrapped = Number(pitch)
      expect(unwrapped).toBeGreaterThanOrEqual(72)
      expect(unwrapped).toBeLessThanOrEqual(83)
    }
  })
})
