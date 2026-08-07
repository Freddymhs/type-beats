/**
 * App — router shell.
 *
 * F1 routes:
 *   /            → redirect to /play
 *   /play        → QWERTY chiptune studio (F1 core)
 *   /settings    → F2 placeholder
 *
 * Layout wraps every route via a parent route with <Outlet />.
 * SW registration happens via vite-plugin-pwa's virtual module below.
 *
 * <AudioBridge /> mirrors Redux audio state into the ToneManager singleton
 * — must be mounted inside the Redux Provider but outside the Routes so it
 * survives every navigation.
 */

import { useRegisterSW } from 'virtual:pwa-register/react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AudioBridge } from './audio/index.ts'
import { Layout } from './components/Layout/index.ts'
import { Play } from './pages/Play/index.ts'
import { Settings } from './pages/Settings/index.ts'

const REDIRECT_REPLACE = { replace: true } as const

const App = () => {
  useRegisterSW({ immediate: true })

  return (
    <BrowserRouter>
      <AudioBridge />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/play" {...REDIRECT_REPLACE} />} />
          <Route path="/play" element={<Play />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/play" {...REDIRECT_REPLACE} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
