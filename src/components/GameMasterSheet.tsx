import type { FormEvent } from "react"
import { useState } from "react"
import type { GameState, Player } from "../game/types"
import { sameName, splitNames } from "../game/reducer"
import { Icon } from "./icons"
import { PlayerGrid } from "./PlayerGrid"
import { BottomSheet, IconTile } from "./ui"

// Everyone at the table: whoever ran the last game, then the players
function tableOf(state: GameState): Player[] {
  const names = state.players.map((p) => p.name)
  const master = state.gameMaster
  if (master !== null && !names.some((n) => sameName(n, master))) names.unshift(master)
  return names.map((name) => ({ id: name, name, role: null, isAlive: true }))
}

type Props = { state: GameState; onPick: (name: string) => void; onClose: () => void }

// Asked as each game starts. The game master runs it on this phone, so they get no card.
export function GameMasterSheet({ state, onPick, onClose }: Props) {
  const [draft, setDraft] = useState("")
  const table = tableOf(state)
  const master = state.gameMaster
  const current = table.filter((p) => master !== null && sameName(p.name, master)).map((p) => p.id)

  let placeholder = "Your name"
  if (table.length > 0) placeholder = "Someone else"

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const name = splitNames(draft)[0]
    if (name) onPick(name)
  }

  return (
    <BottomSheet
      label="Who's the game master?"
      onClose={onClose}>
      <div className="flex items-start gap-3.5 px-2 pt-2">
        <IconTile icon="gameMaster" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold leading-tight text-mist-100">Who&apos;s the game master?</h2>
          <p className="mt-1 text-[15px] leading-snug text-mist-300">
            They run the game on this phone and don&apos;t get a card.
          </p>
        </div>
      </div>

      {table.length > 0 && (
        // A long table scrolls here instead of dragging the sheet
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className="mt-4 max-h-[46dvh] touch-pan-y overflow-y-auto overscroll-contain px-1">
          <PlayerGrid
            players={table}
            selectedIds={current}
            onSelect={onPick}
            showRoles={false}
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-3 flex gap-2 px-1 pb-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label="Game master's name"
          autoCapitalize="words"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-800 px-4 text-[17px] text-mist-100 placeholder-mist-500 outline-none focus:border-moon-400 focus:ring-2 focus:ring-moon-400/30"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-14 shrink-0 items-center gap-1.5 rounded-2xl bg-moon-500 pl-4 pr-5 text-[17px] font-semibold text-white active:bg-moon-600 disabled:bg-night-700 disabled:text-mist-500">
          <Icon
            name="check"
            className="size-5"
            strokeWidth={2.5}
          />
          Done
        </button>
      </form>
    </BottomSheet>
  )
}
