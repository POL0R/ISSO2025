import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMatchById, fetchTeams, updateMatchStatus } from '../api'
import Goals from './Goals'
import { useAuth } from '../context/AuthContext'
import './MatchModal.css'

export default function MatchModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { role } = useAuth()
  const qc = useQueryClient()
  const { data: match } = useQuery({ queryKey: ['match', id], queryFn: () => fetchMatchById(id), enabled: !!id })
  const sportSlugGuess = 'football-u19'
  const { data: teams } = useQuery({ queryKey: ['teams', sportSlugGuess], queryFn: () => fetchTeams(sportSlugGuess), enabled: !!sportSlugGuess })
  const homeName = teams?.find(t => t.id === match?.home_team_id)?.name ?? 'Home'
  const awayName = teams?.find(t => t.id === match?.away_team_id)?.name ?? 'Away'

  const [tab, setTab] = useState<'info' | 'admin'>('info')

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
                <dt>Kickoff</dt>
                <dd>{new Date(match.starts_at).toLocaleString()}</dd>
                <dt>Venue</dt>
                <dd>{match.venue || 'TBD'}</dd>
                <dt>Status</dt>
                <dd>{match.status_note || match.status}</dd>
              </dl>
              <div className="divider"></div>
              <div className="sectionTitle">Goals</div>
              <Goals matchId={id} teamIds={{ home: match.home_team_id, away: match.away_team_id }} teamNames={{ home: homeName, away: awayName }} />
            </div>
          )}
          {tab === 'admin' && role === 'admin' && (
            <>
              {String(match.sport_id).includes('basketball') ? (
                <div className="section">
                  <div className="sectionTitle">Basketball Controls</div>
                  <div className="divider"></div>
                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      const form = e.currentTarget as HTMLFormElement
                      const homeScore = Number((form.elements.namedItem('home') as HTMLInputElement).value)
                      const awayScore = Number((form.elements.namedItem('away') as HTMLInputElement).value)
                      const topScorer = (form.elements.namedItem('top') as HTMLInputElement).value
                      // pack top scorer into status_note after a pipe (viewer-safe)
                      updateMatchStatus(match.id, `Started | Top: ${topScorer}`).then(() => qc.invalidateQueries({ queryKey: ['match', id] }))
                      // save score
                      ;(async () => { await (await import('../api')).setBasketballScore(match.id, homeScore, awayScore); alert('Basketball score saved'); location.reload() })()
                    }}
                    style={{ display: 'grid', gap: 8 }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input name="home" defaultValue={match.home_score} type="number" min={0} className="input" style={{ width: 80 }} />
                      <span>:</span>
                      <input name="away" defaultValue={match.away_score} type="number" min={0} className="input" style={{ width: 80 }} />
                    </div>
                    <input name="top" placeholder="Highest scorer (name)" className="input" />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn" type="submit">Save & Mark Started</button>
                      <button className="btn" type="button" onClick={() => updateMatchStatus(match.id, 'Upcoming').then(() => { alert('Status set to Upcoming'); location.reload() })}>Upcoming</button>
                      <button className="btn" type="button" onClick={() => updateMatchStatus(match.id, 'Ended').then(() => { alert('Status set to Ended'); location.reload() })}>End</button>
                    </div>
                  </form>
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


