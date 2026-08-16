import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import type { Color, Result } from '../types'

export function findKingSquare(chess: Chess, color: Color): string | null {
  const found = chess.findPiece({ type: 'k', color })
  return found.length > 0 ? found[0] : null
}

export type MoveBlockReason =
  | 'own_piece'
  | 'check_king_attacked_square'
  | 'check_does_not_protect'
  | 'pin_exposes_king'
  | 'unreachable'

export const MOVE_BLOCK_TEXT: Record<MoveBlockReason, string> = {
  own_piece: "You can't move onto your own piece.",
  check_king_attacked_square: "You're in check — that square is attacked.",
  check_does_not_protect: 'You are in check — that move does not protect your king.',
  pin_exposes_king: 'That would expose your king — this piece is pinned.',
  unreachable: 'This piece cannot move to that square.',
}

function squaresAdjacent(a: Square, b: Square): boolean {
  const fileDiff = Math.abs(a.charCodeAt(0) - b.charCodeAt(0))
  const rankDiff = Math.abs(Number(a[1]) - Number(b[1]))
  return fileDiff <= 1 && rankDiff <= 1 && (fileDiff > 0 || rankDiff > 0)
}

function moveExposesKing(fen: string, from: Square, to: Square, color: Color): boolean {
  const parts = fen.split(' ')
  const rows = parts[0].split('/')
  const grid: string[][] = []
  for (const row of rows) {
    const cells: string[] = []
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        for (let i = 0; i < Number(ch); i++) cells.push('.')
      } else {
        cells.push(ch)
      }
    }
    grid.push(cells)
  }
  const toRC = (sq: Square) => ({ r: 8 - Number(sq[1]), c: sq.charCodeAt(0) - 97 })
  const fromRC = toRC(from)
  const toRCv = toRC(to)
  let piece = grid[fromRC.r][fromRC.c]
  if (piece === '.') return false
  const lastRank = toRCv.r === 0 || toRCv.r === 7
  if (lastRank && (piece === 'p' || piece === 'P')) {
    piece = color === 'w' ? 'Q' : 'q'
  }
  grid[fromRC.r][fromRC.c] = '.'
  grid[toRCv.r][toRCv.c] = piece
  const compress = (row: string[]) => {
    let out = ''
    let run = 0
    for (const cell of row) {
      if (cell === '.') {
        run++
        continue
      }
      if (run > 0) {
        out += String(run)
        run = 0
      }
      out += cell
    }
    if (run > 0) out += String(run)
    return out
  }
  parts[0] = grid.map(compress).join('/')
  parts[3] = '-'
  const hypothetical = new Chess(parts.join(' '))
  const king = hypothetical.findPiece({ type: 'k', color })
  if (king.length === 0) return false
  const opponent: Color = color === 'w' ? 'b' : 'w'
  return hypothetical.isAttacked(king[0], opponent)
}

export function explainBlockedMove(
  chess: Chess,
  from: Square,
  to: Square,
  color: Color,
): MoveBlockReason {
  const target = chess.get(to)
  if (target && target.color === color) return 'own_piece'
  if (chess.isCheck()) {
    const kingSquare = findKingSquare(chess, color)
    if (from === kingSquare && !squaresAdjacent(from, to)) return 'unreachable'
    if (from === kingSquare) return 'check_king_attacked_square'
    return 'check_does_not_protect'
  }
  if (moveExposesKing(chess.fen(), from, to, color)) return 'pin_exposes_king'
  return 'unreachable'
}

export function explainNoMoves(chess: Chess, from: Square, color: Color): string {
  if (chess.isCheck()) {
    const kingSquare = findKingSquare(chess, color)
    if (from === kingSquare) {
      return 'You are in check, and your king has no safe square.'
    }
    return 'You are in check — this piece can only move if it resolves the check.'
  }
  return 'This piece has no legal moves.'
}

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
