/**
 * useElementHeight — observe a DOM element's height and re-emit on resize.
 *
 * Used by `<FallingNotes />` to scale `PIXELS_PER_SECOND` so notes always
 * fill the canvas height. Returns `null` until the first measurement
 * arrives (SSR-safe; falling back to the constant's default lets the
 * initial render avoid an empty-state flash).
 */

import { useEffect, useState } from 'react'

export const useElementHeight = (ref: React.RefObject<HTMLElement | null>): number | null => {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    setHeight(el.clientHeight)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry !== undefined) {
        setHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [ref])

  return height
}
