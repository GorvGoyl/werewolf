import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  // The game, and How to play on a page of its own with its own link preview
  input: { main: "index.html", howToPlay: "how-to-play.html" },
  plugins: [react(), tailwindcss()],
  test: {
    include: ["__tests__/**/*.test.ts"],
  },
})
