import { FootballDataProvider } from './providers/FootballDataProvider';

export interface ApiStatItem {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: string | number | null;
  }>;
}

export interface StatsResponse {
  success: boolean;
  response: ApiStatItem[];
}

export async function fetchMatchStats(fixtureId: string): Promise<StatsResponse> {
  const result = await FootballDataProvider.fetchMatchStats(fixtureId);
  return result as StatsResponse;
}
