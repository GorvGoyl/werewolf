import { roleName, rolePlural } from "../game/roles"
import { Callout } from "../components/ui"
import { IdentifyStep, nightfall } from "./night"
import type { ScreenProps } from "./props"

// Night 1 only: the GM learns who the Baby Wolf is
export function BabyWolfScreen({ state, dispatch }: ScreenProps) {
  const name = roleName("baby_wolf", state.roleNames)
  const wolves = rolePlural("wolf", state.roleNames)
  return (
    <IdentifyStep
      key="identify-baby-wolf"
      state={state}
      dispatch={dispatch}
      role="baby_wolf"
      title={name}
      tone="sun"
      lines={[...nightfall(state, true), `${name}, open your eyes.`]}
      after={[`${name}, close your eyes.`]}
      instruction="Tap the player who opened their eyes"
      confirmLabel={([who]) => `${who} is the ${name}`}
      onConfirm={([id]) => dispatch({ type: "IDENTIFY_BABY_WOLF", playerId: id })}
      hint={
        <Callout
          tone="sun"
          icon="🌕">
          Plays with the village. If the {wolves.toLowerCase()} ever pick them, they survive and join the pack the
          next night.
        </Callout>
      }
    />
  )
}
