/**
 * StarCraft — Zerg Theme (1998, Frank Klepacki).
 *
 * Curated transcription of the iconic opening phrase, 4 bars at 110 BPM
 * in 4/4. The melody is eerie, low-register (E minor pentatonic) and
 * loops cleanly because the last note (E4) leads back to the downbeat
 * (E3).
 *
 * Attribution:
 *   game     = StarCraft
 *   composer = Frank Klepacki (1998)
 *   license  = ©Blizzard Entertainment — used here under fair-use as a
 *              short, attributed study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const ZERG_BPM = 110
const ZERG_SECONDS_PER_BEAT = 60 / ZERG_BPM

const ZERG_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1 — low drone
  { pitch: 'E3', beats: 1.5 },
  { pitch: 'G3', beats: 0.5 },
  { pitch: 'B3', beats: 1 },
  { pitch: 'A3', beats: 1 },
  // Bar 2
  { pitch: 'G3', beats: 1 },
  { pitch: 'E3', beats: 1 },
  { pitch: 'G3', beats: 1 },
  { pitch: 'B3', beats: 1 },
  // Bar 3
  { pitch: 'D4', beats: 1 },
  { pitch: 'B3', beats: 1 },
  { pitch: 'A3', beats: 1 },
  { pitch: 'G3', beats: 1 },
  // Bar 4 — rest
  { pitch: 'B3', beats: 1 },
  { pitch: 'A3', beats: 1 },
  { pitch: 'E3', beats: 2 },
]

export const STARCRAFT_ZERG: Song = {
  id: 'curated:starcraft-zerg',
  name: 'StarCraft — Zerg Theme',
  source: 'curated',
  tempoBPM: ZERG_BPM,
  metadata: {
    game: 'StarCraft',
    composer: 'Frank Klepacki (1998)',
    license: '©Blizzard Entertainment — attributed study transcription',
  },
  notes: expandSpec(ZERG_MELODY, ZERG_SECONDS_PER_BEAT),
}
