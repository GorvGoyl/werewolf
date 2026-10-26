import type { ReactNode } from "react"
import type { IconName } from "./icons"
import { BottomSheet, Button, IconTile } from "./ui"

type Props = {
  inGame: boolean
  installed: boolean
  canHandOver: boolean
  onClose: () => void
  onOpenRules: () => void
  onOpenRoleNames: () => void
  onOpenRoles: () => void
  onOpenHistory: () => void
  onInstall: () => void
  onNewGame: () => void
  onHandOver: () => void
  onCopyState: () => void
}

// Everything besides playing, at the bottom of the screen where the thumb is
export function Menu({
  inGame,
  installed,
  canHandOver,
  onClose,
  onOpenRules,
  onOpenRoleNames,
  onOpenRoles,
  onOpenHistory,
  onInstall,
  onNewGame,
  onHandOver,
  onCopyState,
}: Props) {
  return (
    <BottomSheet
      label="Menu"
      onClose={onClose}>
      <MenuItem
        icon="book"
        onClick={onOpenRules}>
        How to play
      </MenuItem>
      <MenuItem
        icon="pencil"
        onClick={onOpenRoleNames}>
        Rename roles
      </MenuItem>
      {inGame && (
        <MenuItem
          icon="cards"
          onClick={onOpenRoles}>
          Everyone&apos;s roles
        </MenuItem>
      )}
      {inGame && (
        <MenuItem
          icon="timeline"
          hint="Every night and day so far"
          onClick={onOpenHistory}>
          What happened
        </MenuItem>
      )}
      {!installed && (
        <MenuItem
          icon="install"
          hint="Home screen icon, works offline"
          onClick={onInstall}>
          Install app
        </MenuItem>
      )}
      <div className="mx-2.5 my-1.5 border-t border-white/5" />
      <MenuItem
        icon="restart"
        hint="Same players, new roles"
        onClick={onNewGame}>
        New game
      </MenuItem>
      {canHandOver && (
        <MenuItem
          icon="handOver"
          hint="Someone else runs the next game on their phone"
          onClick={onHandOver}>
          Hand over to another phone
        </MenuItem>
      )}
      <MenuItem
        icon="copy"
        hint="For bug reports"
        onClick={onCopyState}>
        Copy game data
      </MenuItem>
    </BottomSheet>
  )
}

type MenuItemProps = { icon: IconName; hint?: string; onClick: () => void; children: ReactNode }

function MenuItem({ icon, hint, onClick, children }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3.5 rounded-2xl px-2.5 py-2 text-left active:bg-white/5">
      <IconTile
        icon={icon}
        size="sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-mist-100">{children}</span>
        {hint && <span className="block text-[13px] text-mist-400">{hint}</span>}
      </span>
    </button>
  )
}

type NewGameSheetProps = { onConfirm: () => void; onClose: () => void }

// Asked before throwing away a game in progress
export function NewGameSheet({ onConfirm, onClose }: NewGameSheetProps) {
  return (
    <BottomSheet
      label="Start a new game?"
      onClose={onClose}>
      <div className="flex items-start gap-3.5 px-2 pt-2">
        <IconTile
          icon="restart"
          tone="blood"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold leading-tight text-mist-100">Start a new game?</h2>
          <p className="mt-1 text-[15px] leading-snug text-mist-300">
            This game ends. Same players, new roles. You can undo this.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-1.5 px-1 pb-2">
        <Button
          tone="blood"
          icon="restart"
          onClick={onConfirm}>
          New game
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}>
          Keep playing
        </Button>
      </div>
    </BottomSheet>
  )
}
