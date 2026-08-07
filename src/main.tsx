import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider as ReduxProvider } from 'react-redux'

import './index.css'
import App from './App.tsx'
import { ToneManagerProvider, getToneManager } from './audio/index.ts'
import { LayoutEngineProvider } from './layout/index.ts'
import { store } from './store/index.ts'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('main: missing #root element')
}

const toneManager = getToneManager()

createRoot(rootElement).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <ToneManagerProvider value={toneManager}>
        <LayoutEngineProvider>
          <App />
        </LayoutEngineProvider>
      </ToneManagerProvider>
    </ReduxProvider>
  </StrictMode>,
)
