import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export type Result =
  | 'checkmate'
  | 'win'
  | 'stalemate'
  | 'threefold'
  | 'insufficient'
  | 'fifty_move'
  | 'resignation'

export const RESULTS: readonly Result[] = [
  'checkmate',
  'win',
  'stalemate',
  'threefold',
  'insufficient',
  'fifty_move',
  'resignation',
]

export interface RunRow {
  id: number
  name: string
  difficulty: number
  score: number
  result: Result
  color: 'w' | 'b'
  moves: string
  created_at: string
}

export type NewRun = Omit<RunRow, 'id' | 'created_at'>

const dataDir =
  process.env.CHESSTER_DATA_DIR ?? path.resolve(here, '../../data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'chesster.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
    score INTEGER NOT NULL CHECK (score >= 1),
    result TEXT NOT NULL,
    color TEXT NOT NULL CHECK (color IN ('w', 'b')),
    moves TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_runs_diff_score ON runs (difficulty, score DESC);
`)

const insertStmt = db.prepare(`
  INSERT INTO runs (name, difficulty, score, result, color, moves)
  VALUES (@name, @difficulty, @score, @result, @color, @moves)
`)

export function insertRun(run: NewRun): RunRow {
  const info = insertStmt.run(run)
  const row = getRun(Number(info.lastInsertRowid))
  if (!row) throw new Error('failed to read back inserted run')
  return row
}

export function getRun(id: number): RunRow | undefined {
  return db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as
    | RunRow
    | undefined
}

export function topRuns(difficulty: number | null, limit: number): RunRow[] {
  if (difficulty === null) {
    return db
      .prepare('SELECT * FROM runs ORDER BY score DESC, id ASC LIMIT ?')
      .all(limit) as RunRow[]
  }
  return db
    .prepare('SELECT * FROM runs WHERE difficulty = ? ORDER BY score DESC, id ASC LIMIT ?')
    .all(difficulty, limit) as RunRow[]
}

export function rankInDifficulty(difficulty: number, score: number): number {
  const row = db
    .prepare('SELECT COUNT(*) + 1 AS rank FROM runs WHERE difficulty = ? AND score > ?')
    .get(difficulty, score) as { rank: number }
  return row.rank
}
