/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import fs from 'fs';

// Load environment variables from standard .env file
dotenv.config();

// Clean up FOOTBALL_API_KEY formatting (trim whitespace/quotes) if present
if (process.env.FOOTBALL_API_KEY) {
  process.env.FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY.trim().replace(/^["']|["']$/g, '');
}



// Helper for fetching with a timeout to prevent hanging connections
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Reusable function to fetch directly from API-Football (api-sports.io direct, or via RapidAPI)
async function fetchFromApiFootball(endpoint: string, queryParams: Record<string, string | number> = {}) {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const isPlaceholder = !apiKey || apiKey === 'YOUR_FOOTBALL_API_KEY' || apiKey === 'MY_FOOTBALL_API_KEY';
  if (isPlaceholder) {
    throw new Error("FOOTBALL_API_KEY manquante ou non configurée. Ajoutez une vraie clé dans le fichier .env (pas .env.example).");
  }

  const provider = (process.env.FOOTBALL_API_PROVIDER || 'apifootball').toLowerCase();
  const query = new URLSearchParams(
    Object.entries(queryParams).reduce((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  let url: string;
  let headers: Record<string, string>;

  if (provider === 'rapidapi') {
    url = `https://api-football-v1.p.rapidapi.com/v3/${endpoint}${query ? `?${query}` : ''}`;
    headers = {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    };
  } else {
    url = `https://v3.football.api-sports.io/${endpoint}${query ? `?${query}` : ''}`;
    headers = {
      'x-apisports-key': apiKey
    };
  }

  const response = await fetchWithTimeout(url, { headers }, 10000);
  if (!response.ok) {
    throw new Error(`API-Football a répondu avec le statut ${response.status}`);
  }
  const data = await response.json();
  if (data.errors && Array.isArray(data.errors) ? data.errors.length > 0 : (data.errors && Object.keys(data.errors).length > 0)) {
    throw new Error(`Erreur API-Football: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

// Helper to get beautiful custom colors based on team name
function getTeamColor(teamName: string, isHome: boolean): { color: string, textColor: string } {
  if (!teamName || typeof teamName !== 'string') {
    return {
      color: isHome ? "#EF4444" : "#2563EB",
      textColor: "#FFFFFF"
    };
  }
  const norm = teamName.toLowerCase();
  if (norm.includes('chelsea') || norm.includes('france') || norm.includes('italie') || norm.includes('italy')) {
    return { color: "#2563EB", textColor: "#FFFFFF" }; // Blue
  }
  if (norm.includes('real madrid')) {
    return { color: "#F8FAFC", textColor: "#0F172A" }; // Slate/White
  }
  if (norm.includes('barcelona') || norm.includes('barcelone')) {
    return { color: "#A21CAF", textColor: "#FEF08A" }; // Blaugrana / Yellow
  }
  if (norm.includes('liverpool') || norm.includes('arsenal') || norm.includes('espagne') || norm.includes('spain') || norm.includes('portugal') || norm.includes('belgique') || norm.includes('belgium')) {
    return { color: "#DC2626", textColor: "#FFFFFF" }; // Red
  }
  if (norm.includes('manchester city') || norm.includes('man. city') || norm.includes('mancity')) {
    return { color: "#38BDF8", textColor: "#0F172A" }; // Sky Blue
  }
  if (norm.includes('dortmund') || norm.includes('brésil') || norm.includes('brazil') || norm.includes('colombie') || norm.includes('colombia')) {
    return { color: "#EAB308", textColor: "#0F172A" }; // Yellow
  }
  if (norm.includes('celtics') || norm.includes('vert') || norm.includes('green') || norm.includes('grorud') || norm.includes('mexique') || norm.includes('mexico')) {
    return { color: "#15803D", textColor: "#FFFFFF" }; // Green
  }
  // Default fallbacks
  return {
    color: isHome ? "#EF4444" : "#2563EB",
    textColor: "#FFFFFF"
  };
}

// Maps API-Football raw matches response format into our frontend schema
function mapApiSportsFixtures(fixtures: any[]): any[] {
  if (!fixtures || !Array.isArray(fixtures)) return [];
  return fixtures.map((f: any) => {
    const fixtureId = String(f.fixture?.id || Math.random());
    const compName = f.league?.name || "Compétition";
    
    const homeTeam = f.teams?.home || {};
    const awayTeam = f.teams?.away || {};
    
    const homeScore = f.goals?.home ?? 0;
    const awayScore = f.goals?.away ?? 0;
    
    const elapsed = f.fixture?.status?.elapsed ?? 0;
    const shortStatus = f.fixture?.status?.short;
    
    // Status mapping
    let statusStr = 'UPCOMING';
    if (['1H', '2H', 'ET', 'P', 'BT'].includes(shortStatus)) {
      statusStr = 'IN_PLAY';
    } else if (shortStatus === 'HT') {
      statusStr = 'HALF_TIME';
    } else if (['FT', 'AET', 'PEN'].includes(shortStatus)) {
      statusStr = 'FINISHED';
    } else if (shortStatus === 'PST') {
      statusStr = 'POSTPONED';
    } else if (shortStatus === 'CAN') {
      statusStr = 'CANCELLED';
    } else if (shortStatus === 'SUSP') {
      statusStr = 'PAUSED';
    }

    const homeColors = getTeamColor(homeTeam.name || '', true);
    const awayColors = getTeamColor(awayTeam.name || '', false);

    // Mapped events
    const rawEvents = f.events || [];
    const mappedEvents = rawEvents.map((evt: any) => {
      let type = 'foul';
      const rawType = String(evt.type || 'foul').toLowerCase();
      const detail = String(evt.detail || '').toLowerCase();

      if (rawType.includes('goal')) {
        if (detail.includes('missed') || detail.includes('miss') || detail.includes('raté')) {
          type = 'missed_penalty';
        } else {
          type = 'goal';
        }
      } else if (rawType.includes('card')) {
        if (detail.includes('red')) {
          type = 'red_card';
        } else {
          type = 'yellow_card';
        }
      } else if (rawType.includes('subst') || rawType.includes('sub')) {
        type = 'substitution';
      } else if (rawType.includes('foul')) {
        type = 'foul';
      }

      const minute = evt.time?.elapsed ?? 0;
      const player = evt.player?.name || 'Joueur';
      const teamLabel = evt.team?.id === homeTeam.id ? 'home' : 'away';
      const detailStr = evt.detail ? ` (${evt.detail})` : '';
      
      let description = '';
      if (type === 'goal') {
        description = `⚽ BUT ! par ${player}${detailStr} - ${minute}'`;
      } else if (type === 'missed_penalty') {
        description = `❌ Penalty manqué par ${player} ${detailStr} - ${minute}'`;
      } else {
        description = `Action par ${player}${detailStr} - ${minute}'`;
      }

      return {
        id: `evt-${Math.random()}`,
        type,
        minute,
        second: 0,
        team: teamLabel,
        player,
        description
      };
    });

    return {
      id: fixtureId,
      competition: compName,
      homeTeam: {
        name: homeTeam.name || "Équipe Domicile",
        code: homeTeam.name?.slice(0, 3).toUpperCase() || "DOM",
        shortName: homeTeam.name || "Domicile",
        logoUrl: homeTeam.logo || "⚽",
        color: homeColors.color,
        textColor: homeColors.textColor,
        apiTeamId: homeTeam.id
      },
      awayTeam: {
        name: awayTeam.name || "Équipe Extérieur",
        code: awayTeam.name?.slice(0, 3).toUpperCase() || "EXT",
        shortName: awayTeam.name || "Extérieur",
        logoUrl: awayTeam.logo || "⚽",
        color: awayColors.color,
        textColor: awayColors.textColor,
        apiTeamId: awayTeam.id
      },
      homeScore,
      awayScore,
      minute: elapsed,
      status: statusStr,
      shortStatus: shortStatus || '',
      extraTime: f.fixture?.status?.extra ?? null,
      date: f.fixture?.date || "",
      events: mappedEvents,
      stats: f.statistics || null,
      hasRealStats: true,
      hasRealLineups: true
    };
  });
}

// Maps team statistics
function mapApiSportsStats(statsArray: any[]): { home: any, away: any, hasStats: boolean } {
  const defaultStats = {
    possession: 50,
    shots: 0,
    shotsOnTarget: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0
  };

  if (!statsArray || !Array.isArray(statsArray) || statsArray.length < 2) {
    return { home: defaultStats, away: defaultStats, hasStats: false };
  }

  const findStat = (statsList: any[], typeName: string): number => {
    const found = statsList.find((s: any) => String(s.type).toLowerCase() === typeName.toLowerCase());
    if (!found || found.value === null || found.value === undefined) return 0;
    if (typeof found.value === 'string' && found.value.endsWith('%')) {
      return parseInt(found.value) || 0;
    }
    return parseInt(found.value) || 0;
  };

  const homeStatsRaw = statsArray[0]?.statistics || [];
  const awayStatsRaw = statsArray[1]?.statistics || [];

  const homeMapped = {
    possession: findStat(homeStatsRaw, 'Ball Possession') || 50,
    shots: findStat(homeStatsRaw, 'Total Shots') || (findStat(homeStatsRaw, 'Shots on Goal') + findStat(homeStatsRaw, 'Shots off Goal')),
    shotsOnTarget: findStat(homeStatsRaw, 'Shots on Goal'),
    corners: findStat(homeStatsRaw, 'Corner Kicks'),
    fouls: findStat(homeStatsRaw, 'Fouls'),
    yellowCards: findStat(homeStatsRaw, 'Yellow Cards'),
    redCards: findStat(homeStatsRaw, 'Red Cards')
  };

  const awayMapped = {
    possession: findStat(awayStatsRaw, 'Ball Possession') || (100 - homeMapped.possession),
    shots: findStat(awayStatsRaw, 'Total Shots') || (findStat(awayStatsRaw, 'Shots on Goal') + findStat(awayStatsRaw, 'Shots off Goal')),
    shotsOnTarget: findStat(awayStatsRaw, 'Shots on Goal'),
    corners: findStat(awayStatsRaw, 'Corner Kicks'),
    fouls: findStat(awayStatsRaw, 'Fouls'),
    yellowCards: findStat(awayStatsRaw, 'Yellow Cards'),
    redCards: findStat(awayStatsRaw, 'Red Cards')
  };

  const hasStats = (homeMapped.shots > 0 || awayMapped.shots > 0 || homeMapped.possession !== 50);

  return {
    home: homeMapped,
    away: awayMapped,
    hasStats
  };
}

interface CacheEntry {
  timestamp: number;
  data: any;
}

const apiCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 30000; // 30 seconds Cache dynamic lifetime to avoid rate-limiting on free tokens

// Global shared controller state memory store for real-time OBS overlay syncing
let sharedControllerState = {
  selectedApiMatchId: "",
  streamSource: "greenscreen",
  selectedLineupTeam: "home",
  selectedDate: new Date().toISOString().split('T')[0],
  isTokenSavingMode: true,
  isPlayingSim: false,
  pinnedMatchIds: [] as string[],
  matchState: null as any,
  timestamp: Date.now(),
  assetsVersion: 0
};

// Isolated in-memory store for heavy media assets to prevent rate limit bottlenecks and massive POST payload sizes
let sharedAssets = {
  backgroundImage: null as string | null,
  competitionImage: null as string | null,
  streamerLogo: null as string | null,
  ads: null as any[] | null,
  version: 0
};

const ASSETS_DATA_FILE = path.join(process.cwd(), 'assets_data.json');

function loadAssetsData() {
  if (fs.existsSync(ASSETS_DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ASSETS_DATA_FILE, 'utf8'));
      sharedAssets = { ...sharedAssets, ...parsed };
      console.log("[Admin Server] Loaded persisted assets (background/logo) successfully.");
    } catch (e) {
      console.error("[Admin Server] Error loading persisted assets:", e);
    }
  }
}

