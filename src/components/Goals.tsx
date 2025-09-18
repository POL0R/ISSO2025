import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFootballGoal, fetchGoals, fetchTeamPlayers, addTeamPlayer } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Goals({ matchId, teamIds, teamNames, allowAdminEdits }: { matchId: string; teamIds: { home: string; away: string }; teamNames: { home: string; away: string }; allowAdminEdits?: boolean }) {
  const qc = useQueryClient()
  const { role } = useAuth()
  const { data: goals } = useQuery({ queryKey: ['goals', matchId], queryFn: () => fetchGoals(matchId) })
  const { data: homePlayers } = useQuery({ queryKey: ['players', teamIds.home], queryFn: () => fetchTeamPlayers(teamIds.home) })
  const { data: awayPlayers } = useQuery({ queryKey: ['players', teamIds.away], queryFn: () => fetchTeamPlayers(teamIds.away) })

  const canEdit = (allowAdminEdits ?? (role === 'admin')) === true

  const mAdd = useMutation({
    mutationFn: async (payload: { teamId: string; playerName: string; minute: number; ownGoal?: boolean }) => addFootballGoal({ matchId, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', matchId] })
      qc.invalidateQueries({ queryKey: ['match', matchId] })
      alert('Goal added')
    }
  })

  const mAddPlayer = useMutation({
    mutationFn: async (p: { teamId: string; name: string; jerseyNumber: number }) => addTeamPlayer(p.teamId, p.name, p.jerseyNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players', teamIds.home] })
      qc.invalidateQueries({ queryKey: ['players', teamIds.away] })
      alert('Player added')
    }
  })

  return (
    <div style={{ marginTop: 16 }}>
      <h1 style={{fontSize: '20px', marginBottom: '10px'}}>Goals</h1>
      <div style={{ display: 'grid', gap: 0, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, overflow: 'hidden' }}>
        {(goals ?? []).map((g, idx) => (
          <div
            key={g.id}
            style={{
              fontSize: 14,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: idx === (goals?.length || 0) - 1 ? 'none' : '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <div style={{ opacity: 0.85 }}>{g.minute}'</div>
            <div style={{ fontWeight: 600 }}>
              {g.player_name} <span style={{ opacity: 0.7, fontWeight: 400 }}>({g.team_id === teamIds.home ? teamNames.home : g.team_id === teamIds.away ? teamNames.away : 'Unknown'})</span> {g.own_goal ? '(OG)' : ''}
            </div>
          </div>
        ))}
      </div>
      {canEdit && (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <div>
            <h4 style={{ margin: '8px 0' }}>{teamNames.home} - Players</h4>
            <div style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 8 }}>
              {(homePlayers ?? []).map(p => (
                <form
                  key={p.id}
                  onSubmit={e => {
                    e.preventDefault()
                    const minuteRaw = (e.currentTarget.elements.namedItem('minute') as HTMLInputElement).value.trim()
                    if (minuteRaw === '' || Number.isNaN(Number(minuteRaw))) { alert('Please enter minute'); return }
                    const minute = Number(minuteRaw)
                    mAdd.mutate({ playerName: p.name, minute, teamId: teamIds.home, ownGoal: false })
                  }}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <div style={{ minWidth: 180 }}>{p.name} #{p.jersey_number}</div>
                  <input name="minute" type="number" min={0} max={200} placeholder="Min" className="input" style={{ width: 100 }} />
                  <button type="submit" className="btn">Add Goal</button>
                </form>
              ))}
              {(homePlayers ?? []).length === 0 && <div style={{ opacity: 0.7 }}>No players yet</div>}
              {/* Always show inline add-player for Home team */}
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
                  const jerseyRaw = (e.currentTarget.elements.namedItem('jersey') as HTMLInputElement).value.trim()
                  if (!name) { alert('Enter player name'); return }
                  if (jerseyRaw === '' || Number.isNaN(Number(jerseyRaw))) { alert('Enter jersey number'); return }
                  const jersey = Number(jerseyRaw)
                  const dup = (homePlayers ?? []).some(pl => pl.jersey_number === jersey || pl.name.trim().toLowerCase() === name.toLowerCase())
                  if (dup) { alert('Player with same name or jersey already exists in Home team'); return }
                  mAddPlayer.mutate({ teamId: teamIds.home, name, jerseyNumber: jersey })
                  e.currentTarget.reset()
                }}
                style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}
              >
                <input name="name" placeholder={`Add ${teamNames.home} player`} className="input" />
                <input name="jersey" placeholder="Jersey #" type="number" min={0} className="input" style={{ width: 120 }} />
                <button type="submit" className="btn">Add Player</button>
              </form>
            </div>
          </div>
          <div>
            <h4 style={{ margin: '8px 0' }}>{teamNames.away} - Players</h4>
            <div style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 8 }}>
              {(awayPlayers ?? []).map(p => (
                <form
                  key={p.id}
                  onSubmit={e => {
                    e.preventDefault()
                    const minuteRaw = (e.currentTarget.elements.namedItem('minute') as HTMLInputElement).value.trim()
                    if (minuteRaw === '' || Number.isNaN(Number(minuteRaw))) { alert('Please enter minute'); return }
                    const minute = Number(minuteRaw)
                    mAdd.mutate({ playerName: p.name, minute, teamId: teamIds.away, ownGoal: false })
                  }}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <div style={{ minWidth: 180 }}>{p.name} #{p.jersey_number}</div>
                  <input name="minute" type="number" min={0} max={200} placeholder="Min" className="input" style={{ width: 100 }} />
                  <button type="submit" className="btn">Add Goal</button>
                </form>
              ))}
              {(awayPlayers ?? []).length === 0 && <div style={{ opacity: 0.7 }}>No players yet</div>}
              {/* Always show inline add-player for Away team */}
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
                  const jerseyRaw = (e.currentTarget.elements.namedItem('jersey') as HTMLInputElement).value.trim()
                  if (!name) { alert('Enter player name'); return }
                  if (jerseyRaw === '' || Number.isNaN(Number(jerseyRaw))) { alert('Enter jersey number'); return }
                  const jersey = Number(jerseyRaw)
                  const dup = (awayPlayers ?? []).some(pl => pl.jersey_number === jersey || pl.name.trim().toLowerCase() === name.toLowerCase())
                  if (dup) { alert('Player with same name or jersey already exists in Away team'); return }
                  mAddPlayer.mutate({ teamId: teamIds.away, name, jerseyNumber: jersey })
                  e.currentTarget.reset()
                }}
                style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}
              >
                <input name="name" placeholder={`Add ${teamNames.away} player`} className="input" />
                <input name="jersey" placeholder="Jersey #" type="number" min={0} className="input" style={{ width: 120 }} />
                <button type="submit" className="btn">Add Player</button>
              </form>
            </div>
          </div>

          <details>
            <summary>Add new player</summary>
            <form
              onSubmit={e => {
                e.preventDefault()
                const form = e.currentTarget as HTMLFormElement
                const team = (form.elements.namedItem('team') as HTMLSelectElement).value
                const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
                const jerseyRaw = (form.elements.namedItem('jersey') as HTMLInputElement).value.trim()
                if (!name) { alert('Enter player name'); return }
                if (jerseyRaw === '' || Number.isNaN(Number(jerseyRaw))) { alert('Enter jersey number'); return }
                const jersey = Number(jerseyRaw)
                const list = team === teamIds.home ? (homePlayers ?? []) : (awayPlayers ?? [])
                const dup = list.some(pl => pl.jersey_number === jersey || pl.name.trim().toLowerCase() === name.toLowerCase())
                if (dup) { alert('Player with same name or jersey already exists in selected team'); return }
                mAddPlayer.mutate({ teamId: team, name, jerseyNumber: jersey })
                form.reset()
              }}
              style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}
            >
              <select name="team" className="input">
                <option value={teamIds.home}>{teamNames.home}</option>
                <option value={teamIds.away}>{teamNames.away}</option>
              </select>
              <input name="name" placeholder="Player name" className="input" />
              <input name="jersey" placeholder="Jersey #" type="number" min={0} className="input" style={{ width: 120 }} />
              <button type="submit" className="btn">Add Player</button>
            </form>
          </details>
        </div>
      )}
    </div>
  )
}


