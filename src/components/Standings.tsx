import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMatches, fetchTeams } from '../api'
import type { Match, Team } from '../types'

export default function Standings({ sport }: { sport: string }) {
  const { data: teams } = useQuery<Team[]>({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport) })
  const { data: matches } = useQuery<Match[]>({ queryKey: ['matches', sport], queryFn: () => fetchMatches(sport) })

  const groups = useMemo((): Array<{ group: string; rows: Array<{ team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }> }> => {
    const teamToGroup = new Map<string, string>()
    const groupSet = new Set<string>()
    const allTeamIds = new Set<string>()

    for (const team of teams ?? []) {
      allTeamIds.add(team.id)
      const groupName = (team as any).group_name
      if (groupName) {
        teamToGroup.set(team.id, groupName)
        groupSet.add(groupName)
      }
    }

    for (const m of matches ?? []) {
      allTeamIds.add(m.home_team_id)
      allTeamIds.add(m.away_team_id)
    }

    if (groupSet.size === 0) {
      const teamArray = Array.from(allTeamIds)
      const numGroups = Math.min(4, Math.max(1, Math.ceil(teamArray.length / 4)))
      const teamsPerGroup = Math.ceil(teamArray.length / numGroups)
      teamArray.forEach((teamId, index) => {
        const groupIndex = Math.floor(index / teamsPerGroup)
        const groupKey = `Group ${String.fromCharCode(65 + groupIndex)}`
        teamToGroup.set(teamId, groupKey)
        groupSet.add(groupKey)
      })
    }

    const byGroup = new Map<string, Map<string, { team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }>>()
    for (const group of groupSet) byGroup.set(group, new Map())

    for (const teamId of allTeamIds) {
      const groupKey = teamToGroup.get(teamId) || 'Group A'
      const rowsMap = byGroup.get(groupKey)!
      rowsMap.set(teamId, { team_id: teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
    }

    for (const m of matches ?? []) {
      const status = String(m.status || '').toLowerCase()
      const statusNote = String((m as any).status_note || '').toLowerCase()
      if (!status.includes('final') && !statusNote.includes('final')) continue

      const groupHome = teamToGroup.get(m.home_team_id) || 'Group A'
      const groupAway = teamToGroup.get(m.away_team_id) || 'Group A'
      const rowsHome = byGroup.get(groupHome)!
      const rowsAway = byGroup.get(groupAway)!

      let h = rowsHome.get(m.home_team_id)
      if (!h) { h = { team_id: m.home_team_id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; rowsHome.set(m.home_team_id, h) }
      let a = rowsAway.get(m.away_team_id)
      if (!a) { a = { team_id: m.away_team_id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; rowsAway.set(m.away_team_id, a) }

      h.played++; a.played++
      h.gf += m.home_score; h.ga += m.away_score
      a.gf += m.away_score; a.ga += m.home_score
      h.gd = h.gf - h.ga
      a.gd = a.gf - a.ga

      if (m.home_score > m.away_score) { h.won++; h.pts += 3; a.lost++ }
      else if (m.home_score < m.away_score) { a.won++; a.pts += 3; h.lost++ }
      else { h.drawn++; a.drawn++; h.pts++; a.pts++ }
    }

    const out: Array<{ group: string; rows: Array<{ team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }> }> = []
    for (const [group, map] of byGroup.entries()) {
      const arr = Array.from(map.values())
      out.push({
        group,
        rows: arr.sort((x, y) => {
          if (y.pts !== x.pts) return y.pts - x.pts
          if (y.gd !== x.gd) return y.gd - x.gd
          return y.gf - x.gf
        })
      })
    }
    return out.sort((a, b) => a.group.localeCompare(b.group))
  }, [matches, teams])

  const teamById = new Map<string, Team>();
  (teams ?? []).forEach(t => teamById.set(t.id, t));
  const teamName = (id: string) => teamById.get(id)?.name ?? id
  const teamLogo = (id: string) => {
    const t = teamById.get(id)
    const sc = ((t as any)?.short_code as string | undefined) || ''
    if (sc) {
      const mapped = ['IP', 'IH', 'IBLR'].includes(sc) ? 'IP' : sc
      return `/teams/${mapped}.png`
    }
    const safe = (t?.name || id).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `/teams/${safe}.png`
  }

  const getForm = (teamId: string): Array<'W' | 'D' | 'L'> => {
    const finals = (matches ?? []).filter(m => {
      const s = String(m.status || '').toLowerCase()
      const n = String((m as any).status_note || '').toLowerCase()
      return s.includes('final') || n.includes('final')
    }).sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())

    const out: Array<'W' | 'D' | 'L'> = []
    for (const m of finals) {
      if (m.home_team_id !== teamId && m.away_team_id !== teamId) continue
      let r: 'W' | 'D' | 'L'
      if (m.home_score === m.away_score) r = 'D'
      else if ((m.home_team_id === teamId && m.home_score > m.away_score) || (m.away_team_id === teamId && m.away_score > m.home_score)) r = 'W'
      else r = 'L'
      out.push(r)
      if (out.length === 5) break
    }
    return out
  }

  const Badge = ({ text }: { text: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', fontSize: 12 }}>{text}</span>
  )

  // Consistent grid columns for header and rows
  const gridCols = '44px 1fr 48px 48px 48px 48px 56px 56px 56px 64px 92px'

  return (
    <div style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: 16, color: '#fff' }}>
      <h3 style={{ marginTop: 0, color: '#fff', marginBottom: 16, fontSize: '1.2em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge text="Live" /> Group Stage Standings
      </h3>
      {(groups ?? []).map((g, groupIndex) => (
        <div key={g.group} style={{ marginTop: groupIndex > 0 ? 24 : 0 }}>
          <div style={{ fontWeight: 700, opacity: 0.9, marginBottom: 12, fontSize: '1.05em', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
            {g.group}
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
            <div style={{ minWidth: 980 }}>
              <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, fontSize: 13, opacity: 0.9, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>#</div>
                <div style={{ fontWeight: 600, textAlign: 'left' }}>Team</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>P</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>W</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>D</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>L</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>For</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>Against</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>GD</div>
                <div style={{ fontWeight: 800, textAlign: 'center' }}>Points</div>
                <div style={{ fontWeight: 600, textAlign: 'center' }}>Form</div>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {g.rows.map((row, index) => (
                  <div key={row.team_id} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, alignItems: 'center', color: '#fff', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, opacity: 0.9 }}>{index + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img alt={teamName(row.team_id)} loading="lazy" src={teamLogo(row.team_id)} onError={e => { (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${row.team_id}` }} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }} />
                      <span style={{ fontWeight: 600 }}>{teamName(row.team_id)}</span>
                    </div>
                    <div style={{ textAlign: 'center', opacity: 0.85 }}>{row.played}</div>
                    <div style={{ textAlign: 'center', opacity: 0.85 }}>{row.won}</div>
                    <div style={{ textAlign: 'center', opacity: 0.85 }}>{row.drawn}</div>
                    <div style={{ textAlign: 'center', opacity: 0.85 }}>{row.lost}</div>
                    <div style={{ textAlign: 'center', opacity: 0.9 }}>{row.gf}</div>
                    <div style={{ textAlign: 'center', opacity: 0.9 }}>{row.ga}</div>
                    <div style={{ textAlign: 'center', fontWeight: 600, color: row.gd > 0 ? '#22c55e' : row.gd < 0 ? '#ef4444' : 'rgba(255,255,255,0.9)' }}>{row.gd > 0 ? '+' : ''}{row.gd}</div>
                    <div style={{ textAlign: 'center', fontWeight: 800 }}>{row.pts}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const form = getForm(row.team_id)[i]
                        const color = form === 'W' ? '#22c55e' : form === 'D' ? '#eab308' : form === 'L' ? '#ef4444' : 'rgba(255,255,255,0.25)'
                        return <span key={i} style={{ width: 10, height: 10, borderRadius: 999, background: color, display: 'inline-block' }} />
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      {(groups ?? []).length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.7)', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>No Group Stage Data</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Group standings will appear here once matches are completed</div>
        </div>
      )}
    </div>
  )
}


