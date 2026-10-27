import { useEffect, useRef, useState } from "react"
import type { GameAction, GameState } from "./game/types"
import { gameReducer, isNightStep, keepSettings, sameName } from "./game/reducer"
import { eliminatedToday, isGameRunning } from "./game/selectors"
import type { Boot } from "./game/storage"
import { MAX_HISTORY, saveHistory, saveState } from "./game/storage"
import { Header } from "./components/Header"
import { Menu, NewGameSheet } from "./components/Menu"
import { GameMasterSheet } from "./components/GameMasterSheet"
import { HandOverSheet } from "./components/HandOverSheet"
import { RolesSheet } from "./components/RolesSheet"
import { HistorySheet } from "./components/HistorySheet"
import { RulesGuide } from "./components/RulesGuide"
import { RoleNamesEditor } from "./components/RoleNamesEditor"
import { InstallSheet } from "./components/Install"
import { promptInstall, useInstallState } from "./lib/install"
import { SetupScreen } from "./screens/SetupScreen"
import { RoleConfigScreen } from "./screens/RoleConfigScreen"
import { CourtesanScreen } from "./screens/CourtesanScreen"
import { BabyWolfScreen } from "./screens/BabyWolfScreen"
import { WolvesScreen } from "./screens/WolvesScreen"
import { WizardScreen } from "./screens/WizardScreen"
import { SeerScreen } from "./screens/SeerScreen"
import { NightResultsScreen } from "./screens/NightResultsScreen"
import { DayVoteScreen } from "./screens/DayVoteScreen"
import { GameOverScreen } from "./screens/GameOverScreen"
import { useWakeLock } from "./lib/useWakeLock"
import { cx } from "./lib/cx"

type Overlay = "menu" | "new_game" | "game_master" | "hand_over" | "roles" | "history" | "rules" | "names" | "install"

// Settings changes aren't steps of the game, so undo skips them
const NOT_UNDOABLE: Array<GameAction["type"]> = [
  "SET_TIMER_MINUTES",
  "SET_ROLE_NAMES",
  "SET_SHOW_ROLE_BADGES",
  "FORGET_SAVED_NAME",
]

// Changes whenever a different screen (or step within one) is shown
function screenKey(state: GameState): string {
  const identified = state.players.filter((p) => p.role !== null).length
  const checked = state.currentNightEvent.seerChecked ?? ""
  return [state.currentPhase.type, state.currentNight, state.currentDay, identified, checked, eliminatedToday(state).length].join(":")
}

function skyClass(state: GameState): string {
  const phase = state.currentPhase
  if (phase.type === "game_over") return `sky-${phase.winner}`
  if (phase.type === "night_results") return "sky-dawn"
  if (phase.type === "day_vote") return "sky-day"
  if (isNightStep(phase)) return "sky-night"
  return "sky-setup"
}

type Props = { boot: Boot }

