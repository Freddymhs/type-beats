/**
 * Dexie schema and DB wrapper — IndexedDB persistence layer.
 *
 * Source of truth for tables:
 *   - songs     → song library (PD/curated/imported)
 *   - layouts   → custom + preset keyboard layouts
 *   - progress  → per-song practice data
 *   - settings  → user prefs (single-row key-value)
 *
 * Discipline (CLAUDE.md §0):
 *   - DB rows are immutable values from src/types/*.
 *   - Hydration Dexie ↔ RTK lands in F1 via createListenerMiddleware.
 *   - This module is pure data access — no React, no Redux imports.
 *
 * Schema version 1: minimal viable tables. Bump version + add upgrade()
 * when adding columns or tables (never edit v1 in place).
 */

import Dexie, { type Table } from 'dexie'

import type { Song } from '../types/index.ts'
import type { Layout } from '../types/layout.ts'

export interface ProgressRow {
  readonly songId: string
  readonly bestScore: number
  readonly lastPlayedAt: number
  readonly timesPlayed: number
}

export interface SettingsRow {
  readonly id: 'singleton'
  readonly defaultOctave: number
  readonly velocityCurve: string
  readonly theme: string
  readonly defaultTimbreId: string
}

const SONGS_TABLE = 'songs'
const LAYOUTS_TABLE = 'layouts'
const PROGRESS_TABLE = 'progress'
const SETTINGS_TABLE = 'settings'

const SETTINGS_SINGLETON_ID = 'singleton' as const

export class TypeBeatsDB extends Dexie {
  songs!: Table<Song, string>
  layouts!: Table<Layout, string>
  progress!: Table<ProgressRow, string>
  settings!: Table<SettingsRow, string>

  constructor() {
    super('type-beats')
    this.version(1).stores({
      [SONGS_TABLE]: 'id, source, name',
      [LAYOUTS_TABLE]: 'id',
      [PROGRESS_TABLE]: 'songId, lastPlayedAt',
      [SETTINGS_TABLE]: 'id',
    })
  }
}

let dbInstance: TypeBeatsDB | null = null

/**
 * Returns the process-wide Dexie instance. Lazy so SSR / unit tests
 * don't open IndexedDB on import.
 */
export const getDB = (): TypeBeatsDB => {
  if (dbInstance === null) {
    dbInstance = new TypeBeatsDB()
  }
  return dbInstance
}

/**
 * Test-only reset hook. Closes the DB and clears the singleton.
 */
export const __resetDBForTests = async (): Promise<void> => {
  if (dbInstance !== null) {
    await dbInstance.close()
    dbInstance = null
  }
}

// ---------- High-level helpers ----------

export const saveSong = async (song: Song): Promise<void> => {
  await getDB().songs.put(song)
}

export const getSongById = async (id: string): Promise<Song | undefined> => getDB().songs.get(id)

export const listSongs = async (): Promise<ReadonlyArray<Song>> =>
  getDB().songs.orderBy('name').toArray()

export const deleteSong = async (id: string): Promise<void> => {
  await getDB().songs.delete(id)
}

export const saveLayout = async (layout: Layout): Promise<void> => {
  await getDB().layouts.put(layout)
}

export const getLayoutById = async (id: string): Promise<Layout | undefined> =>
  getDB().layouts.get(id)

export const listLayouts = async (): Promise<ReadonlyArray<Layout>> => getDB().layouts.toArray()

export const saveProgress = async (row: ProgressRow): Promise<void> => {
  await getDB().progress.put(row)
}

export const getProgressForSong = async (songId: string): Promise<ProgressRow | undefined> =>
  getDB().progress.get(songId)

export const saveSettings = async (settings: SettingsRow): Promise<void> => {
  await getDB().settings.put(settings)
}

export const getSettings = async (): Promise<SettingsRow | undefined> =>
  getDB().settings.get(SETTINGS_SINGLETON_ID)

export const SETTINGS_SINGLETON_KEY = SETTINGS_SINGLETON_ID
