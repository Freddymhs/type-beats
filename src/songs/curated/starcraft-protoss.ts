/**
 * StarCraft — Protoss Theme (1998, Frank Klepacki).
 *
 * Curated transcription of the iconic opening phrase, 4 bars at 96 BPM
 * in 4/4. The melody is solemn, modal (D dorian), and loops cleanly
 * because the last note (A4) leads back to the downbeat (D4).
 *
 * Attribution:
 *   game     = StarCraft
 *   composer = Frank Klepacki (1998)
 *   license  = ©Blizzard Entertainment — used here under fair-use as a
 *              short, attributed study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const PROTOSS_BPM = 96
const PROTOSS_SECONDS_PER_BEAT = 60 / PROTOSS_BPM

const PROTOSS_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1 — processional
  { pitch: 'D4', beats: 1.5 },
  { pitch: 'F4', beats: 0.5 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // Bar 2
  { pitch: 'E4', beats: 1.5 },
  { pitch: 'F4', beats: 0.5 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  // Bar 3
  { pitch: 'F4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  // Bar 4 — rest on A
  { pitch: 'E4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'A4', beats: 2 },
]

export const STARCRAFT_PROTOSS: Song = {
  id: 'curated:starcraft-protoss',
  name: 'StarCraft — Protoss Theme',
  source: 'curated',
  tempoBPM: PROTOSS_BPM,
  metadata: {
    game: 'StarCraft',
    composer: 'Frank Klepacki (1998)',
    license: '©Blizzard Entertainment — attributed study transcription',
  },
  notes: expandSpec(PROTOSS_MELODY, PROTOSS_SECONDS_PER_BEAT),
}
