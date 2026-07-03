import { FootballDataProvider } from './providers/FootballDataProvider';
import { Player } from '../types';

export interface LineupResponse {
  success: boolean;
  home: {
    formation: string;
    players: Player[];
  };
  away: {
    formation: string;
    players: Player[];
  };
}

export async function fetchMatchLineups(fixtureId: string): Promise<LineupResponse> {
  const result = await FootballDataProvider.fetchMatchLineups(fixtureId);
  return result as LineupResponse;
}
