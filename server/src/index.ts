import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RESULTS, insertRun, rankInDifficulty, topRuns } from './db.js'
import { verifyRun } from './verify.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(here, '../../client/dist')
const PORT = Number(process.env.PORT ?? 3001)

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '100kb' }))

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  bucket.count++
  return bucket.count > RATE_LIMIT
}
setInterval(() => {
  const now = Date.now()
  for (const [ip, b] of buckets) if (now >= b.resetAt) buckets.delete(ip)
}, 60_000).unref()

function clientIp(req: express.Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown'
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'chesster' })
})

app.get('/api/leaderboard', (req, res) => {
  const difficultyRaw = req.query.difficulty
  let difficulty: number | null = null
  if (difficultyRaw !== undefined) {
    const parsed = Number(difficultyRaw)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8) {
      res.status(400).json({ error: 'difficulty must be an integer between 1 and 8' })
      return
    }
    difficulty = parsed
  }
  const limitRaw = req.query.limit !== undefined ? Number(req.query.limit) : 10
  const limit = Number.isInteger(limitRaw) && limitRaw >= 1 && limitRaw <= 50 ? limitRaw : 10
  const rows = topRuns(difficulty, limit)
  res.json({
    difficulty,
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      difficulty: r.difficulty,
      score: r.score,
      result: r.result,
      color: r.color,
      created_at: r.created_at,
    })),
  })
})

app.post('/api/runs', (req, res) => {
  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: 'too many submissions, slow down' })
    return
  }

  const body = req.body as Record<string, unknown>
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name.length < 1 || name.length > 20) {
    res.status(400).json({ error: 'name must be 1-20 characters' })
    return
  }

  const difficulty = body.difficulty
  if (typeof difficulty !== 'number' || !Number.isInteger(difficulty) || difficulty < 1 || difficulty > 8) {
    res.status(400).json({ error: 'difficulty must be an integer between 1 and 8' })
    return
  }

  const color = body.color
  if (color !== 'w' && color !== 'b') {
    res.status(400).json({ error: "color must be 'w' or 'b'" })
    return
  }

  const result = body.result
  if (typeof result !== 'string' || !(RESULTS as readonly string[]).includes(result)) {
    res.status(400).json({ error: 'unknown result type' })
    return
  }

  const moves = body.moves
  const outcome = verifyRun(color, Array.isArray(moves) ? moves : [], result as never)
  if (!outcome.ok) {
    res.status(400).json({ error: outcome.reason })
    return
  }

  const run = insertRun({
    name,
    difficulty,
    score: outcome.score,
    result: outcome.result,
    color,
    moves: JSON.stringify(moves),
  })
  res.status(201).json({
    run: {
      id: run.id,
      name: run.name,
      difficulty: run.difficulty,
      score: run.score,
      result: run.result,
      color: run.color,
      created_at: run.created_at,
    },
    rank: rankInDifficulty(run.difficulty, run.score),
  })
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not found' })
})

if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distDir, 'index.html'))
      return
    }
    next()
  })
}

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid JSON body' })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal server error' })
  next()
})

app.listen(PORT, () => {
  console.log(`chesster API listening on http://localhost:${PORT}`)
})
