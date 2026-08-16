import type { Level } from './levels'

interface PendingBestMove {
  resolve: (move: string | null) => void
  reject: (err: Error) => void
}

class StockfishEngine {
  private worker: Worker
  private ready = false
  private readyWaiters: Array<() => void> = []
  private pendingBestMove: PendingBestMove | null = null
  private failed = false

  constructor() {
    const url = `${import.meta.env.BASE_URL}engine/stockfish.js`
    this.worker = new Worker(url)
    this.worker.onmessage = (e: MessageEvent) => this.handleLine(String(e.data))
    this.worker.onerror = () => {
      this.failed = true
      const p = this.pendingBestMove
      this.pendingBestMove = null
      p?.reject(new Error('engine worker failed'))
    }
    this.send('uci')
  }

  private send(cmd: string): void {
    if (this.failed) return
    this.worker.postMessage(cmd)
  }

  private handleLine(line: string): void {
    if (line === 'uciok') {
      this.send('isready')
      return
    }
    if (line === 'readyok') {
      this.ready = true
      const waiters = this.readyWaiters
      this.readyWaiters = []
      for (const w of waiters) w()
      return
    }
    if (line.startsWith('bestmove ')) {
      const token = line.split(' ')[1]
      const p = this.pendingBestMove
      this.pendingBestMove = null
      p?.resolve(token && token !== '(none)' ? token : null)
    }
  }

  private waitForReady(): Promise<void> {
    if (this.ready) return Promise.resolve()
    return new Promise((resolve) => this.readyWaiters.push(resolve))
  }

  async bestMove(fen: string, level: Level): Promise<string | null> {
    if (this.failed) throw new Error('engine unavailable')
    await this.waitForReady()
    return new Promise<string | null>((resolve, reject) => {
      this.pendingBestMove = { resolve, reject }
      this.send(`position fen ${fen}`)
      this.send(`go depth ${level.depth}`)
    })
  }

  get isFailed(): boolean {
    return this.failed
  }
}

export const engine = new StockfishEngine()
