import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { boot, saveState } from "./game/storage"
import "./index.css"

// Read the saved game (and any names handed over by the old site) before the first render
const booted = boot()
saveState(booted.state)

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App boot={booted} />
    </StrictMode>,
  )
}
