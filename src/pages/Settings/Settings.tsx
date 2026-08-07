/**
 * /settings — F1 placeholder.
 *
 * F1 scope is intentionally minimal (PWA install + keyboard-only flow).
 * Full settings (octave, velocity curve, theme, custom layouts) are out
 * of F1 scope per docs/_CONCEPTO.md and arrive in F2.
 */

import styles from './Settings.module.css'

const PLACEHOLDER_TITLE = 'Settings'
const PLACEHOLDER_SUBTITLE =
  'Configurable options arrive in F2 (octave, velocity curve, custom layouts).'

export const Settings = () => (
  <section className={styles.placeholder} aria-label="Settings page">
    <h1 className={styles.title}>{PLACEHOLDER_TITLE}</h1>
    <p className={styles.subtitle}>{PLACEHOLDER_SUBTITLE}</p>
  </section>
)
