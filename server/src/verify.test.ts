import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { categorizeEnd, verifyRun } from './verify.js'

const FOOLS_MATE = ['f3', 'e5', 'g4', 'Qh4#']
const THREEFOLD = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']
const STALEMATE_FEN = 'k7/1RK5/8/8/8/8/8/8 b - - 0 1'
const INSUFFICIENT_FEN = '8/8/8/4k3/8/8/4K3/8 b - - 0 1'
const FIFTY_MOVE_FEN = '4k3/8/8/8/8/8/8/4K2R w - - 100 1'

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

  it('returns insufficient material', () => {
    expect(categorizeEnd(new Chess(INSUFFICIENT_FEN), 'w')).toBe('insufficient')
  })

  it('returns fifty_move', () => {
    expect(categorizeEnd(new Chess(FIFTY_MOVE_FEN), 'w')).toBe('fifty_move')
  })

  it('returns null when the game is still on', () => {
    expect(categorizeEnd(new Chess(), 'w')).toBeNull()
  })
})

describe('verifyRun', () => {
  it('accepts a legal checkmate and computes the user score', () => {
    const outcome = verifyRun('w', FOOLS_MATE, 'checkmate')
    expect(outcome).toEqual({ ok: true, score: 2, result: 'checkmate' })
  })

  it('accepts a user win and computes the user score', () => {
    const outcome = verifyRun('b', FOOLS_MATE, 'win')
    expect(outcome).toEqual({ ok: true, score: 2, result: 'win' })
  })

  it('accepts a threefold repetition draw', () => {
    const outcome = verifyRun('w', THREEFOLD, 'threefold')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result).toBe('threefold')
      expect(outcome.score).toBe(4)
    }
  })

  it('rejects a result that does not match the game', () => {
    const outcome = verifyRun('w', FOOLS_MATE, 'stalemate')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('submitted result does not match the game')
  })

  it('rejects an illegal move', () => {
    const outcome = verifyRun('w', ['e4', 'e5', 'Nf6'], 'resignation')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('illegal move in submitted game')
  })

  it('rejects an empty move list', () => {
    const outcome = verifyRun('w', [], 'resignation')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('invalid move list')
  })

  it('accepts a resignation on an unfinished game', () => {
    const outcome = verifyRun('w', ['e4', 'e5'], 'resignation')
    expect(outcome).toEqual({ ok: true, score: 1, result: 'resignation' })
  })

  it('rejects a non-resignation result on an unfinished game', () => {
    const outcome = verifyRun('w', ['e4', 'e5'], 'checkmate')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('game was not finished')
  })
})
