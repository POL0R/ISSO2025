export type Role = 'viewer' | 'admin';

export interface Sport {
  id: string;
  slug: string; // e.g., 'football-u19'
  name: string; // e.g., 'Football U19'
}

export interface Team {
  id: string;
  sport_id: string;
  name: string;
}

export type MatchStatus = string;

export interface Match {
  id: string;
  sport_id: string;
  home_team_id: string;
  away_team_id: string;
  starts_at: string; // ISO string
  status: MatchStatus;
  home_score: number;
  away_score: number;
  status_note?: string | null;
  venue?: string;
  stage?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
}

export interface AccessRequest {
  id: string;
  team_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}


