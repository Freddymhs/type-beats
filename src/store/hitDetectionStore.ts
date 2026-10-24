/**
 * Shared claimed-note registry used by both the hit-detection middleware
 * (which marks notes as claimed on hit) and the HintLane (which reads
 * the claimed set so it doesn't hint at notes that already scored).
 *
 * Lives outside React so both the Redux middleware and the hint lane
 * can reach it without a context bridge.
 */

const claimedBySong = new Map<string, Set<string>>()

export const claimNote = (songId: string, noteIndex: number): void => {
  let set = claimedBySong.get(songId)
  if (set === undefined) {
    set = new Set()
    claimedBySong.set(songId, set)
  }
  set.add(`${songId}#${noteIndex}`)
}

export const isNoteClaimed = (songId: string, noteIndex: number): boolean => {
  const set = claimedBySong.get(songId)
  return set !== undefined && set.has(`${songId}#${noteIndex}`)
}

export const readClaimedNoteIds = (songId: string): ReadonlySet<string> => {
  const set = claimedBySong.get(songId)
  return set ?? new Set<string>()
}

export const resetClaimedForSong = (songId: string): void => {
  claimedBySong.set(songId, new Set())
}

export const __resetAllClaimed = (): void => {
  claimedBySong.clear()
}
