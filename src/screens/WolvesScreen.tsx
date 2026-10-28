import { useState } from "react"
import { getRegularWolfCount, isWolf, roleName, rolePlural } from "../game/roles"
import {
  aliveId,
  alivePlayers,
  babyWolfJoinsTonight,
  findRole,
  getPlayer,
  getWolvesStep,
  playerName,
} from "../game/selectors"
import { closeEyes, nightQuestion, openEyes } from "../game/script"
import { joinNames } from "../game/text"
import { ActionBar, Button, Callout, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { ROLE_ICON } from "../components/icons"
import { asList } from "../lib/cx"
import { IdentifyStep, nightEyebrow, nightfall } from "./night"
import type { ScreenProps } from "./props"

export function WolvesScreen({ state, dispatch }: ScreenProps) {
  const rn = state.roleNames
  const step = getWolvesStep(state)
  const queen = roleName("queen_wolf", rn)
  const wolves = rolePlural("wolf", rn)

  if (step === "queen") {
    return (
      <IdentifyStep
        key="identify-queen"
        state={state}
        dispatch={dispatch}
        role="queen_wolf"
        title={queen}
        tone="blood"
        lines={[...nightfall(state, true), openEyes(state, "queen_wolf")]}
        instruction="Tap the player who opened their eyes"
        confirmLabel={([who]) => `${who} is the ${queen}`}
        onConfirm={([id]) => dispatch({ type: "ASSIGN_ROLE", playerId: id, role: "queen_wolf" })}
      />
    )
  }

  if (step === "pack") {
    const count = getRegularWolfCount(state.gameConfig)
    const withQueen = state.gameConfig.hasQueenWolf
    let instruction = `Tap the ${count} ${wolves.toLowerCase()}`
    if (count === 1) instruction = `Tap the ${roleName("wolf", rn).toLowerCase()}`
    if (withQueen) instruction = `${instruction} (not the ${queen})`
    return (
      <IdentifyStep
        key="identify-pack"
        state={state}
        dispatch={dispatch}
        role="wolf"
        title={wolves}
        tone="blood"
        count={count}
        lines={[...nightfall(state, !withQueen), openEyes(state, "wolf")]}
        instruction={instruction}
        confirmLabel={(names) => packLabel(names, roleName("wolf", rn), wolves)}
        onConfirm={(ids) => dispatch({ type: "ASSIGN_WOLVES", playerIds: ids })}
      />
    )
  }

  return (
    <WolvesAttack
      state={state}
      dispatch={dispatch}
    />
  )
}

function packLabel(names: string[], wolf: string, wolves: string): string {
  if (names.length === 1) return `${names[0]} is the ${wolf}`
  return `${joinNames(names)} are the ${wolves}`
}

function WolvesAttack({ state, dispatch }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const rn = state.roleNames
  const wolves = rolePlural("wolf", rn)
  const courtesanName = roleName("courtesan", rn)
  const babyName = roleName("baby_wolf", rn)

  const players = alivePlayers(state)
  const pack = players.filter((p) => isWolf(p.role))
  const notes: Record<string, string> = {}
  for (const wolf of pack) notes[wolf.id] = roleName(wolf.role, rn)

  const courtesan = findRole(state, "courtesan")
  const guestId = aliveId(state, state.currentNightEvent.courtesanGuest)
  const guest = getPlayer(state, guestId)
  if (guest && !isWolf(guest.role)) notes[guest.id] = "Guest"

  const baby = getPlayer(state, state.babyWolfPlayerId)
  const babyUnbitten = baby?.isAlive && baby.role === "baby_wolf"
  if (baby && babyUnbitten) notes[baby.id] = babyName

  const joining = babyWolfJoinsTonight(state)

  // On Night 1 the pack already opened their eyes to be identified
  const awake = state.currentNight > 1
  const lines = nightfall(state, awake)
  if (awake) lines.push(openEyes(state, "wolf"))
  lines.push(nightQuestion(state, "wolf"))

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON.wolf}
          title={wolves}
          subtitle={`${joinNames(pack.map((p) => p.name))} pick a victim.`}
          tone="blood"
          role="wolf"
        />
        {joining && (
          <Callout
            tone="sun"
            icon={ROLE_ICON.baby_wolf}
            title={`${joining.name} joins the pack tonight`}>
            The {babyName} was bitten last night. Tap {joining.name}&apos;s shoulder before you wake the{" "}
            {wolves.toLowerCase()}, so they open their eyes too.
          </Callout>
        )}
        <ScriptCard
          lines={lines}
          after={[closeEyes(state, "wolf")]}
          tone="blood"
        />
        <Instruction>Tap the player they point at</Instruction>
        <PlayerGrid
          players={players}
          selectedIds={asList(selected)}
          onSelect={setSelected}
          disabledIds={pack.map((p) => p.id)}
          notes={notes}
          tone="blood"
          showRoles={state.showRoleBadges}
          babyWolfPlayerId={state.babyWolfPlayerId}
        />
        <div className="mt-3">
          {baby && babyUnbitten && (
            <Callout
              tone="sun"
              icon={ROLE_ICON.baby_wolf}
              title={`${baby.name} survives a bite`}>
              {baby.name} is the {babyName}: if picked, they join the pack next night instead of dying.
            </Callout>
          )}
          {courtesan?.isAlive && guest && (
            <CourtesanGuestHint
              guestName={guest.name}
              guestIsWolf={isWolf(guest.role)}
              courtesanName={courtesanName}
              wolves={wolves}
            />
          )}
        </div>
      </Screen>
      <ActionBar>
        <Button
          tone="blood"
          disabled={!selected}
          icon={selected !== null && ROLE_ICON.wolf}
          onClick={() => {
            if (selected) dispatch({ type: "SET_WOLF_TARGET", playerId: selected })
          }}>
          {selected && `Attack ${playerName(state, selected)}`}
          {!selected && "Tap the victim"}
        </Button>
      </ActionBar>
    </>
  )
}

type GuestHintProps = { guestName: string; guestIsWolf: boolean; courtesanName: string; wolves: string }

function CourtesanGuestHint({ guestName, guestIsWolf, courtesanName, wolves }: GuestHintProps) {
  if (guestIsWolf) {
    return (
      <Callout
        tone="blood"
        icon={ROLE_ICON.courtesan}
        title={`The ${courtesanName} invited ${guestName}, a wolf`}>
        She dies tonight, whoever the {wolves.toLowerCase()} pick.
      </Callout>
    )
  }
  return (
    <Callout
      tone="moon"
      icon={ROLE_ICON.courtesan}
      title={`The ${courtesanName} is with ${guestName}`}>
      If they pick {guestName}, nobody dies. If they pick the {courtesanName}, she and {guestName} both die.
    </Callout>
  )
}
