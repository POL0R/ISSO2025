import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMatches, fetchTeams } from '../api';
import type { Match, Team } from '../types';
import { useAuth } from '../context/AuthContext';
import MatchModal from './MatchModal'
import './ScoreCard.css'

export default function MatchList({ sport, teamFilter = '', dateFilter = '', selectedTeamId = null }: { sport: string; teamFilter?: string; dateFilter?: string; selectedTeamId?: string | null }) {
  const { data: teams } = useQuery({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport) });
  const { data: matches } = useQuery({ queryKey: ['matches', sport], queryFn: () => fetchMatches(sport) });
  const [openId, setOpenId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const teamById = useMemo(() => {
    const map = new Map<string, Team>();
    (teams ?? []).forEach(t => map.set(t.id, t));
    return map;
  }, [teams]);

  useAuth();

  // finalize action handled in modal admin tab

  const filtered = (matches ?? []).filter((m: Match) => {
    const home = teamById.get(m.home_team_id)?.name ?? ''
    const away = teamById.get(m.away_team_id)?.name ?? ''
    const tf = teamFilter.trim().toLowerCase()
    const byTeam = tf ? (home.toLowerCase().includes(tf) || away.toLowerCase().includes(tf)) : true
    const df = dateFilter.trim()
    const byDate = df ? (new Date(m.starts_at).toISOString().slice(0,10) === df) : true
    const bySelectedTeam = selectedTeamId ? (m.home_team_id === selectedTeamId || m.away_team_id === selectedTeamId) : true
    return byTeam && byDate && bySelectedTeam
  })

  // Pagination (5 per page)
  const pageSize = 5
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const visible = filtered.slice(startIdx, startIdx + pageSize)

  // Reset to first page on filter/sport change
  useEffect(() => { setPage(1) }, [sport, teamFilter, dateFilter, selectedTeamId])

  return (
    <div>
      {visible.map((m: Match) => {
        const home = teamById.get(m.home_team_id)?.name ?? 'Home';
        const away = teamById.get(m.away_team_id)?.name ?? 'Away';
        return (
          <div key={m.id}>
            <div
              className={`scorecard ${(() => { const note = (m as any).status_note as string | undefined; const s = (note ? note.split('|')[0] : m.status || '').toLowerCase(); if (s.includes('start') || s.includes('live') || s.includes('first') || s.includes('second')) return 'scorecard--live'; if (s.includes('end') || s.includes('final')) return 'scorecard--ended'; return 'scorecard--upcoming'; })()}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenId(m.id)}
            >
            <div className="scorecard-header">
              <div className="scorecard-league">{(m as any).stage || 'Group Stage'}</div>
              <div className="scorecard-badge">{(() => {
                const note = (m as any).status_note as string | undefined
                const status = note ? (note.split('|')[0]?.trim() || m.status) : m.status
                return status
              })()}</div>
            </div>
              <div className="scorecard-body">
              <div className="team"><div className="logo"><img alt={home} loading="lazy" src={`/logos/${m.home_team_id}.png`} onError={e => { (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${m.home_team_id}` }} /></div><span className="team-name">{home}</span></div>
                <div className="score">{m.home_score} - {m.away_score}</div>
              <div className="team" style={{ justifyItems: 'center' }}><div className="logo"><img alt={away} loading="lazy" src={`/logos/${m.away_team_id}.png`} onError={e => { (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${m.away_team_id}` }} /></div><span className="team-name">{away}</span></div>
              </div>
            <div className="scorecard-footer">
              <div></div>
              <div className="venue"><span className="dot"></span>{(m as any).venue || 'Field'}</div>
              <div></div>
            </div>
            {/* Inline score editing removed; goals drive scores */}
            {/* Finalize hidden here; available in Admin panel within modal */}
            </div>
            {openId === m.id && <MatchModal id={m.id} onClose={() => setOpenId(null)} />}
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
        <div style={{ opacity: 0.9 }}>Page {safePage} of {totalPages}</div>
        <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Next</button>
      </div>
    </div>
  );
}


