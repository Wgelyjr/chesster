export type Result =
  | 'checkmate'
  | 'win'
  | 'stalemate'
  | 'threefold'
  | 'insufficient'
  | 'fifty_move'
  | 'resignation'

export type Color = 'w' | 'b'

export interface LeaderboardRow {
  id: number
  name: string
  difficulty: number
  score: number
  result: Result
  color: Color
  created_at: string
}

export interface SubmittedRun {
  id: number
  name: string
  difficulty: number
  score: number
  result: Result
  color: Color
  created_at: string
}

export type GamePhase = 'setup' | 'playing' | 'over'