export function App({ boot }: Props) {
  const [state, setState] = useState<GameState>(boot.state)
  const stateRef = useRef(state)
  const historyRef = useRef<GameState[]>(boot.history)
  const [historyLength, setHistoryLength] = useState(boot.history.length)
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<number | undefined>(undefined)
  const { installed, canPrompt } = useInstallState()

  useWakeLock(isGameRunning(state))

  function commit(next: GameState) {
    const previousKey = screenKey(stateRef.current)
    stateRef.current = next
    setState(next)
    saveState(next)
    // A new screen starts at the top
    if (screenKey(next) !== previousKey) window.requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  // Reads and writes the ref, so two quick taps never act on a stale state
  function dispatch(action: GameAction) {
    const current = stateRef.current
    const next = gameReducer(current, action)
    if (next === current) return
    if (!NOT_UNDOABLE.includes(action.type)) {
      historyRef.current = [...historyRef.current, current].slice(-MAX_HISTORY)
      setHistoryLength(historyRef.current.length)
      saveHistory(historyRef.current)
    }
    commit(next)
  }

  function undo() {
    const history = historyRef.current
    const previous = history[history.length - 1]
    if (!previous) return
    historyRef.current = history.slice(0, -1)
    setHistoryLength(historyRef.current.length)
    saveHistory(historyRef.current)
    commit(keepSettings(previous, stateRef.current))
  }

  // Overlays get a history entry, so the phone's back gesture closes them instead of leaving the app
  function openOverlay(next: Overlay) {
    if (overlay === null) window.history.pushState({ overlay: next }, "")
    if (overlay !== null) window.history.replaceState({ overlay: next }, "")
    setOverlay(next)
  }

  function closeOverlay() {
    if (window.history.state?.overlay) {
      window.history.back()
      return
    }
    setOverlay(null)
  }

  useEffect(() => {
    if (window.history.state?.overlay) window.history.replaceState(null, "")
    if (boot.openRules) {
      window.history.pushState({ overlay: "rules" }, "")
      setOverlay("rules")
    }
    // Players just came from another phone, and whoever runs the game here gets no card
    if (boot.handedOver) {
      window.history.pushState({ overlay: "game_master" }, "")
      setOverlay("game_master")
      flash(`${boot.state.players.length + (boot.state.gameMaster ? 1 : 0)} names came from the other phone`)
    }
    function onPopState(event: PopStateEvent) {
      setOverlay(event.state?.overlay ?? null)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [boot])

  // Each new game starts by asking who runs it
  function newGame() {
    dispatch({ type: "NEW_GAME" })
    openOverlay("game_master")
  }

  // A game in progress is only thrown away after asking
  function startNewGame() {
    if (isGameRunning(stateRef.current)) {
      openOverlay("new_game")
      return
    }
    newGame()
  }

  // Says so when the last game master goes back to playing, since that's easy to miss in a long list
  function pickGameMaster(name: string) {
    const before = stateRef.current
    dispatch({ type: "SET_GAME_MASTER", name })
    closeOverlay()
    const previous = before.gameMaster
    const after = stateRef.current
    if (previous === null || after.gameMaster === previous) return
    const rejoined = (s: GameState) => s.players.some((p) => sameName(p.name, previous))
    if (!rejoined(before) && rejoined(after)) flash(`${previous} joins the players`)
  }

  // The browser's own install dialog when there is one (Chrome), otherwise how-to steps (Firefox, Safari)
  async function install() {
    const prompted = await promptInstall()
    if (!prompted) openOverlay("install")
  }

  // From the menu the steps replace it, while the browser's dialog opens over the game
  function installFromMenu() {
    if (!canPrompt) {
      openOverlay("install")
      return
    }
    closeOverlay()
    void promptInstall()
  }

  // The phone's own share menu where there is one, otherwise the link is copied
  async function shareLink(link: string) {
    if ("share" in navigator) {
      try {
        await navigator.share({ url: link })
        return
      } catch (error) {
        // Closing the share menu isn't a failure
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    try {
      await navigator.clipboard.writeText(link)
      flash("Link copied")
    } catch {
      flash("Couldn't share the link")
    }
  }

  function flash(text: string) {
    window.clearTimeout(toastTimerRef.current)
    setToast(text)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200)
  }

  async function copyState() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(stateRef.current, null, 2))
      flash("Game data copied")
    } catch {
      flash("Couldn't copy")
    }
  }

  return (
    <div className="min-h-dvh">
      <div className={cx("sky", skyClass(state))} />
      <Header
        state={state}
        canUndo={historyLength > 0}
        onUndo={undo}
        onOpenRoles={() => openOverlay("roles")}
        onOpenHistory={() => openOverlay("history")}
        onOpenMenu={() => openOverlay("menu")}
      />
      <CurrentScreen
        key={`${state.currentPhase.type}:${state.currentNight}:${state.currentDay}`}
        state={state}
        dispatch={dispatch}
        onInstall={install}
        onPickGameMaster={() => openOverlay("game_master")}
        onPlayAgain={newGame}
        onHandOver={() => openOverlay("hand_over")}
      />

      {overlay === "menu" && (
        <Menu
          inGame={state.currentPhase.type !== "setup" && state.currentPhase.type !== "role_config"}
          installed={installed}
          canHandOver={state.players.length > 0 || state.gameMaster !== null}
          onClose={closeOverlay}
          onOpenRules={() => openOverlay("rules")}
          onOpenRoleNames={() => openOverlay("names")}
          onOpenRoles={() => openOverlay("roles")}
          onOpenHistory={() => openOverlay("history")}
          onInstall={installFromMenu}
          onNewGame={startNewGame}
          onHandOver={() => openOverlay("hand_over")}
          onCopyState={() => {
            closeOverlay()
            void copyState()
          }}
        />
      )}
      {overlay === "new_game" && (
        <NewGameSheet
          onClose={closeOverlay}
          onConfirm={newGame}
        />
      )}
      {overlay === "game_master" && (
        <GameMasterSheet
          state={state}
          onPick={pickGameMaster}
          onClose={closeOverlay}
        />
      )}
      {overlay === "hand_over" && (
        <HandOverSheet
          state={state}
          onShare={(link) => void shareLink(link)}
          onClose={closeOverlay}
        />
      )}
      {overlay === "roles" && (
        <RolesSheet
          state={state}
          dispatch={dispatch}
          onClose={closeOverlay}
        />
      )}
      {overlay === "history" && (
        <HistorySheet
          state={state}
          onClose={closeOverlay}
        />
      )}
      {overlay === "rules" && (
        <RulesGuide
          roleNames={state.roleNames}
          onClose={closeOverlay}
        />
      )}
      {overlay === "install" && (
        <InstallSheet
          onClose={closeOverlay}
          onInstall={async () => {
            await promptInstall()
            closeOverlay()
          }}
        />
      )}
      {overlay === "names" && (
        <RoleNamesEditor
          roleNames={state.roleNames}
          onClose={closeOverlay}
          onSave={(roleNames) => {
            dispatch({ type: "SET_ROLE_NAMES", roleNames })
            closeOverlay()
          }}
        />
      )}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
          <div className="animate-pop rounded-full bg-mist-100 px-4 py-2 text-sm font-semibold text-night-950 shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

type CurrentScreenProps = {
  state: GameState
  dispatch: (action: GameAction) => void
  onInstall: () => void
  onPickGameMaster: () => void
  onPlayAgain: () => void
  onHandOver: () => void
}

function CurrentScreen({ state, dispatch, onInstall, onPickGameMaster, onPlayAgain, onHandOver }: CurrentScreenProps) {
  const phase = state.currentPhase
  if (phase.type === "setup") {
    return (
      <SetupScreen
        state={state}
        dispatch={dispatch}
        onInstall={onInstall}
        onPickGameMaster={onPickGameMaster}
      />
    )
  }
  if (phase.type === "role_config") return <RoleConfigScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_courtesan") return <CourtesanScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_baby_wolf") return <BabyWolfScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_wolves") return <WolvesScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_wizard") return <WizardScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_seer") return <SeerScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_results") return <NightResultsScreen state={state} dispatch={dispatch} />
  if (phase.type === "day_vote") return <DayVoteScreen state={state} dispatch={dispatch} />
  if (phase.type === "game_over") {
    return (
      <GameOverScreen
        state={state}
        winner={phase.winner}
        onPlayAgain={onPlayAgain}
        onHandOver={onHandOver}
      />
    )
  }
  return null
}
