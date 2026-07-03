import { fetchMatchStats } from './statsService';
import { fetchMatchLineups } from './lineupService';

/**
 * Service orchestrating the retrieval of all available data for a single fixture.
 */
export async function getFullFixtureDetails(fixtureId: string) {
  try {
    const [statsRes, lineupsRes] = await Promise.all([
      fetchMatchStats(fixtureId).catch((e) => {
        console.warn("Failed stats retrieval in parallel:", e.message);
        return null;
      }),
      fetchMatchLineups(fixtureId).catch((e) => {
        console.warn("Failed setups retrieval in parallel:", e.message);
        return null;
      })
    ]);

    return {
      stats: statsRes?.success ? statsRes.response : null,
      lineups: lineupsRes?.success ? lineupsRes : null
    };
  } catch (err) {
    console.error(`Error loading details for fixture ${fixtureId}`, err);
    return { stats: null, lineups: null };
  }
}
