/**
 * Final Fantasy — Prelude (1987, Nobuo Uematsu).
 *
 * Curated transcription of the iconic opening phrase, 8 bars at 96 BPM
 * in 4/4. The melody is stately, arpeggiated (F major) and loops cleanly
 * because the last note (F4) ties back to the downbeat (F4) on the
 * next iteration.
 *
 * Attribution:
 *   game     = Final Fantasy (1987)
 *   composer = Nobuo Uematsu (1987)
 *   license  = ©Square Enix — used here under fair-use as a short,
 *              attributed study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const FF_BPM = 96
const FF_SECONDS_PER_BEAT = 60 / FF_BPM

const FF_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1 — stately ascending arpeggio
  { pitch: 'F4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 2
  { pitch: 'F4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // Bar 3
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  // Bar 4
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'F5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  // Bar 5 — descending sequence
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'F5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  // Bar 6
  { pitch: 'A4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  // Bar 7
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // Bar 8 — turnaround to F4
  { pitch: 'F4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'F4', beats: 2 },
]

export const FF_PRELUDE: Song = {
  id: 'curated:ff-prelude',
  name: 'Final Fantasy — Prelude',
  source: 'curated',
  tempoBPM: FF_BPM,
  metadata: {
    game: 'Final Fantasy (1987)',
    composer: 'Nobuo Uematsu (1987)',
    license: '©Square Enix — attributed study transcription',
  },
  notes: expandSpec(FF_MELODY, FF_SECONDS_PER_BEAT),
}
