/**
 * Greensleeves — English Renaissance melody, anonymous composer, c. 1580.
 * Public domain (over 400 years old).
 *
 * The opening 16 bars of the standard A section in 3/4 at 100 BPM,
 * transposed to A minor for variety.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const GREENSLEEVES_BPM = 100
const GREENSLEEVES_SECONDS_PER_BEAT = 60 / GREENSLEEVES_BPM

const GREENSLEEVES_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1-2 (Alas, my love, you do me wrong)
  { pitch: 'A4', beats: 2 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'E5', beats: 2 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  // Bar 3-4 (To cast me off discourteously)
  { pitch: 'B4', beats: 2 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'A4', beats: 2 },
  { pitch: 'G4', beats: 2 },
  // Bar 5-6 (I have loved you oh so long)
  { pitch: 'A4', beats: 2 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'E5', beats: 2 },
  { pitch: 'F5', beats: 1 },
  { pitch: 'E5', beats: 1 },
  // Bar 7-8 (Delighting in your company)
  { pitch: 'D5', beats: 2 },
  { pitch: 'E5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'C5', beats: 2 },
  { pitch: 'B4', beats: 2 },
]

export const GREENSLEEVES: Song = {
  id: 'pd:greensleeves',
  name: 'Greensleeves',
  source: 'PD',
  tempoBPM: GREENSLEEVES_BPM,
  metadata: {
    composer: 'Anonymous (c. 1580)',
    license: 'Public Domain',
  },
  notes: expandSpec(GREENSLEEVES_MELODY, GREENSLEEVES_SECONDS_PER_BEAT),
}
