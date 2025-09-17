import './BottomSwitcher.css'

type Tab = 'matches' | 'scorers' | 'standings'

export default function BottomSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="bottom-switcher">
      <div className="bottom-pill">
        <button className={tab === 'matches' ? 'active' : ''} onClick={() => onChange('matches')}>Matches</button>
        <button className={tab === 'scorers' ? 'active' : ''} onClick={() => onChange('scorers')}>Top Scorers</button>
        <button className={tab === 'standings' ? 'active' : ''} onClick={() => onChange('standings')}>Standings</button>
      </div>
    </div>
  )
}


