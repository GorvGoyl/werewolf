import { useEffect, useRef, useState } from "react"
import type { GameAction, GameState } from "./game/types"
import { gameReducer, isNightStep, keepSettings } from "./game/reducer"
import { eliminatedToday, isGameRunning } from "./game/selectors"
import type { Boot } from "./game/storage"
import { MAX_HISTORY, saveHistory, saveState } from "./game/storage"
import { Header } from "./components/Header"
import { Menu, NewGameSheet } from "./components/Menu"
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

type Overlay = "menu" | "new_game" | "roles" | "history" | "rules" | "names" | "install"

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
    function onPopState(event: PopStateEvent) {
      setOverlay(event.state?.overlay ?? null)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [boot.openRules])

  // A game in progress is only thrown away after asking
  function startNewGame() {
    if (isGameRunning(stateRef.current)) {
      openOverlay("new_game")
      return
    }
    closeOverlay()
    dispatch({ type: "NEW_GAME" })
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

  async function copyState() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(stateRef.current, null, 2))
      setToast("Game data copied")
    } catch {
      setToast("Couldn't copy")
    }
    window.setTimeout(() => setToast(null), 1800)
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
      />

      {overlay === "menu" && (
        <Menu
          inGame={state.currentPhase.type !== "setup" && state.currentPhase.type !== "role_config"}
          installed={installed}
          onClose={closeOverlay}
          onOpenRules={() => openOverlay("rules")}
          onOpenRoleNames={() => openOverlay("names")}
          onOpenRoles={() => openOverlay("roles")}
          onOpenHistory={() => openOverlay("history")}
          onInstall={installFromMenu}
          onNewGame={startNewGame}
          onCopyState={() => {
            closeOverlay()
            void copyState()
          }}
        />
      )}
      {overlay === "new_game" && (
        <NewGameSheet
          onClose={closeOverlay}
          onConfirm={() => {
            closeOverlay()
            dispatch({ type: "NEW_GAME" })
          }}
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
}

function CurrentScreen({ state, dispatch, onInstall }: CurrentScreenProps) {
  const phase = state.currentPhase
  if (phase.type === "setup") return <SetupScreen state={state} dispatch={dispatch} onInstall={onInstall} />
  if (phase.type === "role_config") return <RoleConfigScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_courtesan") return <CourtesanScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_baby_wolf") return <BabyWolfScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_wolves") return <WolvesScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_wizard") return <WizardScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_seer") return <SeerScreen state={state} dispatch={dispatch} />
  if (phase.type === "night_results") return <NightResultsScreen state={state} dispatch={dispatch} />
  if (phase.type === "day_vote") return <DayVoteScreen state={state} dispatch={dispatch} />
  if (phase.type === "game_over") return <GameOverScreen state={state} dispatch={dispatch} winner={phase.winner} />
  return null
}
