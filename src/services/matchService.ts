import { FootballDataProvider, FootballDataMatchesResponse } from './providers/FootballDataProvider';

export interface MatchesResponse {
  source: string;
  matches: any[];
  error?: string;
  message?: string;
  diagnostic?: any;
}

export async function fetchLiveMatches(date?: string): Promise<MatchesResponse> {
  return FootballDataProvider.fetchTodayMatches(date);
}

export async function fetchMatchDetails(matchId: string): Promise<{ success: boolean; match: any; message?: string }> {
  return FootballDataProvider.fetchMatchDetails(matchId);
}
