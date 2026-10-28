import { roleName, rolePlural } from "../game/roles"
import { hasHadTurn } from "../game/reducer"
import { playerName } from "../game/selectors"
import { openEyes } from "../game/script"
import { Callout } from "../components/ui"
import { CloseEyesStep, IdentifyStep, NightfallStep, needsNightfall } from "./night"
import type { ScreenProps } from "./props"

// Night 1 only: the GM learns who the Baby Wolf is
export function BabyWolfScreen({ state, dispatch }: ScreenProps) {
  const name = roleName("baby_wolf", state.roleNames)
  const wolves = rolePlural("wolf", state.roleNames)
  if (needsNightfall(state)) {
    return (
      <NightfallStep
        state={state}
        dispatch={dispatch}
      />
    )
  }
  if (hasHadTurn(state)) {
    return (
      <CloseEyesStep
        state={state}
        dispatch={dispatch}
        role="baby_wolf"
        title={name}
        subtitle={`${playerName(state, state.babyWolfPlayerId)} is the ${name}.`}
        tone="sun"
      />
    )
  }
  return (
    <IdentifyStep
      key="identify-baby-wolf"
      state={state}
      dispatch={dispatch}
      role="baby_wolf"
      title={name}
      tone="sun"
      lines={[openEyes(state, "baby_wolf")]}
      instruction="Tap the player who opened their eyes"
      confirmLabel={([who]) => `${who} is the ${name}`}
      onConfirm={([id]) => dispatch({ type: "IDENTIFY_BABY_WOLF", playerId: id })}
      hint={
        <Callout
          tone="sun"
          icon="wolf">
          Plays with the village. If the {wolves.toLowerCase()} ever pick them, they survive and join the pack the
          next night.
        </Callout>
      }
    />
  )
}
