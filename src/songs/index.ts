/**
 * Song library barrel — PD starter songs + curated game-music catalog.
 *
 * Per CLAUDE.md §0: songs are immutable data exported as named constants;
 * the consumer (songsSlice) holds the active selection.
 *
 * Adding a song:
 *   - Public-domain work → file under pd/ and append to PD_STARTER_SONGS.
 *   - Curated game music → file under curated/ and append to CURATED_SONGS.
 *   Always include attribution (game, composer, year, license) in metadata.
 */

import type { Song } from '../types/index.ts'
import { GREENSLEEVES } from './pd/greensleeves.ts'
import { ODE_TO_JOY } from './pd/ode-to-joy.ts'
import { SCARBOROUGH_FAIR } from './pd/scarborough-fair.ts'
import { TETRIS } from './pd/tetris.ts'
import { TWINKLE } from './pd/twinkle.ts'
import { STARCRAFT_TERRAN } from './curated/starcraft-terran.ts'
import { STARCRAFT_PROTOSS } from './curated/starcraft-protoss.ts'
import { STARCRAFT_ZERG } from './curated/starcraft-zerg.ts'
import { ZELDA_OOT_MAIN } from './curated/zelda-oot-main.ts'
import { MEGAMAN_1_TITLE } from './curated/megaman-1-title.ts'
import { METROID_TITLE } from './curated/metroid-title.ts'
import { FF_PRELUDE } from './curated/ff-prelude.ts'

export { GREENSLEEVES } from './pd/greensleeves.ts'
export { ODE_TO_JOY } from './pd/ode-to-joy.ts'
export { SCARBOROUGH_FAIR } from './pd/scarborough-fair.ts'
export { TETRIS } from './pd/tetris.ts'
export { TWINKLE } from './pd/twinkle.ts'

export { STARCRAFT_TERRAN } from './curated/starcraft-terran.ts'
export { STARCRAFT_PROTOSS } from './curated/starcraft-protoss.ts'
export { STARCRAFT_ZERG } from './curated/starcraft-zerg.ts'
export { ZELDA_OOT_MAIN } from './curated/zelda-oot-main.ts'
export { MEGAMAN_1_TITLE } from './curated/megaman-1-title.ts'
export { METROID_TITLE } from './curated/metroid-title.ts'
export { FF_PRELUDE } from './curated/ff-prelude.ts'

export { SongTransport, getSongTransport, __resetSongTransportForTests } from './SongTransport.ts'

export const PD_STARTER_SONGS: ReadonlyArray<Song> = [
  TETRIS,
  ODE_TO_JOY,
  TWINKLE,
  GREENSLEEVES,
  SCARBOROUGH_FAIR,
]

export const CURATED_SONGS: ReadonlyArray<Song> = [
  STARCRAFT_TERRAN,
  STARCRAFT_PROTOSS,
  STARCRAFT_ZERG,
  ZELDA_OOT_MAIN,
  MEGAMAN_1_TITLE,
  METROID_TITLE,
  FF_PRELUDE,
]
