import type { ReactNode } from "react"
import { useRef, useState } from "react"
import type { Role, RoleNames } from "../game/types"
import { roleName } from "../game/roles"
import { TEAM_LABEL, roleInfo } from "../game/roleInfo"
import type { RoleChoice } from "../lib/useShowRole"
import { cx } from "../lib/cx"
import { useOverflows } from "../lib/useOverflows"
import type { IconName } from "./icons"
import { ROLE_ICON } from "./icons"
import type { Tone } from "./ui"
import { BottomSheet, Button, IconTile, ROLE_TONE, Switch, TEAM_TONE, toneText } from "./ui"

type Props = {
  role: Role
  roleNames: RoleNames
  choice?: RoleChoice
  onClose: () => void
  onOpenRules: () => void
}

// What a role does, over whatever is on screen. Tapping a role anywhere in the app opens it.
export function RoleCard({ role, roleNames: rn, choice, onClose, onOpenRules }: Props) {
  const [on, setOn] = useState(choice?.on ?? false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const scrolls = useOverflows(bodyRef)
  const info = roleInfo(role, rn)
  const name = roleName(role, rn)
  const teamTone = TEAM_TONE[info.team]

  function toggle() {
    setOn(!on)
    choice?.onToggle()
  }

  return (
    <BottomSheet
      label={name}
      onClose={onClose}>
      <div className="flex max-h-[calc(100dvh-4.5rem-env(safe-area-inset-top))] flex-col">
        <div className="flex items-center gap-3.5 px-2 pt-1">
          <IconTile
            icon={ROLE_ICON[role]}
            tone={ROLE_TONE[role]}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className={cx("text-[12px] font-bold uppercase tracking-[0.16em]", toneText(teamTone))}>
              {TEAM_LABEL[info.team]}
            </div>
            <h2 className="text-[26px] font-bold leading-tight tracking-tight text-mist-100">{name}</h2>
          </div>
        </div>

        {/* On a short screen the card scrolls here, and dragging the top still closes it */}
        <div
          ref={bodyRef}
          onPointerDown={(event) => {
            if (scrolls) event.stopPropagation()
          }}
          className={cx(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-1",
            scrolls && "touch-pan-y",
            !scrolls && "touch-none",
          )}>
          <p className="mt-3.5 px-1 text-[17px] leading-snug text-mist-100">{info.summary}</p>
          <div className="mt-4 space-y-2.5 rounded-2xl border border-white/5 bg-night-800/70 p-3">
            <Fact
              icon="moon"
              tone="moon">
              {info.wakes}
            </Fact>
            <Fact
              icon="trophy"
              tone={teamTone}>
              {info.goal}
            </Fact>
          </div>
          <ul className="mt-4 space-y-2 px-1">
            {info.details.map((detail) => (
              <li
                key={detail}
                className="flex gap-2.5 text-[15px] leading-snug text-mist-300">
                <span
                  aria-hidden
                  className="text-mist-500">
                  •
                </span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          {choice && (
            <div className="mt-4">
              <Switch
                checked={on}
                onChange={toggle}
                label={`Play with the ${name}`}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2 px-1 pb-3">
          <Button
            variant="secondary"
            icon="book"
            className="w-auto! shrink-0 px-4"
            onClick={onOpenRules}>
            How to play
          </Button>
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </BottomSheet>
  )
}

type FactProps = { icon: IconName; tone: Tone; children: ReactNode }

function Fact({ icon, tone, children }: FactProps) {
  return (
    <div className="flex items-center gap-3 text-[15px] leading-snug text-mist-200">
      <IconTile
        icon={icon}
        tone={tone}
        size="sm"
      />
      <span>{children}</span>
    </div>
  )
}
