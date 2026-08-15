export interface Level {
  id: number
  label: string
  depth: number
  movetime: number
}

export const LEVELS: Level[] = [
  { id: 1, label: 'Rookie', depth: 1, movetime: 800 },
  { id: 2, label: 'Amateur', depth: 2, movetime: 1200 },
  { id: 3, label: 'Club', depth: 3, movetime: 1500 },
  { id: 4, label: 'Solid', depth: 5, movetime: 2000 },
  { id: 5, label: 'Sharp', depth: 7, movetime: 2500 },
  { id: 6, label: 'Strong', depth: 9, movetime: 3000 },
  { id: 7, label: 'Fierce', depth: 12, movetime: 4000 },
  { id: 8, label: 'Ruthless', depth: 16, movetime: 6000 },
]

export function levelById(id: number): Level {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}
