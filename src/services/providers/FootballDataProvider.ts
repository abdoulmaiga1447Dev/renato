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
   * Récupère les statistiques de match réelles. Désactivé.
   */
  async fetchMatchStats(matchId: string): Promise<{ success: boolean; response: any[]; message?: string }> {
    return {
      success: false,
      response: [],
      message: "API Football désactivée"
    };
  },

  /**
   * Récupère les compositions détaillées en direct pour un match précis. Désactivé.
   */
  async fetchMatchLineups(matchId: string): Promise<{ success: boolean; home: any; away: any; message?: string }> {
    return {
      success: false,
      home: { formation: "Non disponible", players: [] },
      away: { formation: "Non disponible", players: [] },
      message: "API Football désactivée"
    };
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
