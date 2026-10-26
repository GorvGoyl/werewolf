import type { Role, RoleNames } from "../game/types"
import { roleName, rolePlural } from "../game/roles"
import { cx } from "../lib/cx"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON } from "./icons"
import { IconTile, ROLE_TONE, SectionLabel, Sheet } from "./ui"

type Team = "wolves" | "village" | "wildcard"

type RoleInfo = {
  role: Role
  team: Team
  summary: string
  details: string[]
}

function roleInfo(rn: RoleNames): RoleInfo[] {
  const wolf = roleName("wolf", rn).toLowerCase()
  const wolves = rolePlural("wolf", rn).toLowerCase()
  const queen = roleName("queen_wolf", rn)
  const baby = roleName("baby_wolf", rn)
  const seer = roleName("seer", rn)
  const wizard = roleName("wizard", rn)
  const courtesan = roleName("courtesan", rn)
  return [
    {
      role: "wolf",
      team: "wolves",
      summary: `Every night, from the very first, the ${wolves} wake up together and pick a player to kill.`,
      details: [
        `The ${wolves} know each other`,
        `During the day they pretend to be villagers`,
        `They win when they equal or outnumber everyone else`,
      ],
    },
    {
      role: "queen_wolf",
      team: "wolves",
      summary: `A ${wolf} the ${seer} can't see.`,
      details: [
        `Hunts with the pack and counts as a ${wolf}`,
        `The ${seer} sees her as "not a ${wolf}"`,
        `Wakes up first on Night 1 so you know who she is`,
      ],
    },
    {
      role: "baby_wolf",
      team: "wildcard",
      summary: `Starts with the village, but joins the pack if the ${wolves} bite them.`,
      details: [
        `Wakes up on Night 1 only, so you know who it is`,
        `If the ${wolves} pick them, they survive and become a ${wolf} the next night: tap their shoulder before waking the pack`,
        `The ${seer} sees them as "not a ${wolf}" until they turn`,
        `At the ${courtesan}'s house they're safe: no bite, no change`,
      ],
    },
    {
      role: "seer",
      team: "village",
      summary: `Every night, checks one player: ${wolf} or not.`,
      details: [`${rolePlural("wolf", rn)} show as "${wolf}"`, `The ${queen} and the ${baby} show as "not a ${wolf}"`],
    },
    {
      role: "wizard",
      team: "village",
      summary: "Has two potions, each usable once per game: one saves a life, one takes one.",
      details: [
        "Sees who is dying tonight and can save one of them",
        `Saving the attacked ${courtesan} saves her guest too`,
        "Can poison any player",
        `If the ${wizard} is dying tonight, they can still use a potion`,
      ],
    },
    {
      role: "courtesan",
      team: "village",
      summary: `Every night, invites a guest who is then safe from the ${wolves}.`,
      details: [
        `If the ${wolves} attack her guest, nobody dies`,
        `If she invites a ${wolf}, she dies`,
        `If the ${wolves} attack her, she and her guest both die (a ${wolf} guest survives)`,
        "She can't invite the same player two nights in a row",
      ],
    },
    {
      role: "villager",
      team: "village",
      summary: "No special power.",
      details: ["Discusses and votes during the day", `Wins with the village once every ${wolf} is dead`],
    },
  ]
}

const TEAM_LABEL: Record<Team, string> = {
  wolves: "Wolf pack",
  village: "Village",
  wildcard: "Wildcard",
}

const TEAM_TEXT: Record<Team, string> = {
  wolves: "text-blood-400",
  village: "text-leaf-400",
  wildcard: "text-sun-300",
}

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
        nobody has are skipped, and a dead role is still called so the table can&apos;t tell.
      </p>

      <SectionLabel>Roles</SectionLabel>
      <div className="space-y-2.5">
        {roleInfo(rn).map((info) => (
          <div
            key={info.role}
            className="rounded-2xl border border-white/5 bg-night-800/70 p-4">
            <div className="flex items-start gap-3.5">
              <IconTile
                icon={ROLE_ICON[info.role]}
                tone={ROLE_TONE[info.role]}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <div className="text-[17px] font-bold text-mist-100">{roleName(info.role, rn)}</div>
                  <div className={cx("text-[11px] font-bold uppercase tracking-wide", TEAM_TEXT[info.team])}>
                    {TEAM_LABEL[info.team]}
                  </div>
                </div>
                <div className="mt-1 text-[15px] leading-snug text-mist-200">{info.summary}</div>
                <ul className="mt-2 space-y-1">
                  {info.details.map((detail) => (
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
        ))}
      </div>
    </Sheet>
  )
}
