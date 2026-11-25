/** Groups entries by first letter, letters in alphabetical order. */
export function groupByInitial<T extends { title: string }>(entries: T[], sortEntries: boolean): { letter: string; entries: T[] }[] {
  const list = sortEntries ? [...entries].sort((a, b) => a.title.localeCompare(b.title)) : entries
  const byLetter = new Map<string, T[]>()
  for (const entry of list) {
    const letter = entry.title.charAt(0).toUpperCase()
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry])
  }
  return [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, entries: items }))
}
