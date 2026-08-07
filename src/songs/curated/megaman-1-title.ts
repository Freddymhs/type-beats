/**
 * Mega Man 1 — Title Theme (1987, Manami Matsumae).
 *
 * Curated transcription of the iconic opening phrase, 4 bars at 140 BPM
 * in 4/4. The melody is upbeat, hopping (G major) and loops cleanly
 * because the last note (G4) leads back to the downbeat (G4).
 *
 * Attribution:
 *   game     = Mega Man 1
 *   composer = Manami Matsumae (1987)
 *   license  = ©Capcom — used here under fair-use as a short, attributed
 *              study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const MEGAMAN_BPM = 140
const MEGAMAN_SECONDS_PER_BEAT = 60 / MEGAMAN_BPM

const MEGAMAN_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1 — opening hop
  { pitch: 'G4', beats: 0.5 },
  { pitch: 'D4', beats: 0.5 },
  { pitch: 'G4', beats: 0.5 },
  { pitch: 'A4', beats: 0.5 },
  { pitch: 'B4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 2
  { pitch: 'G4', beats: 0.5 },
  { pitch: 'D4', beats: 0.5 },
  { pitch: 'G4', beats: 0.5 },
  { pitch: 'A4', beats: 0.5 },
  { pitch: 'B4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  // Bar 3
  { pitch: 'D5', beats: 1 },
  { pitch: 'B4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // Bar 4 — turnaround
  { pitch: 'A4', beats: 1 },
  { pitch: 'B4', beats: 1 },
  { pitch: 'G4', beats: 2 },
]

export const MEGAMAN_1_TITLE: Song = {
  id: 'curated:megaman-1-title',
  name: 'Mega Man 1 — Title',
  source: 'curated',
  tempoBPM: MEGAMAN_BPM,
  metadata: {
    game: 'Mega Man 1',
    composer: 'Manami Matsumae (1987)',
    license: '©Capcom — attributed study transcription',
  },
  notes: expandSpec(MEGAMAN_MELODY, MEGAMAN_SECONDS_PER_BEAT),
}
