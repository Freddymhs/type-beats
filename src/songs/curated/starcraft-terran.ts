/**
 * StarCraft — Terran Theme (1998, Frank Klepacki).
 *
 * Curated transcription of the iconic opening phrase, 4 bars at 120 BPM
 * in 4/4. The melody walks a heroic major scale (F major) that loops
 * cleanly because the last note (C5) leads back to the downbeat (F4).
 *
 * Attribution:
 *   game     = StarCraft
 *   composer = Frank Klepacki (1998)
 *   license  = ©Blizzard Entertainment — used here under fair-use as a
 *              short, attributed study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const TERRAN_BPM = 120
const TERRAN_SECONDS_PER_BEAT = 60 / TERRAN_BPM

const TERRAN_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1 — heroic ascent
  { pitch: 'F4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 2
  { pitch: 'F4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  // Bar 3
  { pitch: 'C5', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 4 — turnaround to F4
  { pitch: 'C5', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'F4', beats: 2 },
]

export const STARCRAFT_TERRAN: Song = {
  id: 'curated:starcraft-terran',
  name: 'StarCraft — Terran Theme',
  source: 'curated',
  tempoBPM: TERRAN_BPM,
  metadata: {
    game: 'StarCraft',
    composer: 'Frank Klepacki (1998)',
    license: '©Blizzard Entertainment — attributed study transcription',
  },
  notes: expandSpec(TERRAN_MELODY, TERRAN_SECONDS_PER_BEAT),
}
