import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import {
  categorizeEnd,
  explainBlockedMove,
  explainNoMoves,
  isDrawResult,
  MOVE_BLOCK_TEXT,
  resultShort,
  resultSubtitle,
  resultTitle,
} from './game'
import type { MoveBlockReason } from './game'
import type { Result } from '../types'

const FOOLS_MATE = ['f3', 'e5', 'g4', 'Qh4#']
const STALEMATE_FEN = 'k7/1RK5/8/8/8/8/8/8 b - - 0 1'
const CHECK_FEN = 'R3k3/8/8/8/8/8/4q3/4K3 w - - 0 1'
const PIN_FEN = '4rk2/8/8/8/4B3/8/8/4K3 w - - 0 1'
const BLOCKED_KNIGHT_FEN = '4k3/8/8/8/8/1P6/2P5/N3K3 w - - 0 1'
const ALL_RESULTS: Result[] = [
  'checkmate',
  'win',
  'stalemate',
  'threefold',
  'insufficient',
  'fifty_move',
  'resignation',
]

describe('categorizeEnd', () => {
  it('returns checkmate when the user is mated', () => {
    const chess = new Chess()
    for (const san of FOOLS_MATE) chess.move(san)
    expect(categorizeEnd(chess, 'w')).toBe('checkmate')
  })

  it('returns win when the user delivers mate', () => {
    const chess = new Chess()
    for (const san of FOOLS_MATE) chess.move(san)
    expect(categorizeEnd(chess, 'b')).toBe('win')
  })

  it('returns stalemate', () => {
    expect(categorizeEnd(new Chess(STALEMATE_FEN), 'w')).toBe('stalemate')
  })

  it('returns null when the game is still on', () => {
    expect(categorizeEnd(new Chess(), 'w')).toBeNull()
  })
})

describe('isDrawResult', () => {
  it('marks draw results', () => {
    expect(isDrawResult('stalemate')).toBe(true)
    expect(isDrawResult('threefold')).toBe(true)
    expect(isDrawResult('insufficient')).toBe(true)
    expect(isDrawResult('fifty_move')).toBe(true)
  })

  it('does not mark decisive or resignation results', () => {
    expect(isDrawResult('checkmate')).toBe(false)
    expect(isDrawResult('win')).toBe(false)
    expect(isDrawResult('resignation')).toBe(false)
  })
})

describe('resultTitle', () => {
  it('titles decisive outcomes', () => {
    expect(resultTitle('checkmate')).toBe('Checkmated!')
    expect(resultTitle('win')).toBe('You checkmated Stockfish!')
    expect(resultTitle('resignation')).toBe('You resigned')
  })

  it('titles draws generically', () => {
    expect(resultTitle('stalemate')).toBe('Draw')
    expect(resultTitle('fifty_move')).toBe('Draw')
  })
})

describe('resultShort', () => {
  it('shortens decisive outcomes', () => {
    expect(resultShort('checkmate')).toBe('Mated')
    expect(resultShort('win')).toBe('Won')
    expect(resultShort('resignation')).toBe('Resigned')
  })

  it('shortens draws generically', () => {
    expect(resultShort('stalemate')).toBe('Draw')
    expect(resultShort('threefold')).toBe('Draw')
  })
})

describe('resultSubtitle', () => {
  it('returns a non-empty subtitle for every result', () => {
    for (const result of ALL_RESULTS) {
      expect(resultSubtitle(result).length).toBeGreaterThan(0)
    }
  })

  it('spot-checks specific subtitles', () => {
    expect(resultSubtitle('checkmate')).toBe('Stockfish got you. How far did you get?')
    expect(resultSubtitle('win')).toBe('The engine fell. Legendary.')
    expect(resultSubtitle('stalemate')).toBe('Stalemate — you survived!')
  })
})

describe('explainBlockedMove', () => {
  it('flags moving onto your own piece', () => {
    expect(explainBlockedMove(new Chess(), 'a1', 'b1', 'w')).toBe('own_piece')
  })

  it('flags a non-king move that does not resolve check', () => {
    const chess = new Chess(CHECK_FEN)
    expect(chess.moves({ square: 'a1', verbose: true })).toHaveLength(0)
    expect(explainBlockedMove(chess, 'a1', 'a3', 'w')).toBe(
      'check_does_not_protect',
    )
  })

  it('flags moving the checked king onto an attacked square', () => {
    const chess = new Chess(CHECK_FEN)
    expect(explainBlockedMove(chess, 'e1', 'f1', 'w')).toBe(
      'check_king_attacked_square',
    )
  })

  it('flags king geometry before check when the square is out of reach', () => {
    const chess = new Chess(CHECK_FEN)
    expect(explainBlockedMove(chess, 'e1', 'e3', 'w')).toBe('unreachable')
  })

  it('flags a pinned piece that would expose the king', () => {
    const chess = new Chess(PIN_FEN)
    expect(explainBlockedMove(chess, 'e4', 'd5', 'w')).toBe('pin_exposes_king')
  })

  it('flags moves the piece simply cannot make', () => {
    expect(explainBlockedMove(new Chess(), 'g1', 'e4', 'w')).toBe('unreachable')
  })

  it('has text for every reason', () => {
    const reasons: MoveBlockReason[] = [
      'own_piece',
      'check_king_attacked_square',
      'check_does_not_protect',
      'pin_exposes_king',
      'unreachable',
    ]
    for (const reason of reasons) {
      expect(MOVE_BLOCK_TEXT[reason].length).toBeGreaterThan(0)
    }
  })
})

describe('explainNoMoves', () => {
  it('explains check for a non-king piece', () => {
    const chess = new Chess(CHECK_FEN)
    expect(explainNoMoves(chess, 'a1', 'w')).toBe(
      'You are in check — this piece can only move if it resolves the check.',
    )
  })

  it('explains a checked king with no escape', () => {
    const chess = new Chess(CHECK_FEN)
    expect(explainNoMoves(chess, 'e1', 'w')).toBe(
      'You are in check, and your king has no safe square.',
    )
  })

  it('explains a piece with no moves outside check', () => {
    const chess = new Chess(BLOCKED_KNIGHT_FEN)
    expect(chess.moves({ square: 'a1', verbose: true })).toHaveLength(0)
    expect(explainNoMoves(chess, 'a1', 'w')).toBe('This piece has no legal moves.')
  })
})
