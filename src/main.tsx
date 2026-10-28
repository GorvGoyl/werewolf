import type { ReactNode } from "react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { HowToPlayPage } from "./HowToPlayPage"
import { boot, forwardToHome, isGuidePath, saveHistory, saveState } from "./game/storage"
import { registerServiceWorker, startInstallTracking } from "./lib/install"
import "./index.css"

function render(page: ReactNode) {
  const root = document.getElementById("root")
  if (root) createRoot(root).render(<StrictMode>{page}</StrictMode>)
}

// How to play, sent to the players: it leaves this phone's game alone. Offline it comes from the
// app's saved page, hence the title.
function showGuide() {
  document.title = "How to play Werewolf"
  if (import.meta.env.PROD) registerServiceWorker()
  render(<HowToPlayPage />)
}

function showGame() {
  startInstallTracking()
  if (import.meta.env.PROD) registerServiceWorker()

  // Read the saved game (and anything handed over by another phone or an old address) before the first render
  const booted = boot()
  saveState(booted.state)
  saveHistory(booted.history)
  render(<App boot={booted} />)
}

// On an old address the game only forwards to the main one
if (isGuidePath(window.location.pathname)) showGuide()
else if (!forwardToHome()) showGame()
