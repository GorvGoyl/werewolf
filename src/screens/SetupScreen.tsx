import type { ClipboardEvent, FormEvent } from "react"
import { useRef, useState } from "react"
import { MIN_PLAYERS } from "../game/types"
import type { Player } from "../game/types"
import { sameName, splitNames } from "../game/reducer"
import { ActionBar, Avatar, Button, Screen, ScreenTitle, SectionLabel, TextButton } from "../components/ui"
import { Icon } from "../components/icons"
import { InstallBanner } from "../components/Install"
import { cx } from "../lib/cx"
import type { ScreenProps } from "./props"

function playersLabel(count: number): string {
  if (count === 0) return "Add everyone who's playing. Names are saved on this phone."
  if (count === 1) return "1 player"
  return `${count} players`
}

function nextLabel(count: number): string {
  if (count < MIN_PLAYERS) return `Add ${MIN_PLAYERS - count} more to start`
  return `Next: choose roles (${count})`
}

type Props = ScreenProps & { onInstall: () => void }

export function SetupScreen({ state, dispatch, onInstall }: Props) {
  const [draft, setDraft] = useState("")
  const [managing, setManaging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const count = state.players.length
  const suggestions = state.savedNames.filter((name) => !state.players.some((p) => sameName(p.name, name)))

  function addNames(text: string) {
    const names = splitNames(text)
    if (names.length === 0) return
    dispatch({ type: "ADD_PLAYERS", names })
    setDraft("")
    inputRef.current?.focus()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    addNames(draft)
  }

  // A pasted list ("Ana, Ben" or one name per line) adds everyone at once
  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text")
    if (!/[\n,;]/.test(text)) return
    event.preventDefault()
    addNames(`${draft}\n${text}`)
  }

  return (
    <>
      <Screen>
        <InstallBanner onInstall={onInstall} />
        <ScreenTitle
          eyebrow="New game"
          icon="users"
          title="Who's playing?"
          subtitle={playersLabel(count)}
        />

        <form
          onSubmit={handleSubmit}
          className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            placeholder="Player name"
            aria-label="Player name"
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
              name="plus"
              className="size-5"
              strokeWidth={2.5}
            />
            Add
          </button>
        </form>
        <p className="mt-2 text-[13px] text-mist-400">Tip: paste a list of names separated by commas or new lines.</p>

        {count > 0 && (
          <>
            <SectionLabel
              action={
                <TextButton
                  icon="trash"
                  onClick={() => dispatch({ type: "REMOVE_ALL_PLAYERS" })}>
                  Clear all
                </TextButton>
              }>
              In this game · {count}
            </SectionLabel>
            <PlayerList
              players={state.players}
              onRemove={(id) => dispatch({ type: "REMOVE_PLAYER", id })}
            />
          </>
        )}

        {suggestions.length > 0 && (
          <>
            <SectionLabel
              action={
                <>
                  {!managing && suggestions.length > 1 && (
                    <TextButton
                      icon="plus"
                      tone="moon"
                      onClick={() => dispatch({ type: "ADD_PLAYERS", names: suggestions })}>
                      Add all
                    </TextButton>
                  )}
                  {managing && (
                    <TextButton
                      icon="check"
                      onClick={() => setManaging(false)}>
                      Done
                    </TextButton>
                  )}
                  {!managing && (
                    <TextButton
                      icon="pencil"
                      onClick={() => setManaging(true)}>
                      Edit
                    </TextButton>
                  )}
                </>
              }>
              Saved players
            </SectionLabel>
            <SavedNames
              names={suggestions}
              managing={managing}
              onAdd={(name) => dispatch({ type: "ADD_PLAYERS", names: [name] })}
              onForget={(name) => dispatch({ type: "FORGET_SAVED_NAME", name })}
            />
            {managing && <p className="mt-2.5 text-[13px] text-mist-400">Tap a name to forget it.</p>}
          </>
        )}
      </Screen>

      <ActionBar>
        <Button
          disabled={count < MIN_PLAYERS}
          icon={count >= MIN_PLAYERS && "cards"}
          onClick={() => dispatch({ type: "START_ROLE_CONFIG" })}>
          {nextLabel(count)}
        </Button>
      </ActionBar>
    </>
  )
}

type PlayerListProps = { players: Player[]; onRemove: (id: string) => void }

function PlayerList({ players, onRemove }: PlayerListProps) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="flex min-h-14 animate-pop items-center gap-2.5 rounded-2xl border border-white/5 bg-night-800/90 py-1.5 pl-2.5 pr-1">
          <Avatar
            name={player.name}
            size="sm"
          />
          <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-mist-100">{player.name}</span>
          <button
            type="button"
            onClick={() => onRemove(player.id)}
            aria-label={`Remove ${player.name}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-mist-400 active:bg-white/5 active:text-blood-400">
            <Icon
              name="x"
              className="size-5"
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

type SavedNamesProps = {
  names: string[]
  managing: boolean
  onAdd: (name: string) => void
  onForget: (name: string) => void
}

function SavedNames({ names, managing, onAdd, onForget }: SavedNamesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            if (managing) onForget(name)
            if (!managing) onAdd(name)
          }}
          className={cx(
            "flex h-11 items-center gap-1.5 rounded-full border pl-3 pr-4 text-[15px] font-semibold active:scale-[0.97]",
            managing && "border-blood-500/40 bg-blood-500/10 text-blood-300",
            !managing && "border-white/10 bg-night-800/80 text-mist-200 active:bg-night-700",
          )}>
          {managing && (
            <Icon
              name="x"
              className="size-4"
            />
          )}
          {!managing && (
            <Icon
              name="plus"
              className="size-4"
            />
          )}
          {name}
        </button>
      ))}
    </div>
  )
}
