// Joins class names, skipping the falsy ones
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ")
}

// One optional id as a list, for single-select grids
export function asList(id: string | null | undefined): string[] {
  if (!id) return []
  return [id]
}
