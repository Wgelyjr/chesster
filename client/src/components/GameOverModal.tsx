import { useMemo, useState } from 'react'
import { NAME_STORAGE_KEY, readBest, submitRun, writeBest } from '../lib/api'
import { isDrawResult, resultSubtitle, resultTitle } from '../lib/game'
import type { Color, Result } from '../types'

interface GameOverModalProps {
  result: Result
  score: number
  difficulty: number
  color: Color
  moves: string[]
  onPlayAgain: () => void
  onNewSetup: () => void
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; rank: number }
  | { status: 'error'; message: string }

export default function GameOverModal({
  result,
  score,
  difficulty,
  color,
  moves,
  onPlayAgain,
  onNewSetup,
}: GameOverModalProps) {
  const [name, setName] = useState(() => localStorage.getItem(NAME_STORAGE_KEY) ?? '')
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' })

  const previousBest = useMemo(() => readBest(difficulty), [difficulty])
  const isNewBest = score > previousBest && previousBest > 0
  const isBest = score > previousBest

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 20) {
      setSubmit({ status: 'error', message: 'Name must be 1-20 characters.' })
      return
    }
    setSubmit({ status: 'submitting' })
    try {
      const { rank } = await submitRun({
        name: trimmed,
        difficulty,
        color,
        result,
        moves,
      })
      localStorage.setItem(NAME_STORAGE_KEY, trimmed)
      writeBest(difficulty, score)
      setSubmit({ status: 'success', rank })
    } catch (e: unknown) {
      setSubmit({
        status: 'error',
        message: e instanceof Error ? e.message : 'Failed to submit score.',
      })
    }
  }

  const draw = isDrawResult(result)

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true">
        <div className={`modal-badge ${draw ? 'badge-draw' : result === 'win' ? 'badge-win' : 'badge-loss'}`}>
          {result === 'win' ? 'VICTORY' : draw ? 'SURVIVED' : 'GAME OVER'}
        </div>
        <h2 className="modal-title">{resultTitle(result)}</h2>
        <p className="modal-sub">{resultSubtitle(result)}</p>
        <div className="modal-score">
          <div className="modal-score-num">{score}</div>
          <div className="modal-score-label">
            {score === 1 ? 'move' : 'moves'} on level {difficulty}
          </div>
          {isBest && <div className="best-badge">{previousBest > 0 ? 'New best!' : 'First score!'}</div>}
          {isNewBest && <div className="muted small">previous best: {previousBest}</div>}
        </div>

        <div className="modal-submit">
          {submit.status === 'success' ? (
            <p className="success-text">
              Saved! You're <strong>#{submit.rank}</strong> on the level {difficulty} board.
            </p>
          ) : (
            <>
              <div className="field-label">Claim your score</div>
              <div className="modal-name-row">
                <input
                  className="name-input"
                  value={name}
                  placeholder="Your name"
                  maxLength={20}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (submit.status === 'error') setSubmit({ status: 'idle' })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && submit.status !== 'submitting') void handleSubmit()
                  }}
                  disabled={submit.status === 'submitting'}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleSubmit()}
                  disabled={submit.status === 'submitting'}
                >
                  {submit.status === 'submitting' ? 'Saving…' : 'Save'}
                </button>
              </div>
              {submit.status === 'error' && <p className="error-text">{submit.message}</p>}
            </>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onPlayAgain}>
            Play again
          </button>
          <button type="button" className="btn btn-ghost" onClick={onNewSetup}>
            Change settings
          </button>
        </div>
      </div>
    </div>
  )
}
