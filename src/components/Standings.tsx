import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMatches, fetchTeams } from '../api'

export default function Standings({ sport }: { sport: string }) {
  const { data: teams } = useQuery({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport) })
  const { data: matches } = useQuery({ queryKey: ['matches', sport], queryFn: () => fetchMatches(sport) })

  const groups = useMemo(() => {
    // Group by m.stage (fallback "Group A" if absent)
    const byGroup = new Map<string, typeof rows>()
    for (const m of matches ?? []) {
      if (String(m.status).toLowerCase() !== 'final') continue
      const key = ((m as any).stage as string | undefined) || 'Group'
      let rows = byGroup.get(key)
      if (!rows) { rows = new Map(); byGroup.set(key, rows) }
      const ensure = (id: string) => rows!.get(id) || rows!.set(id, { team_id: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }).get(id)!
      const h = ensure(m.home_team_id)
      const a = ensure(m.away_team_id)
      h.played++; a.played++
      h.gf += m.home_score; h.ga += m.away_score; h.gd = h.gf - h.ga
      a.gf += m.away_score; a.ga += m.home_score; a.gd = a.gf - a.ga
      if (m.home_score > m.away_score) { h.won++; h.pts += 3; a.lost++ }
      else if (m.home_score < m.away_score) { a.won++; a.pts += 3; h.lost++ }
      else { h.drawn++; a.drawn++; h.pts++; a.pts++ }
    }
    // Convert to sorted arrays per group
    const out: Array<{ group: string; rows: Array<{ team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }> }> = []
    for (const [group, map] of byGroup.entries()) {
      out.push({ group, rows: Array.from(map.values()).sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf) })
    }
    return out.sort((a, b) => a.group.localeCompare(b.group))
  }, [matches])

  const teamName = (id: string) => teams?.find(t => t.id === id)?.name ?? id

  return (
    <div style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, padding: 12, color: '#fff' }}>
      <h3 style={{ marginTop: 0, color: '#fff' }}>Standings (by group)</h3>
      {(groups ?? []).map(g => (
        <div key={g.group} style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, opacity: 0.9, marginBottom: 6 }}>{g.group}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto auto', gap: 8, fontSize: 14, opacity: 0.9 }}>
            <div>Team</div><div>P</div><div>W</div><div>D</div><div>L</div><div>GD</div><div>Pts</div>
          </div>
          <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
            {g.rows.map(row => (
              <div key={row.team_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto auto', gap: 8, color: '#fff' }}>
                <div>{teamName(row.team_id)}</div>
                <div>{row.played}</div>
                <div>{row.won}</div>
                <div>{row.drawn}</div>
                <div>{row.lost}</div>
                <div>{row.gd}</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{row.pts}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {(groups ?? []).length === 0 && <div>No matches yet</div>}
    </div>
  )
}


