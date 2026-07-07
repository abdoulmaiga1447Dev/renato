/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FootballDataMatchesResponse {
  source: string;
  matches: any[];
  error?: string;
  message?: string;
  diagnostic?: {
    fournisseurActif: string;
    cleDetectee: boolean;
    dernierTestApi: string;
    statutHttp: number;
    nombreMatchsRecuperes: number;
    competitionsCount?: number;
  };
}

export const FootballDataProvider = {
  /**
   * Récupère les matchs pour une date donnée (ou aujourd'hui). Désactivé temporairement.
   */
  async fetchTodayMatches(date?: string): Promise<FootballDataMatchesResponse> {
    return {
      source: 'mock',
      matches: [],
      error: "API Football désactivée par configuration",
      message: "L'utilisation de l'API externe est désactivée."
    };
  },

  /**
   * Récupère les statistiques de match réelles depuis l'API (RÉACTIVÉ — stats uniquement).
   */
  async fetchMatchStats(matchId: string): Promise<{ success: boolean; response: any[]; message?: string }> {
    try {
      const res = await fetch(`/api/football/statistics?fixture=${encodeURIComponent(matchId)}`);
      const data = await res.json();
      if (!data.success) {
        return { success: false, response: [], message: data.error || "Échec de récupération des statistiques." };
      }
      return { success: true, response: data.response || [] };
    } catch (err: any) {
      return { success: false, response: [], message: err.message };
    }
  },

  /**
   * Récupère les compositions détaillées en direct pour un match précis (RÉACTIVÉ).
   * Convertit le format API-Football (grid "rangée:colonne") vers nos coordonnées x/y en %.
   */
  async fetchMatchLineups(matchId: string): Promise<{ success: boolean; home: any; away: any; message?: string }> {
    const empty = { formation: "Non disponible", players: [] };
    try {
      const res = await fetch(`/api/football/lineups?fixture=${encodeURIComponent(matchId)}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.response) || data.response.length < 2) {
        return { success: false, home: empty, away: empty, message: data.message || "Compositions non disponibles pour ce match." };
      }

      const mapTeam = (teamData: any) => {
        if (!teamData) return empty;
        const startXI = teamData.startXI || [];
        const rows: Record<number, Array<{ id: any; name: string; number: number; col: number }>> = {};
        startXI.forEach((entry: any) => {
          const p = entry.player;
          if (!p || !p.grid) return;
          const [rowStr, colStr] = String(p.grid).split(':');
          const row = parseInt(rowStr, 10);
          const col = parseInt(colStr, 10);
          if (!rows[row]) rows[row] = [];
          rows[row].push({ id: p.id, name: p.name, number: p.number, col });
        });
        const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);
        const maxRow = rowKeys.length ? Math.max(...rowKeys) : 1;
        const players: any[] = [];
        rowKeys.forEach((row) => {
          const rowPlayers = rows[row].sort((a, b) => a.col - b.col);
          const count = rowPlayers.length;
          rowPlayers.forEach((p, idx) => {
            const x = ((idx + 1) / (count + 1)) * 100;
            // Row 1 (goalkeeper) sits deep near own goal (y=90), last row near the attack (y=10)
            const y = maxRow > 1 ? 90 - ((row - 1) / (maxRow - 1)) * 80 : 50;
            const position = row === 1 ? 'GK' : row === maxRow ? 'ATT' : row <= Math.ceil(maxRow / 2) ? 'DEF' : 'MID';
            players.push({
              id: 'api-' + p.id,
              name: p.name,
              number: p.number || 0,
              position,
              x,
              y
            });
          });
        });
        return {
          formation: teamData.formation || "Non disponible",
          players
        };
      };

      return {
        success: true,
        home: mapTeam(data.response[0]),
        away: mapTeam(data.response[1])
      };
    } catch (err: any) {
      return { success: false, home: empty, away: empty, message: err.message };
    }
  },

  /**
   * Récupère les détails d'un match. Désactivé.
   */
  async fetchMatchDetails(matchId: string): Promise<{ success: boolean; match: any; message?: string }> {
    return {
      success: false,
      match: null,
      message: "API Football désactivée"
    };
  },

  /**
   * Interroge l'état du diagnostic. Désactivé.
   */
  async fetchDiagnostic(): Promise<any> {
    return {
      fournisseurActif: "Désactivé (Manuel uniquement)",
      cleDetectee: false,
      dernierTestApi: "API Désactivée",
      statutHttp: 200,
      nombreMatchsRecuperes: 0
    };
  }
};