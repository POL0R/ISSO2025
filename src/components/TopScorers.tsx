import { useQuery } from '@tanstack/react-query'
import { fetchTopScorers, fetchTeams } from '../api'

export default function TopScorers({ sport }: { sport: string }) {
  const { data: scorers, isLoading } = useQuery({ queryKey: ['topscorers', sport], queryFn: () => fetchTopScorers(sport) })
  const { data: teams } = useQuery({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport) })
  const teamName = (id: string) => teams?.find(t => t.id === id)?.name ?? ''
  return (
    <div style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, padding: 12, color: '#fff' }}>
      <h3 style={{ marginTop: 0, color: '#fff' }}>Top Scorers</h3>
      {isLoading && <div>Loading…</div>}
      <div style={{ display: 'grid', gap: 6 }}>
        {(scorers ?? []).map((s, i) => (
          <div key={s.team_id + s.player_name} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
            <div>{i + 1}. {s.player_name} <span style={{ opacity: 0.6 }}>({teamName(s.team_id)})</span></div>
            <div style={{ fontWeight: 700, color: '#fff' }}>{s.goals}</div>
          </div>
        ))}
        {!isLoading && (scorers ?? []).length === 0 && <div>No goals yet</div>}
      </div>
    </div>
  )
}


