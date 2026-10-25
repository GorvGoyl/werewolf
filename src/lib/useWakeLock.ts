import { useEffect } from "react"

// Keeps the screen on while a game is running, so the phone doesn't lock mid-night
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    async function acquire() {
      if (document.visibilityState !== "visible" || sentinel) return
      try {
        const lock = await navigator.wakeLock.request("screen")
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
        lock.addEventListener("release", () => {
          if (sentinel === lock) sentinel = null
        })
      } catch {
        // Not allowed right now (e.g. battery saver); the game works without it
      }
    }

    void acquire()
    document.addEventListener("visibilitychange", acquire)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", acquire)
      void sentinel?.release()
    }
  }, [active])
}
