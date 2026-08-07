/**
 * Song library barrel — all F1 PD starter songs.
 *
 * Per CLAUDE.md §0: songs are immutable data exported as named constants;
 * the consumer (songsSlice) holds the active selection.
 *
 * Adding a song = add a file under pd/ and append to PD_STARTER_SONGS.
 */

import type { Song } from '../types/index.ts'
import { GREENSLEEVES } from './pd/greensleeves.ts'
import { ODE_TO_JOY } from './pd/ode-to-joy.ts'
import { SCARBOROUGH_FAIR } from './pd/scarborough-fair.ts'
import { TETRIS } from './pd/tetris.ts'
import { TWINKLE } from './pd/twinkle.ts'

export { GREENSLEEVES } from './pd/greensleeves.ts'
export { ODE_TO_JOY } from './pd/ode-to-joy.ts'
export { SCARBOROUGH_FAIR } from './pd/scarborough-fair.ts'
export { TETRIS } from './pd/tetris.ts'
export { TWINKLE } from './pd/twinkle.ts'

export const PD_STARTER_SONGS: ReadonlyArray<Song> = [
  TETRIS,
  ODE_TO_JOY,
  TWINKLE,
  GREENSLEEVES,
  SCARBOROUGH_FAIR,
]
