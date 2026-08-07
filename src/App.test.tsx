import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { Layout } from './components/Layout/index.ts'
import { Play } from './pages/Play/index.ts'
import { Settings } from './pages/Settings/index.ts'

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
  return render(<RouterProvider router={router} />)
}

describe('App routing', () => {
  it('renders the /play page', () => {
    renderWithRouter('/play')
    expect(screen.getByRole('heading', { name: 'Play' })).toBeInTheDocument()
  })

  it('renders the /settings page', () => {
    renderWithRouter('/settings')
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
