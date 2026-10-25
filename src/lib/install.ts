import { useSyncExternalStore } from "react"

// Chrome, Edge and Samsung Internet fire this; Firefox and Safari don't
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// Where the app runs, which decides how it gets installed
export type Platform = "firefox-android" | "ios" | "android" | "desktop"

export type InstallState = {
  installed: boolean // running as an installed app, or just installed
  canPrompt: boolean // the browser's own install dialog is available
  platform: Platform
}

const HINT_DISMISSED_KEY = "werewolf.installHintDismissed"

let promptEvent: InstallPromptEvent | null = null
let installed = false
let platform: Platform = "desktop"
let snapshot: InstallState = { installed, canPrompt: false, platform }
const listeners = new Set<() => void>()

function publish() {
  snapshot = { installed, canPrompt: promptEvent !== null, platform }
  for (const listener of listeners) listener()
}

export function detectPlatform(userAgent: string, maxTouchPoints: number): Platform {
  // iPadOS reports itself as a Mac, but with touch
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return "ios"
  if (/Android/.test(userAgent) && /Firefox\//.test(userAgent)) return "firefox-android"
  if (/Android/.test(userAgent)) return "android"
  return "desktop"
}

function runningInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  const modes = ["standalone", "fullscreen", "minimal-ui"]
  return modes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) || nav.standalone === true
}

// Call before the first render: the browser can offer the install prompt right away
export function startInstallTracking() {
  platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints)
  installed = runningInstalled()
  window.addEventListener("beforeinstallprompt", (event) => {
    // Show our own Install button instead of the browser's mini banner
    event.preventDefault()
    promptEvent = event as InstallPromptEvent
    publish()
  })
  window.addEventListener("appinstalled", () => {
    installed = true
    promptEvent = null
    publish()
  })
  publish()
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
  )
}

// Opens the browser's install dialog. False when there's none, so the caller shows instructions.
export async function promptInstall(): Promise<boolean> {
  const event = promptEvent
  if (!event) return false
  promptEvent = null
  publish()
  await event.prompt()
  const choice = await event.userChoice
  if (choice.outcome === "accepted") {
    installed = true
    publish()
  }
  return true
}

export function isInstallHintDismissed(): boolean {
  try {
    return localStorage.getItem(HINT_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissInstallHint() {
  try {
    localStorage.setItem(HINT_DISMISSED_KEY, "1")
  } catch {
    // Then it shows again next time; harmless
  }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // No offline mode, but the app works as before
    })
  })
}
