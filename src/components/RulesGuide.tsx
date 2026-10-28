import type { RoleNames } from "../game/types"
import { HowToPlay } from "./HowToPlay"
import { Button, Sheet } from "./ui"

type Props = { roleNames: RoleNames; onCopyLink: () => void; onShareLink: () => void; onClose: () => void }

// How to play, with its link at the bottom for sending to the players before game night
export function RulesGuide({ roleNames, onCopyLink, onShareLink, onClose }: Props) {
  // Without the phone's share menu, sharing would only copy the link too
  const canShare = "share" in navigator
  return (
    <Sheet
      title="How to play"
      subtitle="Send it to your players before game night"
      onClose={onClose}
      footer={
        <>
          {canShare && (
            <Button
              variant="secondary"
              icon="send"
              className="w-auto! shrink-0 px-5"
              onClick={onShareLink}>
              Share
            </Button>
          )}
          <Button
            icon="copy"
            onClick={onCopyLink}>
            Copy link
          </Button>
        </>
      }>
      <HowToPlay roleNames={roleNames} />
    </Sheet>
  )
}
