import { supabase } from './lib/supabase';
import type { Match, MatchStatus, Sport, Team, AccessRequest } from './types';

export async function fetchSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from('sports').select('*').order('name');
  if (error) throw error;
  return data as unknown as Sport[];
}

export async function fetchTeams(sportSlug: string): Promise<Team[]> {
  const { data: sport } = await supabase.from('sports').select('id').eq('slug', sportSlug).maybeSingle();
  const sportId = sport?.id as string | undefined;
  console.log(`fetchTeams - sportSlug: ${sportSlug}, sportId: ${sportId}`);
  if (!sportId) return [];
  const { data, error } = await supabase.from('teams').select('*').eq('sport_id', sportId).order('name');
  if (error) throw error;
  console.log(`fetchTeams - found ${data?.length || 0} teams for sport ${sportId}`);
  return data as unknown as Team[];
}

export async function fetchMatches(sportSlug: string): Promise<Match[]> {
  const { data: sport } = await supabase.from('sports').select('id').eq('slug', sportSlug).maybeSingle();
  const sportId = sport?.id as string | undefined;
  console.log(`fetchMatches - sportSlug: ${sportSlug}, sportId: ${sportId}`);
  if (!sportId) return [];
  const ordered = await supabase
    .from('matches')
    .select('*')
    .eq('sport_id', sportId)
    .order('starts_at', { ascending: true });
  if (ordered.error) throw ordered.error;
  console.log(`fetchMatches - found ${ordered.data?.length || 0} matches for sport ${sportId}`);
  return ordered.data as unknown as Match[];
}

export async function fetchMatchById(id: string): Promise<Match | null> {
  const { data, error } = await supabase.from('matches').select('*').eq('id', id).single();
  if (error) return null;
  return data as unknown as Match;
}

export async function fetchSportById(id: string): Promise<Sport | null> {
  const { data, error } = await supabase.from('sports').select('*').eq('id', id).single();
  if (error) return null;
  return data as unknown as Sport;
}

export async function fetchGoals(matchId: string) {
  const { data, error } = await supabase
    .from('football_goals')
    .select('*')
    .eq('match_id', matchId)
    .order('minute', { ascending: true });
  if (error) throw error;
  return data as Array<{ id: string; match_id: string; team_id: string; player_name: string; minute: number; own_goal: boolean }>; 
}

export async function fetchTopScorers(sportSlug: string) {
  const { data: sport } = await supabase.from('sports').select('id').eq('slug', sportSlug).single();
  const sportId = sport?.id as string;
  const { data: matchesData } = await supabase.from('matches').select('id').eq('sport_id', sportId);
  const matchIds = (matchesData ?? []).map(m => m.id);
  if (matchIds.length === 0) return [] as Array<{ player_name: string; goals: number; team_id: string }>;
  const { data, error } = await supabase
    .from('football_goals')
    .select('player_name, team_id, own_goal')
    .in('match_id', matchIds)
    .eq('own_goal', false);
  if (error) throw error;
  const counter = new Map<string, { player_name: string; team_id: string; goals: number }>();
  for (const g of data as any[]) {
    const key = g.team_id + '|' + g.player_name;
    const prev = counter.get(key) || { player_name: g.player_name, team_id: g.team_id, goals: 0 };
    prev.goals += 1;
    counter.set(key, prev);
  }
  return Array.from(counter.values()).sort((a, b) => b.goals - a.goals).slice(0, 20);
}

export async function updateMatchNote(matchId: string, note: string) {
  const { error } = await supabase.from('matches').update({ status_note: note }).eq('id', matchId);
  if (error) throw error;
}

export async function setBasketballScore(matchId: string, home: number, away: number) {
  const { error } = await supabase.from('matches').update({ home_score: home, away_score: away }).eq('id', matchId);
  if (error) throw error;
}

export async function addFootballGoal(params: { matchId: string; teamId: string; playerName: string; minute: number; ownGoal?: boolean }) {
  // 1) Insert goal row
  const { error: insErr } = await supabase.from('football_goals').insert({
    match_id: params.matchId,
    team_id: params.teamId,
    player_name: params.playerName,
    minute: params.minute,
    own_goal: !!params.ownGoal
  });
  if (insErr) throw insErr;

  // 2) Fetch current match to compute new score
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score')
    .eq('id', params.matchId)
    .single();
  if (matchErr) throw matchErr;

  const isOwnGoal = !!params.ownGoal;
  const isHomeTeamGoal = params.teamId === match.home_team_id;
  let newHome = match.home_score;
  let newAway = match.away_score;

  if (isOwnGoal) {
    // Own goal counts for the opposing team
    if (isHomeTeamGoal) newAway += 1; else newHome += 1;
  } else {
    if (isHomeTeamGoal) newHome += 1; else newAway += 1;
  }

  const { error: updErr } = await supabase
    .from('matches')
    .update({ home_score: newHome, away_score: newAway })
    .eq('id', params.matchId);
  if (updErr) throw updErr;
}

export async function fetchTeamPlayers(teamId: string) {
  const { data, error } = await supabase
    .from('team_players')
    .select('id, team_id, name, jersey_number')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true });
  if (error) throw error;
  return data as Array<{ id: string; team_id: string; name: string; jersey_number: number }>
}

export async function addTeamPlayer(teamId: string, name: string, jerseyNumber: number) {
  const { error } = await supabase
    .from('team_players')
    .insert({ team_id: teamId, name, jersey_number: jerseyNumber });
  if (error) throw error;
}

export async function finalizeMatch(matchId: string) {
  // Try to set both status and note; fall back to just note to avoid enum mismatches
  let { error } = await supabase.from('matches').update({ status: 'final', status_note: 'Final' }).eq('id', matchId);
  if (error) {
    // Try capitalized enum
    const res = await supabase.from('matches').update({ status: 'Final', status_note: 'Final' }).eq('id', matchId);
    if (res.error) {
      const onlyNote = await supabase.from('matches').update({ status_note: 'Final' }).eq('id', matchId);
      if (onlyNote.error) throw onlyNote.error;
    }
  }
}

export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  const { error } = await supabase.from('matches').update({ status_note: status }).eq('id', matchId);
  if (error) throw error;
}

export async function canEditMatch(_matchId: string): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session?.user?.id;
}

export async function fetchPendingAccessRequests(): Promise<AccessRequest[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as unknown as AccessRequest[];
}

export async function approveAccessRequest(id: string) {
  const { error } = await supabase.from('team_members').update({ status: 'approved' }).eq('id', id);
  if (error) throw error;
}

export async function rejectAccessRequest(id: string) {
  const { error } = await supabase.from('team_members').update({ status: 'rejected' }).eq('id', id);
  if (error) throw error;
}

export async function requestTeamAccess(teamId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  const { error } = await supabase.from('team_members').insert({ team_id: teamId, user_id: userId, status: 'pending' });
  if (error) throw error;
}