function saveAssetsData() {
  try {
    fs.writeFileSync(ASSETS_DATA_FILE, JSON.stringify(sharedAssets, null, 2), 'utf8');
  } catch (e) {
    console.error("[Admin Server] Error saving assets data:", e);
  }
}

loadAssetsData();

// Admin custom manual data stores (persistent on disk)
// [NO-HISTORY] Indique si l'admin a saisi des données durant CETTE session.
// Tant que c'est false, rien n'est poussé aux clients à la connexion (pas de résidu).
const adminTouched = { lineups: false, upcoming: false, matchInfo: false };

let adminLineups = {
  home: { formation: "", players: [] as any[] },
  away: { formation: "", players: [] as any[] }
};

let adminUpcomingMatches: any[] = [];

let adminMatchInfo: any = {
  homeTeam: { name: "Domicile", code: "DOM", color: "#EF4444", logoUrl: "⚽" },
  awayTeam: { name: "Extérieur", code: "EXT", color: "#2563EB", logoUrl: "⚽" },
  competition: "",
  minute: 0,
  seconds: 0,
  homeScore: 0,
  awayScore: 0,
  isPlaying: false,
  status: "UPCOMING",
  extraTime1H: "",
  extraTime2H: "",
  events: [] as any[],
  viewers: 0,
  likes: 0
};

