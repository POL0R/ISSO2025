import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMatchById, fetchTeams, fetchTeamsBySportId, finalizeMatch, updateMatchStatus } from '../api'
import { useAuth } from '../context/AuthContext'
import Goals from '../components/Goals'

export default function MatchPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const { role } = useAuth()
  const { data: match, isLoading } = useQuery({ queryKey: ['match', id], queryFn: () => fetchMatchById(id), enabled: !!id })

  // Get the sport from the match data
  const { data: teams } = useQuery({ 
    queryKey: ['teams', match?.sport_id], 
    queryFn: () => fetchTeamsBySportId(match?.sport_id || ''), 
    enabled: !!match?.sport_id 
  })

  

  // status note removed

  if (isLoading) return <div className="pageLight" style={{ marginTop: '12svh' }}>Loading…</div>
  if (!match) return <div className="pageLight" style={{ marginTop: '12svh' }}>Not found</div>

  const homeName = teams?.find(t => t.id === match.home_team_id)?.name ?? 'Home'
  const awayName = teams?.find(t => t.id === match.away_team_id)?.name ?? 'Away'

  const allowEdit = role === 'admin'

  return (
    <div className="pageLight" style={{ marginTop: '12svh' }}>
      <h2>Match Details</h2>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(match.starts_at).toLocaleString()} • {match.status}</div>
      <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>{homeName} {match.home_score} - {match.away_score} {awayName}</div>

      <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>Scores are updated via goals only.</div>

      <Goals matchId={id} teamIds={{ home: match.home_team_id, away: match.away_team_id }} teamNames={{ home: homeName, away: awayName }} />

      {/* status note input removed */}

      {allowEdit && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => updateMatchStatus(match.id, 'First Half').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to First Half'); location.reload() })}>Start 1st Half</button>
          <button className="btn" onClick={() => updateMatchStatus(match.id, 'Halftime').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Halftime'); location.reload() })}>Halftime</button>
          <button className="btn" onClick={() => updateMatchStatus(match.id, 'Second Half').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Second Half'); location.reload() })}>Start 2nd Half</button>
          <button className="btn" onClick={() => finalizeMatch(match.id).then(() => qc.invalidateQueries({ queryKey: ['match', id] }))}>Finished</button>
        </div>
      )}
    </div>
  )
}


