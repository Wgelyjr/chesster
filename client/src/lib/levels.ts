export interface Level {
  id: number
  label: string
  depth: number
}

export const LEVELS: Level[] = [
  { id: 1, label: 'Hard', depth: 1 },
  { id: 2, label: 'Insane', depth: 8 },
  { id: 3, label: 'Impossible', depth: 16 },
]

export function levelById(id: number): Level {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}
