import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMatchById, fetchTeamsBySportId, updateMatchStatus, fetchSportById } from '../api'
import Goals from './Goals'
import { useAuth } from '../context/AuthContext'
import './MatchModal.css'

export default function MatchModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { role } = useAuth()
  const qc = useQueryClient()
  const { data: match } = useQuery({ queryKey: ['match', id], queryFn: () => fetchMatchById(id), enabled: !!id })
  
  // Get the sport slug from the match data
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
  
  const homeName = teams?.find(t => t.id === match?.home_team_id)?.name ?? 'Home'
  const awayName = teams?.find(t => t.id === match?.away_team_id)?.name ?? 'Away'

  const [tab, setTab] = useState<'info' | 'admin'>('info')

  const isBasketball = ((sport?.slug || sport?.name || '') as string).toLowerCase().includes('basketball')

  // mutations handled inline in form/button
  // status note removed

  if (!match) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(match.starts_at).toLocaleString()} • {match.status_note || match.status}</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{homeName} {match.home_score} - {match.away_score} {awayName}</div>
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Match Info</button>
          {role === 'admin' && (
            <button className={`modal-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>Admin</button>
          )}
        </div>
        <div className="modal-body">
          {tab === 'info' && (
            <div className="section">
              <div className="sectionTitle">Match Details</div>
              <div className="divider"></div>
              <dl className="kv">
                <dt>{isBasketball ? 'Tip-off' : 'Kickoff'}</dt>
                <dd>{new Date(match.starts_at).toLocaleString()}</dd>
                <dt>Venue</dt>
                <dd>{match.venue || 'TBD'}</dd>
                <dt>Status</dt>
                <dd>{match.status_note || match.status}</dd>
              </dl>
              <div className="divider"></div>
              {isBasketball ? (
                <>
                  <div className="sectionTitle">Score</div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '20px', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    margin: '20px 0'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>{homeName}</div>
                      <div>{match.home_score}</div>
                    </div>
                    <div style={{ fontSize: '18px', opacity: 0.7 }}>:</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>{awayName}</div>
                      <div>{match.away_score}</div>
                    </div>
                  </div>
                  {role === 'admin' && (
                    <>
                      <div className="divider"></div>
                      <div className="sectionTitle">Update Score</div>
                      <form
                        onSubmit={e => {
                          e.preventDefault()
                          const form = e.currentTarget as HTMLFormElement
                          const homeScore = Number((form.elements.namedItem('home') as HTMLInputElement).value)
                          const awayScore = Number((form.elements.namedItem('away') as HTMLInputElement).value)
                          
                          ;(async () => { 
                            await (await import('../api')).setBasketballScore(match.id, homeScore, awayScore)
                            qc.invalidateQueries({ queryKey: ['match', id] })
                            alert('Score updated successfully!')
                          })()
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
                      <div className="divider" style={{ marginTop: 16 }}></div>
                      <div className="sectionTitle">Highest Scorer (adds +1 point)</div>
                      <form
                        onSubmit={e => {
                          e.preventDefault()
                          const form = e.currentTarget as HTMLFormElement
                          const player = (form.elements.namedItem('player') as HTMLInputElement).value.trim()
                          const team = (form.elements.namedItem('team') as HTMLSelectElement).value
                          if (!player) { alert('Enter player name'); return }
                          ;(async () => {
                            const { addBasketballHighestScorer } = await import('../api')
                            await addBasketballHighestScorer({ matchId: match.id, teamId: team, playerName: player })
                            // Invalidate relevant caches
                            qc.invalidateQueries({ queryKey: ['topscorers'] })
                            alert('Highest scorer saved (+1)')
                            form.reset()
                          })()
                        }}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}
                      >
                        <input name="player" placeholder="Player name" className="input" />
                        <select name="team" className="input">
                          <option value={match.home_team_id}>{homeName}</option>
                          <option value={match.away_team_id}>{awayName}</option>
                        </select>
                        <button type="submit" className="btn">Save</button>
                      </form>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="sectionTitle">Goals</div>
                  <Goals matchId={id} teamIds={{ home: match.home_team_id, away: match.away_team_id }} teamNames={{ home: homeName, away: awayName }} />
                </>
              )}
            </div>
          )}
          {tab === 'admin' && role === 'admin' && (
            <>
              {isBasketball ? (
                <div className="section">
                  <div className="sectionTitle">Basketball Match Controls</div>
                  <div className="divider"></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => updateMatchStatus(match.id, 'Upcoming').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Upcoming'); })}>Upcoming</button>
                    <button className="btn" onClick={() => updateMatchStatus(match.id, 'Started').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Started'); })}>Start Match</button>
                    <button className="btn" onClick={() => updateMatchStatus(match.id, 'Ended').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Ended'); })}>End Match</button>
                    <button className="btn" onClick={async () => { const { finalizeMatch } = await import('../api'); await finalizeMatch(match.id); qc.invalidateQueries({ queryKey: ['match', id] }); alert('Match marked Final'); }}>Mark Final</button>
                  </div>
                  <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: '14px', opacity: 0.8 }}>
                    💡 <strong>Tip:</strong> Use the "Match Info" tab to update scores and add the highest scorer.
                  </div>
                </div>
              ) : (
                <div className="section">
                  <div className="sectionTitle">Football Controls</div>
                  <div className="divider"></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={() => updateMatchStatus(match.id, 'First Half').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to First Half'); location.reload() })}>Start 1st Half</button>
                  <button className="btn" onClick={() => updateMatchStatus(match.id, 'Halftime').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Halftime'); location.reload() })}>Halftime</button>
                  <button className="btn" onClick={() => updateMatchStatus(match.id, 'Second Half').then(() => { qc.invalidateQueries({ queryKey: ['match', id] }); alert('Status set to Second Half'); location.reload() })}>Start 2nd Half</button>
                  <button className="btn" onClick={async () => { const { finalizeMatch } = await import('../api'); await finalizeMatch(match.id); alert('Match marked Final'); location.reload() }}>Finish</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


