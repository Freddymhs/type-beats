/**
 * Layout — F1 shell with an Outlet for nested routes.
 *
 * Per concept: dark-only, minimal chrome. Permanent UI is forbidden by
 * F1 scope (keyboard-first flow state); this shell exists only to host
 * the route content + StatusLine (added in 1.I).
 */

import { Outlet } from 'react-router-dom'

import styles from './Layout.module.css'

export const Layout = () => (
  <div className={styles.shell}>
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
)
