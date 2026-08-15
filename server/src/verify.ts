import { Chess } from 'chess.js'
import type { Result } from './db.js'

export type VerifyOutcome =
  | { ok: true; score: number; result: Result }
  | { ok: false; reason: string }

export function categorizeEnd(chess: Chess, userColor: 'w' | 'b'): Result | null {
  if (chess.isCheckmate()) {
    return chess.turn() === userColor ? 'checkmate' : 'win'
  }
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isThreefoldRepetition()) return 'threefold'
  if (chess.isInsufficientMaterial()) return 'insufficient'
  if (chess.isDrawByFiftyMoves()) return 'fifty_move'
  return null
}

export function verifyRun(
  userColor: 'w' | 'b',
  moves: string[],
  claimedResult: Result,
): VerifyOutcome {
  if (
    !Array.isArray(moves) ||
    moves.length === 0 ||
    moves.length > 5000 ||
    !moves.every((m) => typeof m === 'string' && m.length > 0 && m.length <= 12)
  ) {
    return { ok: false, reason: 'invalid move list' }
  }

  const chess = new Chess()
  let score = 0
  for (const san of moves) {
    if (chess.turn() === userColor) score++
    try {
      chess.move(san)
    } catch {
      return { ok: false, reason: 'illegal move in submitted game' }
    }
  }

  if (chess.isGameOver()) {
    const result = categorizeEnd(chess, userColor)
    if (result === null) {
      return { ok: false, reason: 'could not determine game result' }
    }
    if (claimedResult !== result) {
      return { ok: false, reason: 'submitted result does not match the game' }
    }
    if (score < 1) return { ok: false, reason: 'score too low' }
    return { ok: true, score, result }
  }

  if (claimedResult === 'resignation') {
    if (score < 1) return { ok: false, reason: 'score too low' }
    return { ok: true, score, result: 'resignation' }
  }

  return { ok: false, reason: 'game was not finished' }
}
