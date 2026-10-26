import type { GameState } from "../game/types"
import { Icon } from "./icons"
import { Timeline } from "./Timeline"
import { Sheet } from "./ui"

type Props = { state: GameState; onClose: () => void }

// Every night and day so far, newest first, for the game master's eyes only
export function HistorySheet({ state, onClose }: Props) {
  return (
    <Sheet
      title="What happened"
      subtitle={
        <span className="flex items-center gap-1.5">
          <Icon
            name="secret"
            className="size-5"
          />
          Keep this screen to yourself
        </span>
      }
      onClose={onClose}>
      <Timeline
        state={state}
        newestFirst
      />
    </Sheet>
  )
}
