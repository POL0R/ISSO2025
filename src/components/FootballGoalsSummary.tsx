import { useQuery } from '@tanstack/react-query'
import { fetchGoals } from '../api'

export default function FootballGoalsSummary({ matchId, teamIds, teamNames }: { matchId: string; teamIds: { home: string; away: string }; teamNames: { home: string; away: string } }) {
  const { data: goals } = useQuery({ queryKey: ['goals', matchId], queryFn: () => fetchGoals(matchId) })

  const home = (goals ?? []).filter(g => g.team_id === teamIds.home)
  const away = (goals ?? []).filter(g => g.team_id === teamIds.away)

  const formatEntry = (name: string, minute: number, ownGoal?: boolean) => {
    const min = Number.isFinite(minute) ? `${minute}'` : ''
    return `${name} ${min}${ownGoal ? ' (OG)' : ''}`.trim()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center'
      }}>
        <div style={{ fontWeight: 700 }}>{teamNames.home}</div>
        <div style={{ opacity: 0.7, fontWeight: 700 }}>vs</div>
        <div style={{ fontWeight: 700 }}>{teamNames.away}</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'start',
        gap: 12,
        fontSize: 14
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {home.length === 0 && <div style={{ opacity: 0.7 }}>—</div>}
          {home.map((g, i) => (
            <div key={g.id || i} style={{ opacity: 0.95 }}>{formatEntry(g.player_name, g.minute, g.own_goal)}</div>
          ))}
        </div>
        <div style={{ opacity: 0.5 }}>⚽</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {away.length === 0 && <div style={{ opacity: 0.7 }}>—</div>}
          {away.map((g, i) => (
            <div key={g.id || i} style={{ opacity: 0.95 }}>{formatEntry(g.player_name, g.minute, g.own_goal)}</div>
          ))}
        </div>
      </div>
    </div>
  )
}


