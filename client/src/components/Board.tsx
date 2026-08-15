import type { CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'

export interface PieceDropArgs {
  sourceSquare: string
  targetSquare: string | null
}

interface BoardProps {
  fen: string
  orientation: 'white' | 'black'
  allowDragging: boolean
  lastMove: { from: string; to: string } | null
  checkSquare: string | null
  onPieceDrop: (args: PieceDropArgs) => boolean
}

const PROMO_PIECES: Array<{ id: 'q' | 'r' | 'b' | 'n'; glyph: string; name: string }> = [
  { id: 'q', glyph: '♛', name: 'Queen' },
  { id: 'r', glyph: '♜', name: 'Rook' },
  { id: 'b', glyph: '♝', name: 'Bishop' },
  { id: 'n', glyph: '♞', name: 'Knight' },
]

export default function Board({
  fen,
  orientation,
  allowDragging,
  lastMove,
  checkSquare,
  onPieceDrop,
}: BoardProps) {
  const squareStyles: Record<string, CSSProperties> = {}
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(155, 199, 0, 0.45)' }
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(155, 199, 0, 0.45)' }
  }
  if (checkSquare) {
    squareStyles[checkSquare] = {
      background:
        'radial-gradient(circle, rgba(255, 40, 40, 0.8) 0%, rgba(231, 0, 0, 0.45) 45%, rgba(231, 0, 0, 0) 75%)',
    }
  }

  return (
    <div className="board-wrap">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging,
          onPieceDrop,
          squareStyles,
          animationDurationInMs: 180,
          boardStyle: { borderRadius: '8px' },
          darkSquareStyle: { backgroundColor: '#779556' },
          lightSquareStyle: { backgroundColor: '#ebecd0' },
        }}
      />
      {checkSquare !== null && <div className="check-flag">check!</div>}
      {allowDragging === false && (
        <div className="board-dim" aria-hidden="true" />
      )}
    </div>
  )
}

export function PromotionPicker({
  onPromote,
  onCancel,
  dark,
}: {
  onPromote: (piece: 'q' | 'r' | 'b' | 'n') => void
  onCancel: () => void
  dark: boolean
}) {
  return (
    <div className="promo-overlay">
      <div className="promo-card">
        <div className="promo-title">Promote to</div>
        <div className="promo-row">
          {PROMO_PIECES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`promo-btn ${dark ? 'promo-dark' : ''}`}
              onClick={() => onPromote(p.id)}
              title={p.name}
            >
              <span className="promo-glyph">{p.glyph}</span>
            </button>
          ))}
        </div>
        <button type="button" className="promo-cancel" onClick={onCancel}>
          cancel
        </button>
      </div>
    </div>
  )
}
