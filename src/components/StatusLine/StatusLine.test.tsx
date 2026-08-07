import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'

import { audioReducer } from '../../store/audioSlice.ts'
import { settingsReducer } from '../../store/settingsSlice.ts'
import { songsActions, songsReducer } from '../../store/songsSlice.ts'
import { StatusLine } from './StatusLine.tsx'

const buildStore = () =>
  configureStore({
    reducer: {
      audio: audioReducer,
      songs: songsReducer,
      settings: settingsReducer,
    },
  })

const renderStatusLine = (store: ReturnType<typeof buildStore>) =>
  render(
    <Provider store={store}>
      <StatusLine />
    </Provider>,
  )

describe('StatusLine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when no song is active', () => {
    const store = buildStore()
    const { container } = renderStatusLine(store)
    expect(container.firstChild).toBeNull()
  })

  it('shows song name when a song is active', () => {
    const store = buildStore()
    act(() => {
      store.dispatch(
        songsActions.upsertSong({
          id: 'tetris',
          name: 'Tetris Theme',
          source: 'PD',
          notes: [],
          tempoBPM: 140,
          metadata: {},
        }),
      )
    })
    act(() => {
      store.dispatch(songsActions.setActiveSong('tetris'))
    })
    renderStatusLine(store)
    expect(screen.getByText(/Tetris Theme/)).toBeInTheDocument()
  })
})
