import type { RefObject } from "react"
import { useLayoutEffect, useState } from "react"

// Whether the content is taller than the element, which changes when the phone turns
export function useOverflows(ref: RefObject<HTMLElement | null>): boolean {
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return overflows
}
