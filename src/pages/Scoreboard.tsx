import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMatches, fetchSports, fetchTeams } from '../api';
import type { Team } from '../types';
import MatchList from '../components/MatchList';
import TopScorers from '../components/TopScorers';
import Standings from '../components/Standings';
import BottomSwitcher from '../components/BottomSwitcher';
import TeamScroller from '../components/TeamScroller';
import Waves from '../components/Waves';

function useQueryParam(name: string, fallback: string) {
  const value = new URLSearchParams(location.search).get(name);
  return value ?? fallback;
}

export default function Scoreboard() {
  const sport = useQueryParam('sport', 'football-u19');
  const [teamFilter] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [tab, setTab] = useState<'matches' | 'scorers' | 'standings'>('matches');
  const dateChips = useMemo(() => {
    const days = [18, 19, 20, 21, 22];
    return days.map(d => ({ iso: `2025-09-${String(d).padStart(2, '0')}`, label: `${d} Sep` }));
  }, []);
  useQuery({ queryKey: ['sports'], queryFn: fetchSports });
  const { data: teams, error: teamsError } = useQuery({ queryKey: ['teams', sport], queryFn: () => fetchTeams(sport), enabled: !!sport });
  const { isLoading, error } = useQuery({ queryKey: ['matches', sport], queryFn: () => fetchMatches(sport), enabled: !!sport });

  useMemo(() => {
    const map = new Map<string, Team>();
    (teams ?? []).forEach(t => map.set(t.id, t));
    return map;
  }, [teams]);

  // auto-select today's date if it matches one of the chips
  (function initDateOnce() {
    if (!dateFilter) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      const match = dateChips.find(dc => dc.iso === iso);
      if (match) setDateFilter(match.iso);
    }
  })();

  const isBasketball = String(sport).toLowerCase().includes('basketball');

  return (
    
    <div className="pageDark" >
      <div style={{ width: '100%', height: '100%', position: 'fixed', zIndex:-1 }}>
      
<Waves
  lineColor="rgba(255, 255, 255, 0.13)"
  backgroundColor="rgba(38, 37, 37, 0.03)"
  waveSpeedX={0.05}
  waveSpeedY={0.01}
  waveAmpX={40}
  waveAmpY={20}
  friction={0.9}
  tension={0.01}
  maxCursorMove={150}
  xGap={12}
  yGap={36}
/>
</div>
      <div className="pageHeader">
        <h2 style={{ marginBottom: 16 }}>Scoreboard</h2>
        <div style={{ display: 'flex', gap: 8, zIndex:10 }}>
          <a className="btn" href="/">Home</a>
          {tab === 'matches' && (
            <button className="btn" onClick={() => { setSelectedTeamId(null); setDateFilter(''); }}>Clear Filters</button>
          )}
        </div>
      </div>
      {/* sport chips hidden */}
      {tab === 'matches' && (
        <>
          <div style={{ marginTop: 8}}>
            <TeamScroller teams={teams ?? []} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} />
          </div>
          <div className="date-chips" style={{ marginTop: 12, zIndex:100  }}>
            <button className={`date-chip${!dateFilter ? ' active' : ''}`} onClick={() => setDateFilter('')}>All Dates</button>
            {dateChips.map(dc => (
              <button key={dc.iso} className={`date-chip${dateFilter === dc.iso ? ' active' : ''}`} onClick={() => setDateFilter(dc.iso)}>
                {dc.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ marginTop: 24 }}>
        {isLoading && <div>Loading…</div>}
        {error && <div style={{ color: '#d00' }}>Failed to load matches</div>}
        {teamsError && <div style={{ color: '#d00' }}>Failed to load teams</div>}
        {!isLoading && (
          <>
            {tab === 'matches' && <MatchList sport={sport} teamFilter={teamFilter} dateFilter={dateFilter} selectedTeamId={selectedTeamId} />}
            {tab === 'scorers' && !isBasketball && <TopScorers sport={sport} />}
            {tab === 'standings' && <Standings sport={sport} />}
          </>
        )}
      </div>
      <BottomSwitcher tab={tab} onChange={setTab} showScorers={!isBasketball} />
    </div>
  );
}


