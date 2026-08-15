import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import {
  categorizeEnd,
  isDrawResult,
  resultShort,
  resultSubtitle,
  resultTitle,
} from './game'
import type { Result } from '../types'

const FOOLS_MATE = ['f3', 'e5', 'g4', 'Qh4#']
const STALEMATE_FEN = 'k7/1RK5/8/8/8/8/8/8 b - - 0 1'
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