const ADMIN_DATA_FILE = path.join(process.cwd(), 'admin_data.json');

// [NO-HISTORY] La persistance disque des données de match est désactivée :
// le serveur démarre toujours avec un état vierge pour éviter tout résidu
// (ex: ancienne compo Portugal vs RD Congo) qui contaminerait les nouvelles données.
function loadAdminData() { /* désactivé volontairement */ }

function saveAdminData() { /* désactivé volontairement */ }

// Suppression de tout ancien fichier d'historique au démarrage
try { if (fs.existsSync(ADMIN_DATA_FILE)) fs.unlinkSync(ADMIN_DATA_FILE); } catch (e) {}

loadAdminData();

// [NO-HISTORY] Aucun état de match n'est semé au démarrage : le client garde
// son écran d'attente tant qu'aucun match réel ou manuel n'est choisi.

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    
    // Emit initial states — uniquement les données réellement saisies durant cette session
    socket.emit('state:update', sharedControllerState);
    if (adminTouched.lineups) socket.emit('lineups:update', adminLineups);
    if (adminTouched.upcoming) socket.emit('upcoming:update', adminUpcomingMatches);
    if (adminTouched.matchInfo) socket.emit('match-info:update', adminMatchInfo);

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Server-side match timer auto-increment to prevent client-side flooding and multi-client conflicts
  setInterval(() => {
    if (adminMatchInfo && adminMatchInfo.isPlaying) {
      let nextSec = (adminMatchInfo.seconds || 0) + 1;
      let nextMin = adminMatchInfo.minute || 0;
      let nextStatus = adminMatchInfo.status || 'UPCOMING';
      let nextIsPlaying = true;

      if (nextSec >= 60) {
        nextSec = 0;
        nextMin += 1;
      }

      // No more auto-transition to HT/FINISHED at 45/90 — the clock keeps running into
      // stoppage time ("temps additionnel") until the admin manually ends the period.

      adminMatchInfo.seconds = nextSec;
      adminMatchInfo.minute = nextMin;
      adminMatchInfo.status = nextStatus;
      adminMatchInfo.isPlaying = nextIsPlaying;

      // Synchronize back to sharedControllerState.matchState
      if (!sharedControllerState.matchState) {
        sharedControllerState.matchState = {};
      }
      sharedControllerState.matchState = {
        ...sharedControllerState.matchState,
        ...adminMatchInfo
      };
      sharedControllerState.timestamp = Date.now();

      adminTouched.matchInfo = true;

      // Emit updates to clients
      if (io) {
        io.emit('match-info:update', adminMatchInfo);
        io.emit('score:update', sharedControllerState.matchState);
        io.emit('state:update', sharedControllerState);
      }
    }
  }, 1000);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // OBS Real-time state synchronization endpoints
  app.post('/api/sync/state', (req, res) => {
    try {
      // Exclude large base64 assets if they happen to be in req.body to prevent server memory issues
      const { backgroundImage, competitionImage, streamerLogo, ...rest } = req.body;

      sharedControllerState = {
        ...sharedControllerState,
        ...rest,
        timestamp: Date.now()
      };

      // Broadcast update to all socket clients
      const io = app.get('socketio');
      if (io) {
        io.emit('state:update', sharedControllerState);
        if (rest.matchState) {
          io.emit('score:update', rest.matchState);
        }
      }

      return res.json({ success: true, state: sharedControllerState });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sync/state', (req, res) => {
    return res.json(sharedControllerState);
  });

  // Dedicated endpoints for large base64 assets
  app.post('/api/sync/assets', (req, res) => {
    try {
      const nextVersion = sharedAssets.version + 1;
      sharedAssets = {
        ...sharedAssets,
        ...req.body,
        version: nextVersion
      };
      // Propagate assetsVersion back into sharedControllerState
      sharedControllerState.assetsVersion = nextVersion;
      sharedControllerState.timestamp = Date.now();
      saveAssetsData();
      return res.json({ success: true, version: nextVersion });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sync/assets', (req, res) => {
    return res.json(sharedAssets);
  });

  // ADMIN CUSTOM MANUAL ENDPOINTS
  app.get('/api/admin/lineups', (req, res) => {
    return res.json({ success: true, lineups: adminLineups });
  });

  app.post('/api/admin/lineups', (req, res) => {
    try {
      const { home, away } = req.body;
      if (home) adminLineups.home = home;
      if (away) adminLineups.away = away;
      adminTouched.lineups = true;

      const io = app.get('socketio');
      if (io) {
        io.emit('lineups:update', adminLineups);
      }

      return res.json({ success: true, lineups: adminLineups });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/upcoming-matches', (req, res) => {
    return res.json({ success: true, upcomingMatches: adminUpcomingMatches });
  });

  app.post('/api/admin/upcoming-matches', (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        adminUpcomingMatches = req.body;
      } else {
        const { id, homeTeam, awayTeam, date, time, homeTeamFlag, awayTeamFlag, competition, status, homeScore, awayScore } = req.body;
        const index = adminUpcomingMatches.findIndex(m => m.id === id);
        if (index > -1) {
          adminUpcomingMatches[index] = { ...adminUpcomingMatches[index], ...req.body };
        } else {
          adminUpcomingMatches.push({
            id: id || 'up-' + Date.now(),
            date: date || 'Aujourd\'hui',
            time: time || '12:00',
            homeTeam: homeTeam || 'Home',
            awayTeam: awayTeam || 'Away',
            homeTeamFlag: homeTeamFlag || '⚽',
            awayTeamFlag: awayTeamFlag || '⚽',
            competition: competition || 'Ligue 1',
            status: status || 'UPCOMING',
            homeScore: homeScore !== undefined ? homeScore : 0,
            awayScore: awayScore !== undefined ? awayScore : 0
          });
        }
      }

      adminTouched.upcoming = true;

      const io = app.get('socketio');
      if (io) {
        io.emit('upcoming:update', adminUpcomingMatches);
      }

      return res.json({ success: true, upcomingMatches: adminUpcomingMatches });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/match-info', (req, res) => {
    return res.json({ success: true, matchInfo: adminMatchInfo });
  });

  app.post('/api/admin/match-info', (req, res) => {
    try {
      adminMatchInfo = {
        ...adminMatchInfo,
        ...req.body
      };
      adminTouched.matchInfo = true;

      // Synchronize back to sharedControllerState.matchState
      if (!sharedControllerState.matchState) {
        sharedControllerState.matchState = {};
      }
      sharedControllerState.matchState = {
        ...sharedControllerState.matchState,
        ...adminMatchInfo
      };
      sharedControllerState.timestamp = Date.now();

      const io = app.get('socketio');
      if (io) {
        io.emit('match-info:update', adminMatchInfo);
        io.emit('score:update', sharedControllerState.matchState);
        io.emit('state:update', sharedControllerState);
      }

      return res.json({ success: true, matchInfo: adminMatchInfo, matchState: sharedControllerState.matchState });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Unified API Proxy Route for real-world live fixtures mapped to API-Football (api-sports.io)
  const getLiveScores = async (req: express.Request, res: express.Response) => {
    return res.json({
      source: 'mock',
      matches: [],
      error: "L'API-Football externe est désactivée par configuration.",
      message: "L'utilisation de l'API externe est désactivée. Mode local uniquement.",
      diagnostic: {
        fournisseurActif: "Désactivé (Local)",
        cleDetectee: false,
        dernierTestApi: "Désactivé",
        statutHttp: 200,
        nombreMatchsRecuperes: 0
      }
    });
  };

  // Helper mapping grid coordinate strings to pitch percentages
  const mapGridToCoords = (grid: string, position: string, index: number) => {
    if (position === 'G' || position?.toLowerCase() === 'gk') {
      return { x: 50, y: 90 };
    }
    if (grid && typeof grid === 'string' && grid.includes(':')) {
      const parts = grid.split(':');
      const rVal = parseInt(parts[0]);
      const cVal = parseInt(parts[1]);
      if (!isNaN(rVal) && !isNaN(cVal)) {
        let y = 50;
        if (rVal === 2) y = 72;
        else if (rVal === 3) y = 48;
        else if (rVal === 4) y = 24;
        else if (rVal >= 5) y = 10;
        else y = 90;
        return { rVal, cVal, y };
      }
    }
    let y = 50;
    if (position === 'D' || position?.toLowerCase() === 'def') y = 72;
    else if (position === 'M' || position?.toLowerCase() === 'mid') y = 48;
    else if (position === 'F' || position?.toLowerCase() === 'att' || position?.toLowerCase() === 'fwd') y = 18;
    return { rVal: 0, cVal: index + 1, y };
  };

  // Helper parsing lineups and arranging starting XI beautifully on pitch
  const parseLineupPlayers = (startXI: any[]) => {
    if (!startXI || !Array.isArray(startXI)) return [];
    
    const rowPlayers: Record<number, any[]> = {};
    const mappedList = startXI.map((item: any, idx: number) => {
      const p = item.player || {};
      const name = (p.name || "Joueur").toUpperCase();
      const number = p.number ?? (idx + 2);
      const apiPos = p.pos || "M";
      
      let position = "MID";
      if (apiPos === 'G') position = "GK";
      else if (apiPos === 'D') position = "DEF";
      else if (apiPos === 'M') position = "MID";
      else if (apiPos === 'F') position = "ATT";

      const coords = mapGridToCoords(p.grid, apiPos, idx);
      let rowId = coords.rVal;
      if (rowId === undefined || rowId === 0) {
        if (position === "GK") rowId = 1;
        else if (position === "DEF") rowId = 2;
        else if (position === "MID") rowId = 3;
        else rowId = 4;
      }

      return {
        id: String(p.id || `pl-${idx}-${number}`),
        name,
        number,
        position,
        rowId,
        cVal: coords.cVal || (idx + 1),
        x: 50,
        y: coords.y
      };
    });

    mappedList.forEach((p) => {
      if (!rowPlayers[p.rowId]) {
        rowPlayers[p.rowId] = [];
      }
      rowPlayers[p.rowId].push(p);
    });

    Object.keys(rowPlayers).forEach((rowStr) => {
      const rowId = parseInt(rowStr);
      const list = rowPlayers[rowId];
      list.sort((a, b) => a.cVal - b.cVal);
      const count = list.length;
      list.forEach((p, index) => {
        if (count === 1) {
          p.x = 50;
        } else {
          p.x = Math.round(15 + (70 / (count - 1)) * index);
        }
      });
    });

    return mappedList.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      x: p.x,
      y: p.y
    }));
  };

  // Mount routes to keep full compatibility & satisfy ad-blockers using safe route
  app.get('/api/scores/live', getLiveScores);
  app.get('/api/football/matches', getLiveScores);
  app.get('/api/sportsfeed/data', getLiveScores);

  // Live diagnostic endpoint checking key configuration, cache values, and actual API status
  app.get('/api/football/diagnostic', async (req, res) => {
    return res.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      fournisseurActif: "Désactivé (Manuel uniquement)",
      cleDetectee: false,
      statusHTTP: 200,
      dernierTestApi: "L'API-Football externe est désactivée par configuration.",
      competitionsCount: 0,
      nombreMatchsRecuperes: 0,
      sampleMatch: null,
      errorDetails: null,
      cacheStatus: {
        totalKeys: 0,
        entries: []
      }
    });
  });

  // Endpoint to obtain real team statistics from API-Football (RE-ENABLED: stats only, per user request)
  app.get('/api/football/statistics', async (req, res) => {
    try {
      const fixtureId = req.query.fixture;
      if (!fixtureId) {
        return res.status(400).json({ success: false, response: [], error: "Paramètre 'fixture' (ID du match API-Football) manquant." });
      }
      const data = await fetchFromApiFootball('fixtures/statistics', { fixture: String(fixtureId) });
      return res.json({
        success: true,
        response: data.response || []
      });
    } catch (err: any) {
      return res.json({
        success: false,
        response: [],
        error: err.message
      });
    }
  });

  // Endpoint to obtain real team lineups from API-Football (RE-ENABLED per user request)
  app.get('/api/football/lineups', async (req, res) => {
    try {
      const fixtureId = req.query.fixture;
      if (!fixtureId) {
        return res.json({ success: false, home: { formation: "Non disponible", players: [] }, away: { formation: "Non disponible", players: [] }, message: "Paramètre 'fixture' manquant." });
      }
      const data = await fetchFromApiFootball('fixtures/lineups', { fixture: String(fixtureId) });
      const response = data.response || [];
      return res.json({
        success: true,
        response
      });
    } catch (err: any) {
      return res.json({
        success: false,
        home: { formation: "Non disponible", players: [] },
        away: { formation: "Non disponible", players: [] },
        message: err.message
      });
    }
  });

  // Endpoint to obtain real team events, statistics, lineups, and current match state in one call
  app.get('/api/football/match-details', async (req, res) => {
    return res.status(404).json({ error: "API Football désactivée" });
  });

  // Vite development middleware or static production dist folder serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Live Football Scoreboard Backend online on http://0.0.0.0:${PORT}`);
  });
}

startServer();