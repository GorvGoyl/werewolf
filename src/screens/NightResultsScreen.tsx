import type { Death, GameState } from "../game/types"
import { roleName } from "../game/roles"
import {
  aliveWolves,
  alivePlayers,
  bittenBabyWolfOf,
  getPlayer,
  protectedGuestOf,
} from "../game/selectors"
import { causeText } from "../game/text"
import { dawnLines } from "../game/script"
import {
  ActionBar,
  Avatar,
  Button,
  Callout,
  IconTile,
  Screen,
  ScreenTitle,
  ScriptCard,
  SectionLabel,
  Stat,
  playerTone,
} from "../components/ui"
import { ROLE_ICON, playerIcon } from "../components/icons"
import type { ScreenProps } from "./props"

function deathsTitle(count: number): string {
  if (count === 0) return "Nobody died"
  if (count === 1) return "1 death"
  return `${count} deaths`
}

export function NightResultsScreen({ state, dispatch }: ScreenProps) {
  const rn = state.roleNames
  const night = state.nightEvents[state.nightEvents.length - 1]
  const deaths = night?.deaths ?? []

  if (!night) return null

  const protectedGuest = protectedGuestOf(state, night)
  const saved = getPlayer(state, night.wizardSaved)
  const bitten = bittenBabyWolfOf(state, night)
  const hasSecrets = protectedGuest || saved || bitten

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`Night ${state.currentNight} is over`}
          icon="sunrise"
          title={deathsTitle(deaths.length)}
          tone="sun"
        />
        <ScriptCard
          lines={dawnLines(state, deaths)}
          tone="sun"
        />

        {deaths.length > 0 && (
          <div className="space-y-2">
            {deaths.map((death) => (
              <DeathCard
                key={death.playerId}
                state={state}
                death={death}
              />
            ))}
          </div>
        )}

        {hasSecrets && <SectionLabel icon="secret">Only you know</SectionLabel>}
        {protectedGuest && (
          <Callout
            tone="moon"
            icon={ROLE_ICON.courtesan}
            title={`${protectedGuest.name} was safe at the ${roleName("courtesan", rn)}'s`}>
            The wolves attacked them, but nobody died.
          </Callout>
        )}
        {saved && (
          <Callout
            tone="leaf"
            icon="heal"
            title={`The ${roleName("wizard", rn)} saved ${saved.name}`}>
            The save potion is now used up.
          </Callout>
        )}
        {bitten && (
          <Callout
            tone="sun"
            icon={ROLE_ICON.baby_wolf}
            title={`${bitten.name} was bitten`}>
            The {roleName("baby_wolf", rn)} survives and joins the pack next night.
          </Callout>
        )}

        <div className="mt-5 flex rounded-2xl border border-white/5 bg-night-800/70 py-3.5">
          <Stat
            value={alivePlayers(state).length}
            label="Alive"
            tone="leaf"
            icon="heart"
          />
          <Stat
            value={state.players.length - alivePlayers(state).length}
            label="Dead"
            tone="blood"
            icon="skull"
          />
          <Stat
            value={aliveWolves(state).length}
            label="Wolves left"
            tone="sun"
            icon={ROLE_ICON.wolf}
          />
        </div>
      </Screen>
      <ActionBar>
        <Button
          tone="sun"
          icon="sun"
          onClick={() => dispatch({ type: "START_DAY" })}>
          Start Day {state.currentNight}
        </Button>
      </ActionBar>
    </>
  )
}

type DeathCardProps = { state: GameState; death: Death }

function DeathCard({ state, death }: DeathCardProps) {
  const player = getPlayer(state, death.playerId)
  if (!player) return null
  return (
    <div className="flex min-h-[72px] animate-pop items-center gap-3 rounded-2xl border border-blood-500/25 bg-blood-500/10 px-3.5 py-3">
      <Avatar name={player.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] font-semibold text-mist-100">{player.name}</div>
        <div className="text-[14px] leading-snug text-blood-300">{causeText(death.cause, state.roleNames)}</div>
      </div>
      <div className="flex max-w-24 shrink-0 flex-col items-center gap-1 text-center">
        <IconTile
          icon={playerIcon(player, state.babyWolfPlayerId)}
          tone={playerTone(player)}
          size="sm"
        />
        <div className="text-[12px] leading-tight text-mist-400">{roleName(player.role, state.roleNames)}</div>
      </div>
    </div>
  )
}
