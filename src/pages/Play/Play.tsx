/**
 * /play — F1 placeholder.
 *
 * Real implementation lands in task 1.B (QWERTY listener + ToneManager
 * integration) and tasks 1.C/1.D (VisualPiano + FallingNotes components).
 */

import styles from './Play.module.css'

const PLACEHOLDER_TITLE = 'Play'
const PLACEHOLDER_SUBTITLE = 'QWERTY chiptune studio — wiring lives here in task 1.B onward.'

export const Play = () => (
  <section className={styles.placeholder} aria-label="Play page">
    <h1 className={styles.title}>{PLACEHOLDER_TITLE}</h1>
    <p className={styles.subtitle}>{PLACEHOLDER_SUBTITLE}</p>
  </section>
)
