import { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../lib/api'
import { resultShort } from '../lib/game'
import type { LeaderboardRow } from '../types'

type Tab = number | 'all'

const TABS: Tab[] = ['all', 1, 2, 3, 4, 5, 6, 7, 8]

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('all')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fetchLeaderboard(tab === 'all' ? null : tab)
      .then((r) => {
        if (!alive) return
        setRows(r)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'failed to load leaderboard')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [tab])

  return (
    <section className="panel">
      <h2>Leaderboard</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={String(t)}
            type="button"
            className={`tab ${tab === t ? 'tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : rows.length === 0 ? (
        <p className="muted">No runs yet — be the first!</p>
      ) : (
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Level</th>
              <th>Moves</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="lb-rank">{i + 1}</td>
                <td className="lb-name">{r.name}</td>
                <td>{tab === 'all' ? r.difficulty : ''}</td>
                <td className="lb-score">{r.score}</td>
                <td className={`lb-result res-${r.result}`}>{resultShort(r.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
