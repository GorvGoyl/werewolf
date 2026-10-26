import type { GameState } from "../game/types"
import { handOverLink } from "../game/storage"
import { QrCode } from "./QrCode"
import { BottomSheet, Button, IconTile } from "./ui"

function summary(state: GameState): string {
  const count = state.players.length
  let players = `${count} players`
  if (count === 1) players = "1 player"
  if (state.gameMaster) return `${players}, game master ${state.gameMaster} and the roles`
  return `${players} and the roles`
}

type Props = { state: GameState; onShare: (link: string) => void; onClose: () => void }

// The next game master points their camera at this and their phone has everything for the next game
export function HandOverSheet({ state, onShare, onClose }: Props) {
  const link = handOverLink(state)
  return (
    <BottomSheet
      label="Hand over to another phone"
      onClose={onClose}>
      <div className="flex items-start gap-3.5 px-2 pt-2">
        <IconTile icon="handOver" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold leading-tight text-mist-100">Hand over to another phone</h2>
          <p className="mt-1 text-[15px] leading-snug text-mist-300">
            On the other phone, open the camera, point it here and tap the link.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-4 w-full max-w-[300px] px-1">
        <QrCode
          text={link}
          label="Code with the players and roles"
        />
      </div>
      <p className="mt-3 px-4 text-center text-[14px] leading-snug text-mist-400">It sends {summary(state)}.</p>
      <div className="mt-3 px-1 pb-3">
        <Button
          variant="secondary"
          icon="send"
          onClick={() => onShare(link)}>
          Share link
        </Button>
      </div>
    </BottomSheet>
  )
}
