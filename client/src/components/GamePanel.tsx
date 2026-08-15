import { LEVELS } from '../lib/levels'
import type { Color, GamePhase } from '../types'

interface GamePanelProps {
  phase: GamePhase
  userColor: Color
  difficulty: number
  turn: 'w' | 'b'
  thinking: boolean
  score: number
  engineError: string | null
  onSelectColor: (c: Color) => void
  onSelectDifficulty: (d: number) => void
  onStart: () => void
  onResign: () => void
}

export default function GamePanel({
  phase,
  userColor,
  difficulty,
  turn,
  thinking,
  score,
  engineError,
  onSelectColor,
  onSelectDifficulty,
  onStart,
  onResign,
}: GamePanelProps) {
  if (phase === 'setup') {
    return (
      <section className="panel">
        <h2>Start a run</h2>
        <p className="panel-hint">
          Play Stockfish. The game ends the moment it ends — your score is how many
          moves you made.
        </p>
        <div className="field">
          <div className="field-label">Difficulty</div>
          <div className="diff-grid">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`diff-btn ${difficulty === l.id ? 'diff-active' : ''}`}
                onClick={() => onSelectDifficulty(l.id)}
              >
                <span className="diff-num">{l.id}</span>
                <span className="diff-label">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">Play as</div>
          <div className="color-toggle">
            <button
              type="button"
              className={`color-btn ${userColor === 'w' ? 'color-active' : ''}`}
              onClick={() => onSelectColor('w')}
            >
              <span className="color-dot dot-w" /> White
            </button>
            <button
              type="button"
              className={`color-btn ${userColor === 'b' ? 'color-active' : ''}`}
              onClick={() => onSelectColor('b')}
            >
              <span className="color-dot dot-b" /> Black
            </button>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={onStart}>
          Play
        </button>
      </section>
    )
  }

  const userTurn = turn === userColor && !thinking
  const level = LEVELS.find((l) => l.id === difficulty)

  return (
    <section className="panel">
      <h2>
        Run · Level {difficulty} <span className="muted">{level?.label}</span>
      </h2>
      <div className="status-line">
        {thinking ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <span>Stockfish is thinking…</span>
          </>
        ) : userTurn ? (
          <span className="status-you">Your move</span>
        ) : (
          <span className="muted">Waiting…</span>
        )}
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="stat-value">{score}</div>
          <div className="stat-label">your moves</div>
        </div>
        <div className="stat">
          <div className="stat-value">{userColor === 'w' ? 'White' : 'Black'}</div>
          <div className="stat-label">playing as</div>
        </div>
      </div>
      {engineError ? (
        <div className="error-box">
          <p>{engineError}</p>
          <button type="button" className="btn btn-primary" onClick={onStart}>
            Restart
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-danger btn-block" onClick={onResign}>
          Resign
        </button>
      )}
    </section>
  )
}
