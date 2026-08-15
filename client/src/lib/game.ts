import { Chess } from 'chess.js'
import type { Color, Result } from '../types'

export function categorizeEnd(chess: Chess, userColor: Color): Result | null {
  if (chess.isCheckmate()) {
    return chess.turn() === userColor ? 'checkmate' : 'win'
  }
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isThreefoldRepetition()) return 'threefold'
  if (chess.isInsufficientMaterial()) return 'insufficient'
  if (chess.isDrawByFiftyMoves()) return 'fifty_move'
  return null
}

export function isDrawResult(result: Result): boolean {
  return (
    result === 'stalemate' ||
    result === 'threefold' ||
    result === 'insufficient' ||
    result === 'fifty_move'
  )
}

export function resultTitle(result: Result): string {
  switch (result) {
    case 'checkmate':
      return 'Checkmated!'
    case 'win':
      return 'You checkmated Stockfish!'
    case 'resignation':
      return 'You resigned'
    default:
      return 'Draw'
  }
}

export function resultSubtitle(result: Result): string {
  switch (result) {
    case 'checkmate':
      return 'Stockfish got you. How far did you get?'
    case 'win':
      return 'The engine fell. Legendary.'
    case 'resignation':
      return 'Better luck next time.'
    case 'stalemate':
      return 'Stalemate — you survived!'
    case 'threefold':
      return 'Threefold repetition — you survived!'
    case 'insufficient':
      return 'Insufficient material — you survived!'
    case 'fifty_move':
      return 'Fifty-move rule — you survived!'
  }
}

export function resultShort(result: Result): string {
  switch (result) {
    case 'checkmate':
      return 'Mated'
    case 'win':
      return 'Won'
    case 'resignation':
      return 'Resigned'
    default:
      return 'Draw'
  }
}
