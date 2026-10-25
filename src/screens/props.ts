import type { GameAction, GameState } from "../game/types"

export type ScreenProps = {
  state: GameState
  dispatch: (action: GameAction) => void
}
