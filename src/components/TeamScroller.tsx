import type { Team } from '../types'
import './TeamScroller.css'

export default function TeamScroller({ teams, selectedTeamId, onSelect }: { teams: Team[]; selectedTeamId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="team-scroller">
      <button className={`team-chip${selectedTeamId === null ? ' active' : ''}`} onClick={() => onSelect(null)}>
        <div className="avatar"><img alt="All" src="/deka.png" onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} /></div>
        <div className="label">All</div>
      </button>
      {teams.map(t => (
        <button key={t.id} className={`team-chip${selectedTeamId === t.id ? ' active' : ''}`} onClick={() => onSelect(t.id)}>
          <div className="avatar"><img alt={t.name} loading="lazy" src={`/logos/${t.id}.png`} onError={e => { (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${t.id}` }} /></div>
          <div className="label">{t.name}</div>
        </button>
      ))}
    </div>
  )
}


