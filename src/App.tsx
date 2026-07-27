import { useRegisterSW } from 'virtual:pwa-register/react'

import styles from './App.module.css'

const APP_NAME = 'type-beats'
const APP_DESCRIPTION = 'QWERTY chiptune studio para pausas de estudio.'

function App() {
  const { offlineReady } = useRegisterSW()
  const [isOfflineReady] = offlineReady

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>{APP_NAME}</h1>
      <p className={styles.description}>{APP_DESCRIPTION}</p>
      <section aria-label="Estado del service worker" className={styles.status}>
        <p>
          Service worker:{' '}
          <span className={isOfflineReady ? styles.ready : styles.pending}>
            {isOfflineReady ? 'listo para uso offline' : 'registrando...'}
          </span>
        </p>
      </section>
    </main>
  )
}

export default App
