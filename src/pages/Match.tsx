import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMatchById, fetchTeamsBySportId, finalizeMatch, updateMatchStatus, setBasketballScore, fetchSportById } from '../api'
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
  const { data: sport } = useQuery({
    queryKey: ['sport', match?.sport_id],
    queryFn: () => fetchSportById(match?.sport_id || ''),
    enabled: !!match?.sport_id
  })

  

  // status note removed

  if (isLoading) return <div className="pageLight" style={{ marginTop: '12svh' }}>Loading…</div>
  if (!match) return <div className="pageLight" style={{ marginTop: '12svh' }}>Not found</div>

  const homeName = teams?.find(t => t.id === match.home_team_id)?.name ?? 'Home'
  const awayName = teams?.find(t => t.id === match.away_team_id)?.name ?? 'Away'

  const allowEdit = role === 'admin'
  const isBasketball = ((sport?.slug || sport?.name || '') as string).toLowerCase().includes('basketball')

  return (
    <div className="pageLight" style={{ marginTop: '12svh' }}>
      <h2>Match Details</h2>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(match.starts_at).toLocaleString()} • {match.status}</div>
      <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>{homeName} {match.home_score} - {match.away_score} {awayName}</div>

      {!isBasketball && (
        <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>Scores are updated via goals only.</div>
      )}

      {isBasketball ? (
        <>
          {allowEdit && (
            <form
              onSubmit={async e => {
                e.preventDefault()
                const form = e.currentTarget as HTMLFormElement
                const homeScore = Number((form.elements.namedItem('home') as HTMLInputElement).value)
                const awayScore = Number((form.elements.namedItem('away') as HTMLInputElement).value)
                await setBasketballScore(match.id, homeScore, awayScore)
                qc.invalidateQueries({ queryKey: ['match', id] })
                alert('Score updated successfully!')
              }}
              style={{ display: 'grid', gap: 12, marginTop: 16 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>{homeName}</label>
                  <input 
                    name="home" 
                    defaultValue={match.home_score} 
                    type="number" 
                    min={0} 
                    className="input" 
                    style={{ width: 80, textAlign: 'center' }} 
                  />
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>:</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>{awayName}</label>
                  <input 
                    name="away" 
                    defaultValue={match.away_score} 
                    type="number" 
                    min={0} 
                    className="input" 
                    style={{ width: 80, textAlign: 'center' }} 
                  />
                </div>
              </div>
              <button className="btn" type="submit" style={{ marginTop: 8 }}>
                Update Score
              </button>
            </form>
          )}
        </>
      ) : (
        <Goals matchId={id} teamIds={{ home: match.home_team_id, away: match.away_team_id }} teamNames={{ home: homeName, away: awayName }} />
      )}

      {/* status note input removed */}

      {allowEdit && (
        isBasketball ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => updateMatchStatus(match.id, 'Upcoming').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Upcoming'); })}>Upcoming</button>
            <button className="btn" onClick={() => updateMatchStatus(match.id, 'Started').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Started'); })}>Start Match</button>
            <button className="btn" onClick={() => updateMatchStatus(match.id, 'Ended').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Ended'); })}>End Match</button>
            <button className="btn" onClick={() => finalizeMatch(match.id).then(() => qc.invalidateQueries({ queryKey: ['match', id] }))}>Finished</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => updateMatchStatus(match.id, 'First Half').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to First Half'); location.reload() })}>Start 1st Half</button>
            <button className="btn" onClick={() => updateMatchStatus(match.id, 'Halftime').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Halftime'); location.reload() })}>Halftime</button>
            <button className="btn" onClick={() => updateMatchStatus(match.id, 'Second Half').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Second Half'); location.reload() })}>Start 2nd Half</button>
            <button className="btn" onClick={() => finalizeMatch(match.id).then(() => qc.invalidateQueries({ queryKey: ['match', id] }))}>Finished</button>
          </div>
        )
      )}
    </div>
  )
}


