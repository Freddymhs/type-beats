/**
 * Ode to Joy — Ludwig van Beethoven, Symphony No. 9, 4th movement (1824).
 * Public domain (composed 1824, Beethoven died 1827).
 *
 * The opening 16 bars in 4/4 at 120 BPM, transposed to start on E4.
 * Quarter notes throughout for simplicity.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const ODE_BPM = 120
const ODE_SECONDS_PER_BEAT = 60 / ODE_BPM

const ODE_TO_JOY_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1-2
  { pitch: 'E4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // Bar 3-4
  { pitch: 'G4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  // Bar 5-6
  { pitch: 'C4', beats: 1 },
  { pitch: 'C4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  // Bar 7-8
  { pitch: 'E4', beats: 1.5 },
  { pitch: 'D4', beats: 0.5 },
  { pitch: 'D4', beats: 2 },
  // Bar 9-10
  { pitch: 'E4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // Bar 11-12
  { pitch: 'G4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  // Bar 13-14
  { pitch: 'C4', beats: 1 },
  { pitch: 'C4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  // Bar 15-16
  { pitch: 'D4', beats: 1.5 },
  { pitch: 'C4', beats: 0.5 },
  { pitch: 'C4', beats: 2 },
]

export const ODE_TO_JOY: Song = {
  id: 'pd:ode-to-joy',
  name: 'Ode to Joy',
  source: 'PD',
  tempoBPM: ODE_BPM,
  metadata: {
    composer: 'Ludwig van Beethoven (1824)',
    license: 'Public Domain',
  },
  notes: expandSpec(ODE_TO_JOY_MELODY, ODE_SECONDS_PER_BEAT),
}
