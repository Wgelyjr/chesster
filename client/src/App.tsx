import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import type { Move, Square } from 'chess.js'
import Board, { PromotionPicker } from './components/Board'
import GameOverModal from './components/GameOverModal'
import GamePanel from './components/GamePanel'
import Leaderboard from './components/Leaderboard'
import { engine } from './lib/engine'
import { categorizeEnd } from './lib/game'
import { levelById } from './lib/levels'
import type { Color, GamePhase, Result } from './types'

interface PromotionPending {
  from: string
  to: string
}

interface GameOverInfo {
  result: Result
  score: number
}

function findKingSquare(chess: Chess, color: 'w' | 'b'): string | null {
  const found = chess.findPiece({ type: 'k', color })
  return found.length > 0 ? found[0] : null
}

export default function App() {
  const chessRef = useRef(new Chess())
  const movesRef = useRef<string[]>([])
  const userMoveCountRef = useRef(0)
  const thinkingRef = useRef(false)
  const phaseRef = useRef<GamePhase>('setup')
  const userColorRef = useRef<Color>('w')
  const difficultyRef = useRef<number>(1)
  const genRef = useRef(0)
  const promotionRef = useRef<PromotionPending | null>(null)

  const [phase, setPhaseState] = useState<GamePhase>('setup')
  const [userColor, setUserColor] = useState<Color>('w')
  const [difficulty, setDifficulty] = useState<number>(1)
  const [fen, setFen] = useState<string>(() => chessRef.current.fen())
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [inCheck, setInCheck] = useState<boolean>(false)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [score, setScore] = useState<number>(0)
  const [thinking, setThinking] = useState<boolean>(false)
  const [promotion, setPromotionState] = useState<PromotionPending | null>(null)
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)

  const setPhase = useCallback((p: GamePhase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  const setPromotion = useCallback((p: PromotionPending | null) => {
    promotionRef.current = p
    setPromotionState(p)
  }, [])

  const syncBoard = useCallback(() => {
    const chess = chessRef.current
    setFen(chess.fen())
    setTurn(chess.turn())
    setInCheck(chess.isCheck())
  }, [])

  const finishGame = useCallback(
    (result: Result) => {
      genRef.current++
      thinkingRef.current = false
      setThinking(false)
      setPromotion(null)
      setPhase('over')
      setGameOver({ result, score: userMoveCountRef.current })
    },
    [setPhase, setPromotion],
  )

  const engineMove = useCallback(async () => {
    const gen = ++genRef.current
    const chess = chessRef.current
    const level = levelById(difficultyRef.current)
    thinkingRef.current = true
    setThinking(true)
    try {
      const uci = await engine.bestMove(chess.fen(), level)
      if (gen !== genRef.current || phaseRef.current !== 'playing') return
      thinkingRef.current = false
      setThinking(false)
      if (uci === null) {
        setEngineError('The engine could not find a move. Please restart.')
        return
      }
      let m: Move
      try {
        m = chess.move(uci)
      } catch {
        setEngineError('The engine returned an illegal move. Please restart.')
        return
      }
      movesRef.current.push(m.san)
      setLastMove({ from: m.from, to: m.to })
      syncBoard()
      if (chess.isGameOver()) {
        const result = categorizeEnd(chess, userColorRef.current)
        if (result) finishGame(result)
      }
    } catch {
      if (gen === genRef.current && phaseRef.current === 'playing') {
        thinkingRef.current = false
        setThinking(false)
        setEngineError('The chess engine failed to start or crashed.')
      }
    }
  }, [syncBoard, finishGame])

  const applyUserMove = useCallback(
    (m: Move) => {
      const chess = chessRef.current
      movesRef.current.push(m.san)
      userMoveCountRef.current++
      setScore(userMoveCountRef.current)
      setLastMove({ from: m.from, to: m.to })
      syncBoard()
      if (chess.isGameOver()) {
        const result = categorizeEnd(chess, userColorRef.current)
        if (result) {
          finishGame(result)
          return
        }
      }
      void engineMove()
    },
    [syncBoard, finishGame, engineMove],
  )

  const handlePieceDrop = useCallback(
    (args: { sourceSquare: string; targetSquare: string | null }): boolean => {
      const { sourceSquare, targetSquare } = args
      if (!targetSquare) return false
      if (phaseRef.current !== 'playing') return false
      if (promotionRef.current !== null) return false
      const chess = chessRef.current
      if (chess.turn() !== userColorRef.current || thinkingRef.current) return false
      const piece = chess.get(sourceSquare as Square)
      if (!piece || piece.color !== userColorRef.current) return false
      const isPromotion =
        piece.type === 'p' &&
        ((userColorRef.current === 'w' && targetSquare[1] === '8') ||
          (userColorRef.current === 'b' && targetSquare[1] === '1'))
      if (isPromotion) {
        const legal = chess
          .moves({ square: sourceSquare as Square, verbose: true })
          .some((mm) => mm.from === sourceSquare && mm.to === targetSquare)
        if (!legal) return false
        setPromotion({ from: sourceSquare, to: targetSquare })
        return false
      }
      let m: Move
      try {
        m = chess.move({ from: sourceSquare, to: targetSquare })
      } catch {
        return false
      }
      applyUserMove(m)
      return true
    },
    [applyUserMove, setPromotion],
  )

  const choosePromotion = useCallback(
    (promo: 'q' | 'r' | 'b' | 'n') => {
      const pending = promotionRef.current
      if (!pending) return
      setPromotion(null)
      if (phaseRef.current !== 'playing') return
      const chess = chessRef.current
      let m: Move
      try {
        m = chess.move({ from: pending.from, to: pending.to, promotion: promo })
      } catch {
        return
      }
      applyUserMove(m)
    },
    [applyUserMove, setPromotion],
  )

  const cancelPromotion = useCallback(() => {
    setPromotion(null)
  }, [setPromotion])

  const startGame = useCallback(
    (color: Color, level: number) => {
      genRef.current++
      const chess = chessRef.current
      chess.reset()
      movesRef.current = []
      userMoveCountRef.current = 0
      thinkingRef.current = false
      userColorRef.current = color
      difficultyRef.current = level
      setUserColor(color)
      setDifficulty(level)
      setScore(0)
      setThinking(false)
      setGameOver(null)
      setEngineError(null)
      setLastMove(null)
      setPromotion(null)
      setPhase('playing')
      syncBoard()
      if (color === 'b') void engineMove()
    },
    [setPhase, setPromotion, syncBoard, engineMove],
  )

  const playAgain = useCallback(() => {
    startGame(userColorRef.current, difficultyRef.current)
  }, [startGame])

  const backToSetup = useCallback(() => {
    genRef.current++
    thinkingRef.current = false
    chessRef.current.reset()
    movesRef.current = []
    userMoveCountRef.current = 0
    setThinking(false)
    setScore(0)
    setGameOver(null)
    setEngineError(null)
    setLastMove(null)
    setPromotion(null)
    setPhase('setup')
    syncBoard()
  }, [setPhase, setPromotion, syncBoard])

  const resign = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    finishGame('resignation')
  }, [finishGame])

  const checkSquare = useMemo(() => {
    if (!inCheck) return null
    return findKingSquare(chessRef.current, turn)
  }, [inCheck, turn, fen])

  useEffect(() => {
    return () => {
      genRef.current++
      thinkingRef.current = false
    }
  }, [])

  const userTurn = phase === 'playing' && turn === userColor && !thinking
  const allowDragging = userTurn && engineError === null

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Chesster</h1>
        <p className="app-tagline">How long can you last against Stockfish?</p>
      </header>
      <main className="main-grid">
        <section className="board-col">
          <div className="board-frame">
            <Board
              fen={fen}
              orientation={userColor === 'w' ? 'white' : 'black'}
              allowDragging={allowDragging}
              lastMove={lastMove}
              checkSquare={checkSquare}
              onPieceDrop={handlePieceDrop}
            />
            {promotion !== null && (
              <PromotionPicker
                onPromote={choosePromotion}
                onCancel={cancelPromotion}
                dark={userColor === 'b'}
              />
            )}
          </div>
          <div className="board-footer">
            <span className="muted">
              {phase === 'setup'
                ? 'Pick a difficulty and press Play.'
                : thinking
                  ? 'Stockfish is thinking…'
                  : userTurn
                    ? 'Your move — drag a piece.'
                    : gameOver
                      ? 'Game over.'
                      : 'Waiting…'}
            </span>
          </div>
        </section>
        <aside className="side-col">
          <GamePanel
            phase={phase}
            userColor={userColor}
            difficulty={difficulty}
            turn={turn}
            thinking={thinking}
            score={score}
            engineError={engineError}
            onSelectColor={setUserColor}
            onSelectDifficulty={setDifficulty}
            onStart={() => startGame(userColor, difficulty)}
            onResign={resign}
          />
          <Leaderboard />
        </aside>
      </main>
      {gameOver !== null && phase === 'over' && (
        <GameOverModal
          result={gameOver.result}
          score={gameOver.score}
          difficulty={difficultyRef.current}
          color={userColorRef.current}
          moves={movesRef.current.slice()}
          onPlayAgain={playAgain}
          onNewSetup={backToSetup}
        />
      )}
    </div>
  )
}
