import { useState } from "react"
import type { Role, RoleNames } from "../game/types"
import { DEFAULT_ROLE_NAMES, ROLE_EMOJI, ROLE_ORDER } from "../game/roles"
import { Button, Sheet } from "./ui"

type Props = {
  roleNames: RoleNames
  onSave: (roleNames: RoleNames) => void
  onClose: () => void
}

export function RoleNamesEditor({ roleNames, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<RoleNames>({ ...roleNames })

  function handleSave() {
    // Only keep names that differ from the defaults
    const cleaned: RoleNames = {}
    for (const role of ROLE_ORDER) {
      const value = draft[role]?.trim()
      if (value && value !== DEFAULT_ROLE_NAMES[role]) cleaned[role] = value
    }
    onSave(cleaned)
  }

  return (
    <Sheet
      title="Role names"
      subtitle="Match the names on your cards"
      onClose={onClose}
      closeLabel="Cancel"
      footer={
        <>
          <Button
            variant="secondary"
            className="w-auto px-5"
            onClick={() => setDraft({})}>
            Reset
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </>
      }>
      <div className="space-y-2">
        {ROLE_ORDER.map((role: Role) => (
          <label
            key={role}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-night-800/70 px-3.5 py-2.5">
            <span
              className="w-9 text-center text-2xl"
              aria-hidden>
              {ROLE_EMOJI[role]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-mist-500">
                {DEFAULT_ROLE_NAMES[role]}
              </span>
              <input
                type="text"
                value={draft[role] ?? ""}
                placeholder={DEFAULT_ROLE_NAMES[role]}
                maxLength={40}
                autoCapitalize="words"
                onChange={(e) => setDraft((prev) => ({ ...prev, [role]: e.target.value }))}
                className="mt-0.5 w-full rounded-lg border border-white/10 bg-night-950 px-3 py-2 text-[16px] text-mist-100 placeholder-mist-500 outline-none focus:border-moon-400"
              />
            </span>
          </label>
        ))}
      </div>
    </Sheet>
  )
}
