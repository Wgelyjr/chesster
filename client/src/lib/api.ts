import type { Color, LeaderboardRow, Result, SubmittedRun } from '../types'

const API = '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `request failed (${res.status})`)
  }
  return body
}

export async function fetchLeaderboard(
  difficulty: number | null,
  limit = 10,
): Promise<LeaderboardRow[]> {
  const q = new URLSearchParams()
  if (difficulty !== null) q.set('difficulty', String(difficulty))
  q.set('limit', String(limit))
  const data = await request<{ rows: LeaderboardRow[] }>(`/leaderboard?${q.toString()}`)
  return data.rows
}

export interface SubmitPayload {
  name: string
  difficulty: number
  color: Color
  result: Result
  moves: string[]
}

export async function submitRun(
  payload: SubmitPayload,
): Promise<{ run: SubmittedRun; rank: number }> {
  return request('/runs', { method: 'POST', body: JSON.stringify(payload) })
}

export const NAME_STORAGE_KEY = 'chesster:name'
export function bestKey(difficulty: number): string {
  return `chesster:best:${difficulty}`
}
export function readBest(difficulty: number): number {
  const raw = localStorage.getItem(bestKey(difficulty))
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) ? n : 0
}
export function writeBest(difficulty: number, score: number): void {
  if (score > readBest(difficulty)) {
    localStorage.setItem(bestKey(difficulty), String(score))
  }
}
