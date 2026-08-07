/**
 * Tetris Theme (Korobeiniki) — traditional Russian folk melody adapted for
 * Tetris by Hirokazu Tanaka (1989). Public domain.
 *
 * Melody, A section, 4 bars at 140 BPM in 2/4. Each quarter note = 60/140 ≈ 0.4286s.
 * The arrangement loops cleanly because the last beat (E5) ties back to the
 * first beat of the next iteration.
 */

import type { Song } from '../../types/index.ts'
import { concatNotes, expandSpec, type SpecNote } from '../noteHelpers.ts'

const TETRIS_BPM = 140
const TETRIS_SECONDS_PER_BEAT = 60 / TETRIS_BPM

// A section: E5 E5 B4 C5 D5 C5 B4 A4 / A4 C5 E5 D5 C5 B4 C5 A4 / ...
// We transcribe the iconic 8-bar loop into 16th-note + 8th-note phrasing.
const A_SECTION: ReadonlyArray<SpecNote> = [
  { pitch: 'E5', beats: 0.5 },
  { pitch: 'B4', beats: 0.25 },
  { pitch: 'C5', beats: 0.25 },
  { pitch: 'D5', beats: 0.5 },
  { pitch: 'C5', beats: 0.25 },
  { pitch: 'B4', beats: 0.25 },
  { pitch: 'A4', beats: 0.5 },
  { pitch: 'A4', beats: 0.25 },
  { pitch: 'C5', beats: 0.25 },
  { pitch: 'E5', beats: 0.5 },
  { pitch: 'D5', beats: 0.25 },
  { pitch: 'C5', beats: 0.25 },
  { pitch: 'B4', beats: 0.5 },
  { pitch: 'B4', beats: 0.25 },
  { pitch: 'C5', beats: 0.25 },
  { pitch: 'D5', beats: 0.5 },
  { pitch: 'E5', beats: 0.5 },
  { pitch: 'C5', beats: 0.5 },
  { pitch: 'A4', beats: 0.5 },
  { pitch: 'A4', beats: 0.5 },
]

const notes = expandSpec(A_SECTION, TETRIS_SECONDS_PER_BEAT)

export const TETRIS: Song = {
  id: 'pd:tetris',
  name: 'Tetris (Korobeiniki)',
  source: 'PD',
  tempoBPM: TETRIS_BPM,
  metadata: {
    game: 'Tetris',
    composer: 'Traditional / H. Tanaka (1989)',
    license: 'Public Domain',
  },
  notes: concatNotes([notes]),
}
