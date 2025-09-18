import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMatches, fetchTeams } from '../api'
import type { Match, Team } from '../types'

export default function Standings({ sport }: { sport: string }) {
  const { data: teams } = useQuery<Team[]>({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport) })
  const { data: matches } = useQuery<Match[]>({ queryKey: ['matches', sport], queryFn: () => fetchMatches(sport) })

  const groups = useMemo((): Array<{ group: string; rows: Array<{ team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }> }> => {
    // First, collect all unique groups from matches
    const groupSet = new Set<string>()
    const teamToGroup = new Map<string, string>()
    const allTeamIds = new Set<string>()
    
    // Process all matches to determine groups and teams
    for (const m of matches ?? []) {
      allTeamIds.add(m.home_team_id)
      allTeamIds.add(m.away_team_id)
      
      const groupKey = ((m as any).stage as string | undefined) || 'Group A'
      groupSet.add(groupKey)
      teamToGroup.set(m.home_team_id, groupKey)
      teamToGroup.set(m.away_team_id, groupKey)
    }
    
    // If no groups found in matches, create default groups
    if (groupSet.size === 0) {
      const teamArray = Array.from(allTeamIds)
      const teamsPerGroup = Math.ceil(teamArray.length / 4) // Distribute into 4 groups
      
      teamArray.forEach((teamId, index) => {
        const groupIndex = Math.floor(index / teamsPerGroup)
        const groupKey = `Group ${String.fromCharCode(65 + groupIndex)}` // A, B, C, D
        teamToGroup.set(teamId, groupKey)
        groupSet.add(groupKey)
      })
    }
    
    // Initialize group maps
    const byGroup = new Map<string, Map<string, { team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }>>()
    for (const group of groupSet) {
      byGroup.set(group, new Map())
    }
    
    // Add all teams to their respective groups
    for (const teamId of allTeamIds) {
      const groupKey = teamToGroup.get(teamId) || 'Group A'
      const rowsMap = byGroup.get(groupKey)!
      rowsMap.set(teamId, { team_id: teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
    }
    
    // Process completed matches
    for (const m of matches ?? []) {
      const status = String(m.status).toLowerCase()
      const statusNote = String((m as any).status_note || '').toLowerCase()
      if (!status.includes('final') && !statusNote.includes('final')) continue
      
      const groupKey = teamToGroup.get(m.home_team_id) || 'Group A'
      const rowsMap = byGroup.get(groupKey)!
      
      const h = rowsMap.get(m.home_team_id)!
      const a = rowsMap.get(m.away_team_id)!
      
      // Update match statistics
      h.played++
      a.played++
      h.gf += m.home_score
      h.ga += m.away_score
      a.gf += m.away_score
      a.ga += m.home_score
      
      // Update goal difference
      h.gd = h.gf - h.ga
      a.gd = a.gf - a.ga
      
      // Update points and win/loss/draw records
      if (m.home_score > m.away_score) {
        h.won++
        h.pts += 3
        a.lost++
      } else if (m.home_score < m.away_score) {
        a.won++
        a.pts += 3
        h.lost++
      } else {
        h.drawn++
        a.drawn++
        h.pts++
        a.pts++
      }
    }
    
    // Convert to sorted arrays per group
    const out: Array<{ group: string; rows: Array<{ team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number }> }> = []
    for (const [group, map] of byGroup.entries()) {
      const arr = Array.from(map.values())
      // Sort by points, then goal difference, then goals for
      out.push({ 
        group, 
        rows: arr.sort((x, y) => {
          if (y.pts !== x.pts) return y.pts - x.pts
          if (y.gd !== x.gd) return y.gd - x.gd
          return y.gf - x.gf
        })
      })
    }
    
    // Sort groups alphabetically
    return out.sort((a, b) => a.group.localeCompare(b.group))
  }, [matches])

  const teamName = (id: string) => teams?.find(t => t.id === id)?.name ?? id

  return (
    <div style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, padding: 16, color: '#fff' }}>
      <h3 style={{ marginTop: 0, color: '#fff', marginBottom: 16, fontSize: '1.2em' }}>Group Stage Standings</h3>
      {(groups ?? []).map((g, groupIndex) => (
        <div key={g.group} style={{ marginTop: groupIndex > 0 ? 24 : 0 }}>
          <div style={{ 
            fontWeight: 700, 
            opacity: 0.9, 
            marginBottom: 12, 
            fontSize: '1.1em',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {g.group}
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto auto auto auto auto auto', 
            gap: 12, 
            fontSize: 14, 
            opacity: 0.9,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '6px',
            marginBottom: 8
          }}>
            <div style={{ fontWeight: 600 }}>#</div>
            <div style={{ fontWeight: 600 }}>Team</div>
            <div style={{ fontWeight: 600, textAlign: 'center' }}>P</div>
            <div style={{ fontWeight: 600, textAlign: 'center' }}>W</div>
            <div style={{ fontWeight: 600, textAlign: 'center' }}>D</div>
            <div style={{ fontWeight: 600, textAlign: 'center' }}>L</div>
            <div style={{ fontWeight: 600, textAlign: 'center' }}>GD</div>
            <div style={{ fontWeight: 600, textAlign: 'center' }}>Pts</div>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {g.rows.map((row, index) => (
              <div key={row.team_id} style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr auto auto auto auto auto auto', 
                gap: 12, 
                color: '#fff',
                padding: '8px 12px',
                background: index < 2 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.02)',
                borderRadius: '6px',
                border: index < 2 ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  fontWeight: 600, 
                  color: index < 2 ? '#4CAF50' : 'rgba(255,255,255,0.8)',
                  fontSize: '0.9em'
                }}>
                  {index + 1}
                </div>
                <div style={{ 
                  fontWeight: index < 2 ? 600 : 400,
                  color: index < 2 ? '#4CAF50' : '#fff'
                }}>
                  {teamName(row.team_id)}
                </div>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>{row.played}</div>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>{row.won}</div>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>{row.drawn}</div>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>{row.lost}</div>
                <div style={{ 
                  textAlign: 'center', 
                  fontWeight: 600,
                  color: row.gd > 0 ? '#4CAF50' : row.gd < 0 ? '#f44336' : 'rgba(255,255,255,0.8)'
                }}>
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </div>
                <div style={{ 
                  fontWeight: 700, 
                  color: index < 2 ? '#4CAF50' : '#fff',
                  textAlign: 'center'
                }}>
                  {row.pts}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {(groups ?? []).length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: 'rgba(255, 255, 255, 0.7)',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>No Group Stage Data</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Group standings will appear here once matches are completed</div>
        </div>
      )}
    </div>
  )
}


