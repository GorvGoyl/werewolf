import type { Role, RoleNames } from "../game/types"
import { roleName, rolePlural } from "../game/roles"
import { TEAM_LABEL, roleInfo } from "../game/roleInfo"
import { cx } from "../lib/cx"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON } from "./icons"
import { IconTile, ROLE_TONE, SectionLabel, Sheet, TEAM_TONE, toneText } from "./ui"

// The plain wolf first, then the roles that change the rules for it
const GUIDE_ORDER: Role[] = ["wolf", "queen_wolf", "baby_wolf", "seer", "wizard", "courtesan", "villager"]

type Step = { icon: IconName; text: string }

type Props = { roleNames: RoleNames; onClose: () => void }

export function RulesGuide({ roleNames: rn, onClose }: Props) {
  const wolves = rolePlural("wolf", rn)
  const order: Step[] = [
    { icon: ROLE_ICON.courtesan, text: roleName("courtesan", rn) },
    { icon: ROLE_ICON.baby_wolf, text: `${roleName("baby_wolf", rn)} (Night 1 only)` },
    { icon: ROLE_ICON.wolf, text: `${roleName("queen_wolf", rn)} & ${wolves}` },
    { icon: ROLE_ICON.wizard, text: roleName("wizard", rn) },
    { icon: ROLE_ICON.seer, text: roleName("seer", rn) },
    { icon: "sunrise", text: "Dawn: deaths are announced, then the village votes" },
  ]

  return (
    <Sheet
      title="How to play"
      subtitle="Roles, night order and how to win"
      onClose={onClose}>
      <div className="space-y-3 rounded-2xl border border-white/5 bg-night-800/70 p-4">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-mist-400">Who wins</div>
        <div className="flex items-center gap-3 text-[15px] leading-snug text-leaf-400">
          <IconTile
            icon="villager"
            tone="leaf"
            size="sm"
          />
          <span>The village wins once every {roleName("wolf", rn).toLowerCase()} is dead.</span>
        </div>
        <div className="flex items-center gap-3 text-[15px] leading-snug text-blood-400">
          <IconTile
            icon="wolf"
            tone="blood"
            size="sm"
          />
          <span>The {wolves.toLowerCase()} win when they equal or outnumber everyone else.</span>
        </div>
      </div>

      <SectionLabel>Every night</SectionLabel>
      <ol className="rounded-2xl border border-white/5 bg-night-800/70 px-2 py-1.5">
        {order.map((step, i) => (
          <li
            key={step.text}
            className="flex min-h-12 items-center gap-3 px-2 py-1.5 text-[15px] leading-snug text-mist-200">
            <span className="w-3 shrink-0 text-right text-[13px] font-semibold tabular-nums text-mist-500">{i + 1}</span>
            <Icon
              name={step.icon}
              className="size-9"
            />
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2.5 text-[14px] leading-snug text-mist-400">
        On Night 1 each role opens their eyes first, you tap who they are, then they act like on any other night. Roles
        nobody has are skipped, and a dead role is still called and asked their question, so the table can&apos;t
        tell.
      </p>

      <SectionLabel>Roles</SectionLabel>
      <div className="space-y-2.5">
        {GUIDE_ORDER.map((role) => {
          const info = roleInfo(role, rn)
          return (
            <div
              key={role}
              className="rounded-2xl border border-white/5 bg-night-800/70 p-4">
              <div className="flex items-start gap-3.5">
                <IconTile
                  icon={ROLE_ICON[role]}
                  tone={ROLE_TONE[role]}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <div className="text-[17px] font-bold text-mist-100">{roleName(role, rn)}</div>
                    <div
                      className={cx("text-[11px] font-bold uppercase tracking-wide", toneText(TEAM_TONE[info.team]))}>
                      {TEAM_LABEL[info.team]}
                    </div>
                  </div>
                  <div className="mt-1 text-[15px] leading-snug text-mist-200">{info.summary}</div>
                  <ul className="mt-2 space-y-1">
                    {[info.wakes, ...info.details].map((detail) => (
                      <li
                        key={detail}
                        className="flex gap-2 text-[14px] leading-snug text-mist-400">
                        <span className="text-mist-500">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
