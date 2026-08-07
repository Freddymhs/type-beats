import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider as ReduxProvider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Layout } from './components/Layout/index.ts'
import { Play } from './pages/Play/index.ts'
import { Settings } from './pages/Settings/index.ts'
import { audioReducer } from './store/audioSlice.ts'
import { settingsReducer } from './store/settingsSlice.ts'
import { layoutReducer } from './store/layoutSlice.ts'
import { progressReducer } from './store/progressSlice.ts'
import { songsReducer } from './store/songsSlice.ts'

vi.mock('./audio/ToneContext.tsx', () => ({
  ToneManagerProvider: ({ children }: { children: ReactNode }) => children,
  useToneManager: () => ({
    isStarted: () => true,
    start: () => Promise.resolve(),
    holdNote: () => undefined,
    releaseNote: () => undefined,
    panic: () => undefined,
  }),
}))

vi.mock('./layout/LayoutContext.tsx', () => ({
  LayoutEngineProvider: ({ children }: { children: ReactNode }) => children,
  useLayoutEngine: () => ({
    getNote: () => undefined,
    getKey: () => undefined,
    isModifier: () => false,
    getModifier: () => undefined,
    getGroup: () => undefined,
    getId: () => 'test',
    getName: () => 'test',
    getCompiled: () => ({}),
  }),
}))

const buildStore = () =>
  configureStore({
    reducer: {
      audio: audioReducer,
      settings: settingsReducer,
      layout: layoutReducer,
      progress: progressReducer,
      songs: songsReducer,
    },
  })

const renderWithRouter = (initialPath: string) => {
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Play /> },
          { path: 'play', element: <Play /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ReduxProvider store={buildStore()}>{children}</ReduxProvider>
  )
  return render(
    <Wrapper>
      <RouterProvider router={router} />
    </Wrapper>,
  )
}

describe('App routing', () => {
  it('renders the /play page', () => {
    renderWithRouter('/play')
    expect(screen.getByRole('region', { name: 'Play page' })).toBeInTheDocument()
  })

  it('renders the /settings page', () => {
    renderWithRouter('/settings')
    expect(screen.getByRole('region', { name: 'Settings page' })).toBeInTheDocument()
  })
})
