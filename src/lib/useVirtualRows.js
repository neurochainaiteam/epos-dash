import { useCallback, useState } from 'react'

/**
 * Tiny fixed-height row virtualiser — no dependency, ~zero bundle cost.
 * Given a scroll position it returns the slice of rows to actually render plus
 * the top/bottom spacer heights, so a 10-row or a 10,000-row table both render
 * only the ~20 rows on screen.
 *
 * Usage: spread {onScroll} onto the scroll container, render a spacer row of
 * `topPad`, then rows[start..end], then a spacer of `bottomPad`.
 */
export function useVirtualRows({ rowCount, rowHeight, viewportHeight, overscan = 8 }) {
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visible = Math.ceil(viewportHeight / rowHeight) + overscan * 2
  const end = Math.min(rowCount, start + visible)

  return {
    start,
    end,
    onScroll,
    topPad: start * rowHeight,
    bottomPad: Math.max(0, (rowCount - end) * rowHeight),
  }
}
