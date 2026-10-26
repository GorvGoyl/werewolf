import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { boot, forwardToHome, saveHistory, saveState } from "./game/storage"
import { registerServiceWorker, startInstallTracking } from "./lib/install"
import "./index.css"

// On an old address the page only forwards to the main one
if (!forwardToHome()) {
  startInstallTracking()
  if (import.meta.env.PROD) registerServiceWorker()

  // Read the saved game (and anything handed over by another phone or an old address) before the first render
  const booted = boot()
  saveState(booted.state)
  saveHistory(booted.history)

  const root = document.getElementById("root")
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App boot={booted} />
      </StrictMode>,
    )
  }
}
