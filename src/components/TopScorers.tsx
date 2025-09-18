import { useQuery } from '@tanstack/react-query'
import { fetchTopScorers, fetchTeams } from '../api'

export default function TopScorers({ sport }: { sport: string }) {
  const { data: scorers, isLoading } = useQuery({ queryKey: ['topscorers', sport], queryFn: () => fetchTopScorers(sport) })
  const { data: teams } = useQuery({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport) })
  const teamName = (id: string) => teams?.find(t => t.id === id)?.name ?? ''
  return (
    <div style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, padding: 12, color: '#fff' }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, color: '#fff' }}>Top Scorers</h3>
      {isLoading && <div>Loading…</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {/* Top 3 highlighted */}
        {(scorers ?? []).slice(0, 3).map((s, i) => (
          <div
            key={'top-' + s.team_id + s.player_name}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ fontSize: 20 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{s.player_name}</div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>{teamName(s.team_id)}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{s.goals}</div>
          </div>
        ))}

        {/* Others normal list */}
        {(scorers ?? []).slice(3).map((s, idx) => (
          <div key={'rest-' + s.team_id + s.player_name} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
            <div>{idx + 4}. {s.player_name} <span style={{ opacity: 0.6 }}>({teamName(s.team_id)})</span></div>
            <div style={{ fontWeight: 700, color: '#fff' }}>{s.goals}</div>
          </div>
        ))}
        {!isLoading && (scorers ?? []).length === 0 && <div>No goals yet</div>}
      </div>
    </div>
  )
}


