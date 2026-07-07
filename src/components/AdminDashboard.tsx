import React, { useState, useEffect } from 'react';
import { useMatchContext, useMatchData } from '../context/MatchContext';
import { 
  Shield, 
  Users, 
  Calendar, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  ChevronRight, 
  Smartphone, 
  Clock, 
  Sliders, 
  UserPlus,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    state: match, 
    customLineups, 
    customUpcomingMatches,
    setMatchState,
    setCustomLineups,
    setCustomUpcomingMatches,
    selectedApiMatchId,
    setSelectedApiMatchId,
    isTokenSavingMode,
    setIsTokenSavingMode
  } = useMatchContext();

  const [activeTab, setActiveTab] = useState<'match' | 'lineups' | 'upcoming'>('match');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // --- TAB 1: Match Principal Local States ---
  const [homeName, setHomeName] = useState(match.homeTeam.name || '');
  const [homeCode, setHomeCode] = useState(match.homeTeam.code || '');
  const [homeColor, setHomeColor] = useState(match.homeTeam.color || '#EF4444');
  const [homeLogo, setHomeLogo] = useState(match.homeTeam.logoUrl || '🇵🇹');

  const [awayName, setAwayName] = useState(match.awayTeam.name || '');
  const [awayCode, setAwayCode] = useState(match.awayTeam.code || '');
  const [awayColor, setAwayColor] = useState(match.awayTeam.color || '#2563EB');
  const [awayLogo, setAwayLogo] = useState(match.awayTeam.logoUrl || '🇨🇩');

  const [competition, setCompetition] = useState(match.competition || '');
  const [minute, setMinute] = useState(match.minute || 0);
  const [seconds, setSeconds] = useState(match.seconds || 0);
  const [isPlaying, setIsPlaying] = useState(match.isPlaying || false);
  const [status, setStatus] = useState(match.status || 'UPCOMING');

  const [scorerName, setScorerName] = useState('');

  // Sync inputs with state when state updates from Socket.io/Polling
  useEffect(() => {
    // Prevent background state updates from resetting fields while the user is actively typing
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    console.log('[DIAG] sync effect fired. isTyping=', isTyping, 'activeElement=', activeEl?.tagName, activeEl?.getAttribute('placeholder'), 'match.homeTeam.name=', match.homeTeam.name);
    if (isTyping) {
      console.log('[DIAG] BLOCKED reset because user is typing');
      return;
    }
    console.log('[DIAG] APPLYING reset - homeName will become:', match.homeTeam.name);

    setHomeName(match.homeTeam.name || '');
    setHomeCode(match.homeTeam.code || '');
    setHomeColor(match.homeTeam.color || '#EF4444');
    setHomeLogo(match.homeTeam.logoUrl || '🇵🇹');

    setAwayName(match.awayTeam.name || '');
    setAwayCode(match.awayTeam.code || '');
    setAwayColor(match.awayTeam.color || '#2563EB');
    setAwayLogo(match.awayTeam.logoUrl || '🇨🇩');

    setCompetition(match.competition || '');
    setMinute(match.minute || 0);
    setSeconds(match.seconds || 0);
    setIsPlaying(match.isPlaying || false);
    setStatus(match.status || 'UPCOMING');
  }, [match]);

  // --- TAB 2: Lineups Local States ---
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [lineupFormation, setLineupFormation] = useState<'4-3-3' | '4-2-3-1' | '4-4-2' | '3-5-2' | '5-3-2'>('4-3-3');
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [lineupImage, setLineupImage] = useState<string>('');

  // Load players on team / formation switch
  useEffect(() => {
    const activeRoster = customLineups[selectedTeam];
    if (activeRoster) {
      setLineupFormation(activeRoster.formation as any || '4-3-3');
      setPlayersList(activeRoster.players || []);
      setLineupImage((activeRoster as any).imageUrl || '');
    }
  }, [selectedTeam, customLineups]);

  const handleLineupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image trop volumineuse (max 2 Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLineupImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- TAB 3: Upcoming Matches Local States ---
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('Direct');
  const [newMatchHome, setNewMatchHome] = useState('');
  const [newMatchAway, setNewMatchAway] = useState('');
  const [newMatchHomeFlag, setNewMatchHomeFlag] = useState('⚽');
  const [newMatchAwayFlag, setNewMatchAwayFlag] = useState('⚽');
  const [newMatchCompetition, setNewMatchCompetition] = useState('');

  const updateMatchInfoOnServer = async (updatedFields: any) => {
    try {
      const payload = {
        ...updatedFields
      };
      await fetch('/api/admin/match-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Error updating match info on server:", err);
    }
  };

  const saveMainMatchInfo = async () => {
    setSaveStatus("Enregistrement...");
    try {
      const payload = {
        homeTeam: {
          name: homeName,
          code: homeCode,
          color: homeColor,
          logoUrl: homeLogo
        },
        awayTeam: {
          name: awayName,
          code: awayCode,
          color: awayColor,
          logoUrl: awayLogo
        },
        competition,
        minute,
        seconds,
        status,
        isPlaying
      };

      const res = await fetch('/api/admin/match-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus("Enregistré avec succès !");
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        throw new Error("HTTP status " + res.status);
      }
    } catch (err: any) {
      setSaveStatus("Erreur : " + err.message);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleScoreChange = async (team: 'home' | 'away', change: number) => {
    const currentScore = team === 'home' ? match.homeScore : match.awayScore;
    const newScore = Math.max(0, currentScore + change);
    
    // Add goal scorer event if adding goal (+1)
    let nextEvents = [...(match.events || [])];
    if (change > 0) {
      const eventId = 'ev-' + Date.now();
      nextEvents.push({
        id: eventId,
        type: 'goal' as any,
        team: team,
        player: scorerName.trim() || "Buteur",
        minute: minute,
        second: match.seconds || 0,
        description: "But !"
      });
      setScorerName(''); // Clear scorer name
    } else if (change < 0) {
      // Remove last goal event for this team
      const goalIndex = [...nextEvents].reverse().findIndex(e => e.type === 'goal' && e.team === team);
      if (goalIndex > -1) {
        const realIndex = nextEvents.length - 1 - goalIndex;
        nextEvents.splice(realIndex, 1);
      }
    }

    try {
      const payload: any = {
        events: nextEvents
      };
      if (team === 'home') {
        payload.homeScore = newScore;
      } else {
        payload.awayScore = newScore;
      }

      await fetch('/api/admin/match-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to update score:", err);
    }
  };

  const handleTimerToggle = async () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    
    const updatedFields: any = { isPlaying: nextPlaying };
    if (nextPlaying && (status === 'UPCOMING' || status === 'HT' || status === 'HALF_TIME' || status === 'FINISHED' || status === 'FT')) {
      let nextStatus: 'IN_PLAY' | 'FINISHED' | 'HALF_TIME' | 'UPCOMING' | '1H' | '2H' | 'HT' | 'FT' = status;
      if (status === 'UPCOMING' || status === 'FINISHED' || status === 'FT') {
        nextStatus = '1H';
        setMinute(0);
        setSeconds(0);
        updatedFields.minute = 0;
        updatedFields.seconds = 0;
      } else if (status === 'HT' || status === 'HALF_TIME') {
        nextStatus = '2H';
        setMinute(45);
        setSeconds(0);
        updatedFields.minute = 45;
        updatedFields.seconds = 0;
      }
      setStatus(nextStatus);
      updatedFields.status = nextStatus;
    }

    await updateMatchInfoOnServer(updatedFields);
  };

  const handleTimerReset = async () => {
    setMinute(0);
    setSeconds(0);
    setIsPlaying(false);
    await updateMatchInfoOnServer({ minute: 0, seconds: 0, isPlaying: false });
  };

  // --- LINEUPS ACTIONS ---
  const handlePlayerChange = (id: string, field: string, value: any) => {
    setPlayersList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddPlayer = () => {
    const nextId = 'p-' + Date.now();
    setPlayersList(prev => [
      ...prev,
      { id: nextId, name: "Nouveau Joueur", number: 10, role: "M", x: 50, y: 50 }
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayersList(prev => prev.filter(p => p.id !== id));
  };

  const applyFormationPreset = (formation: '4-3-3' | '4-2-3-1' | '4-4-2' | '3-5-2' | '5-3-2') => {
    setLineupFormation(formation);
    
    // Default coordinates based on soccer roles
    const presets: Record<string, Array<{role: string, x: number, y: number}>> = {
      '4-3-3': [
        { role: 'G', x: 50, y: 90 },
        { role: 'D', x: 15, y: 70 }, { role: 'D', x: 38, y: 75 }, { role: 'D', x: 62, y: 75 }, { role: 'D', x: 85, y: 70 },
        { role: 'M', x: 30, y: 48 }, { role: 'M', x: 50, y: 55 }, { role: 'M', x: 70, y: 48 },
        { role: 'A', x: 20, y: 22 }, { role: 'A', x: 50, y: 15 }, { role: 'A', x: 80, y: 22 }
      ],
      '4-2-3-1': [
        { role: 'G', x: 50, y: 90 },
        { role: 'D', x: 15, y: 70 }, { role: 'D', x: 38, y: 75 }, { role: 'D', x: 62, y: 75 }, { role: 'D', x: 85, y: 70 },
        { role: 'M', x: 35, y: 58 }, { role: 'M', x: 65, y: 58 },
        { role: 'M', x: 20, y: 36 }, { role: 'M', x: 50, y: 32 }, { role: 'M', x: 80, y: 36 },
        { role: 'A', x: 50, y: 14 }
      ],
      '4-4-2': [
        { role: 'G', x: 50, y: 90 },
        { role: 'D', x: 15, y: 70 }, { role: 'D', x: 38, y: 75 }, { role: 'D', x: 62, y: 75 }, { role: 'D', x: 85, y: 70 },
        { role: 'M', x: 15, y: 45 }, { role: 'M', x: 38, y: 48 }, { role: 'M', x: 62, y: 48 }, { role: 'M', x: 85, y: 45 },
        { role: 'A', x: 35, y: 18 }, { role: 'A', x: 65, y: 18 }
      ],
      '3-5-2': [
        { role: 'G', x: 50, y: 90 },
        { role: 'D', x: 25, y: 75 }, { role: 'D', x: 50, y: 78 }, { role: 'D', x: 75, y: 75 },
        { role: 'M', x: 15, y: 50 }, { role: 'M', x: 35, y: 45 }, { role: 'M', x: 50, y: 55 }, { role: 'M', x: 65, y: 45 }, { role: 'M', x: 85, y: 50 },
        { role: 'A', x: 35, y: 18 }, { role: 'A', x: 65, y: 18 }
      ],
      '5-3-2': [
        { role: 'G', x: 50, y: 90 },
        { role: 'D', x: 15, y: 70 }, { role: 'D', x: 33, y: 75 }, { role: 'D', x: 50, y: 78 }, { role: 'D', x: 67, y: 75 }, { role: 'D', x: 85, y: 70 },
        { role: 'M', x: 30, y: 50 }, { role: 'M', x: 50, y: 52 }, { role: 'M', x: 70, y: 50 },
        { role: 'A', x: 35, y: 18 }, { role: 'A', x: 65, y: 18 }
      ]
    };

    const activePreset = presets[formation];
    if (activePreset) {
      setPlayersList(prev => {
        return prev.map((player, idx) => {
          if (idx < activePreset.length) {
            return {
              ...player,
              role: activePreset[idx].role,
              x: activePreset[idx].x,
              y: activePreset[idx].y
            };
          }
          return player;
        });
      });
    }
  };

  const saveLineups = async () => {
    setSaveStatus("Enregistrement de la compo...");
    try {
      const payload = {
        [selectedTeam]: {
          formation: lineupFormation,
          players: playersList,
          imageUrl: lineupImage || null
        }
      };

      const res = await fetch('/api/admin/lineups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus("Compo enregistrée avec succès !");
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        throw new Error("HTTP status " + res.status);
      }
    } catch (err: any) {
      setSaveStatus("Erreur : " + err.message);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // --- UPCOMING MATCHES ACTIONS ---
  const handleAddUpcomingMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchHome || !newMatchAway) {
      alert("Veuillez remplir au moins les noms des équipes !");
      return;
    }

    setSaveStatus("Ajout du match...");
    try {
      const payload = {
        id: 'up-' + Date.now(),
        date: newMatchDate || 'Aujourd\'hui',
        time: newMatchTime || 'Direct',
        homeTeam: newMatchHome,
        awayTeam: newMatchAway,
        homeTeamFlag: newMatchHomeFlag,
        awayTeamFlag: newMatchAwayFlag,
        competition: newMatchCompetition || 'Match Amical',
        status: 'UPCOMING',
        homeScore: 0,
        awayScore: 0
      };

      const res = await fetch('/api/admin/upcoming-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewMatchHome('');
        setNewMatchAway('');
        setNewMatchHomeFlag('⚽');
        setNewMatchAwayFlag('⚽');
        setNewMatchDate('');
        setNewMatchCompetition('');
        setSaveStatus("Match ajouté avec succès !");
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch (err: any) {
      setSaveStatus("Erreur : " + err.message);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleDeleteUpcomingMatch = async (id: string) => {
    if (!confirm("Voulez-vous supprimer ce match au programme ?")) return;

    setSaveStatus("Suppression...");
    try {
      const nextList = customUpcomingMatches.filter(m => m.id !== id);
      const res = await fetch('/api/admin/upcoming-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextList)
      });

      if (res.ok) {
        setSaveStatus("Match supprimé !");
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        throw new Error("HTTP status " + res.status);
      }
    } catch (err: any) {
      setSaveStatus("Erreur : " + err.message);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'home' | 'away' | 'upcomingHome' | 'upcomingAway') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert("Image trop volumineuse (max 1 Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (side === 'home') setHomeLogo(reader.result);
          else if (side === 'away') setAwayLogo(reader.result);
          else if (side === 'upcomingHome') setNewMatchHomeFlag(reader.result);
          else if (side === 'upcomingAway') setNewMatchAwayFlag(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const nextEvents = (match.events || []).filter(e => e.id !== eventId);
      await fetch('/api/admin/match-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: nextEvents })
      });
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans flex flex-col" id="admin-dashboard-container">
      {/* Top Banner Navigation */}
      <header className="bg-[#121214] border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-brand-red animate-pulse shadow-[0_0_12px_#EF4444]" />
          <div>
            <h1 className="font-display font-black tracking-widest text-sm uppercase leading-none text-slate-100 flex items-center gap-1.5">
              RENAULT TV <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> PANNEAU DE CONTRÔLE REGIE
            </h1>
            <span className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider block">
              Gestion ultra-rapide des flux temps réel & scores via Socket.io
            </span>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="bg-zinc-800 hover:bg-zinc-700 font-mono font-black tracking-widest text-[10px] uppercase py-2 px-4 rounded-lg border border-white/10 text-slate-300 transition duration-150 cursor-pointer"
        >
          Retour au Cockpit
        </button>
      </header>

      {/* Floating Save/Status Alert Indicator */}
      {saveStatus && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/90 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs py-3 px-5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          {saveStatus}
        </div>
      )}

      {/* Primary Tab Bar */}
      <div className="border-b border-white/5 bg-[#121214]/50 px-6 py-2 flex items-center gap-2 shadow-inner overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('match')}
          className={`flex items-center gap-2 font-display font-black text-xs tracking-widest uppercase px-5 py-3.5 rounded-xl transition cursor-pointer border ${
            activeTab === 'match' 
              ? 'bg-zinc-100 text-black border-white' 
              : 'text-slate-400 hover:text-white bg-transparent border-transparent'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          1. Score & Match Principal
        </button>
        <button
          onClick={() => setActiveTab('lineups')}
          className={`flex items-center gap-2 font-display font-black text-xs tracking-widest uppercase px-5 py-3.5 rounded-xl transition cursor-pointer border ${
            activeTab === 'lineups' 
              ? 'bg-zinc-100 text-black border-white' 
              : 'text-slate-400 hover:text-white bg-transparent border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          2. Compositions (Lineups)
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 font-display font-black text-xs tracking-widest uppercase px-5 py-3.5 rounded-xl transition cursor-pointer border ${
            activeTab === 'upcoming' 
              ? 'bg-zinc-100 text-black border-white' 
              : 'text-slate-400 hover:text-white bg-transparent border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          3. Matchs au Programme
        </button>
      </div>

      {/* Dashboard Body Area */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto" id="dashboard-body-area">
        
        {/* TAB 1: MATCH PRINCIPAL CONTROL */}
        {activeTab === 'match' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="tab-match-principal-panel">
            
            {/* Real-time Telephony Score Controller (Col 1-5) */}
            <div className="lg:col-span-5 bg-zinc-900/60 rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
                  <Smartphone className="text-brand-red w-5 h-5" />
                  <h3 className="font-display font-black text-xs tracking-widest text-white uppercase leading-none">
                    Télécommande de Score (Mobile-Ready)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center mt-2">
                  {/* Home Team Score Column */}
                  <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 relative">
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-xs">{homeLogo && (homeLogo.startsWith('http') || homeLogo.startsWith('data:')) ? <img src={homeLogo} className="w-4 h-4 object-contain inline rounded" /> : homeLogo}</span>
                      <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{homeCode}</span>
                    </div>
                    <div className="font-mono text-5xl font-black text-white mt-4 select-none">
                      {match.homeScore}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 font-bold uppercase mt-1 truncate">
                      {homeName || "Domicile"}
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() => handleScoreChange('home', 1)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-lg shadow-emerald-950/50"
                      >
                        <Plus className="w-4 h-4" /> +1 Domicile
                      </button>
                      <button
                        onClick={() => handleScoreChange('home', -1)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-slate-300 py-1.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 border border-white/5"
                      >
                        <Minus className="w-3 h-3" /> -1 Annuler
                      </button>
                    </div>
                  </div>

                  {/* Away Team Score Column */}
                  <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{awayCode}</span>
                      <span className="text-xs">{awayLogo && (awayLogo.startsWith('http') || awayLogo.startsWith('data:')) ? <img src={awayLogo} className="w-4 h-4 object-contain inline rounded" /> : awayLogo}</span>
                    </div>
                    <div className="font-mono text-5xl font-black text-white mt-4 select-none">
                      {match.awayScore}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 font-bold uppercase mt-1 truncate">
                      {awayName || "Visiteur"}
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() => handleScoreChange('away', 1)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-lg shadow-emerald-950/50"
                      >
                        <Plus className="w-4 h-4" /> +1 Visiteur
                      </button>
                      <button
                        onClick={() => handleScoreChange('away', -1)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-slate-300 py-1.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 border border-white/5"
                      >
                        <Minus className="w-3 h-3" /> -1 Annuler
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scorer Optional input */}
                <div className="mt-5 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Nom du Buteur (Optionnel pour ajouter l'événement de but)
                  </label>
                  <input
                    type="text"
                    value={scorerName}
                    onChange={(e) => setScorerName(e.target.value)}
                    placeholder="ex: Cristiano Ronaldo"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">
                    * Saisissez le buteur AVANT d'appuyer sur "+1" pour l'ajouter automatiquement à la chronologie du match !
                  </p>
                </div>

                {/* Time controller section */}
                <div className="mt-5 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      Gestion du Chronomètre
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-500">
                      {String(minute).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTimerToggle}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 ${
                        isPlaying 
                          ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? 'Pause' : 'Démarrer'}
                    </button>
                    <button
                      onClick={handleTimerReset}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 p-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white cursor-pointer active:scale-95"
                      title="Remettre à zéro"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="flex flex-col">
                      <label className="text-[8px] font-mono text-slate-400 uppercase font-black mb-1">
                        Minute de jeu
                      </label>
                      <input
                        type="number"
                        value={minute}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setMinute(val);
                          updateMatchInfoOnServer({ minute: val });
                        }}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-1.5 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[8px] font-mono text-slate-400 uppercase font-black mb-1">
                        Secondes
                      </label>
                      <input
                        type="number"
                        value={seconds}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSeconds(val);
                          updateMatchInfoOnServer({ seconds: val });
                        }}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-1.5 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status information pills */}
              <div className="mt-5 border-t border-white/10 pt-4 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[9px] text-slate-500 uppercase font-bold">Période:</span>
                {(['UPCOMING', '1H', 'HT', '2H', 'FINISHED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={async () => {
                      setStatus(st);
                      await updateMatchInfoOnServer({ status: st });
                    }}
                    className={`font-mono text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider cursor-pointer border ${
                      status === st 
                        ? 'bg-brand-red text-white border-brand-red' 
                        : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {st === 'UPCOMING' ? 'À venir' : st === 'FINISHED' ? 'Terminé' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Match Details Configuration Panel (Col 6-12) */}
            <div className="lg:col-span-7 bg-zinc-900/60 rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
                  <Sliders className="text-zinc-400 w-5 h-5" />
                  <h3 className="font-display font-black text-xs tracking-widest text-white uppercase leading-none">
                    Détails des Équipes & Match Principal
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                  {/* Home Team Fields */}
                  <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                    <h4 className="font-mono text-[10px] text-emerald-500 font-bold uppercase tracking-wider border-b border-white/5 pb-1 mb-3">
                      Équipe Domicile (Home)
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Nom complet</label>
                        <input 
                          type="text" 
                          value={homeName} 
                          onChange={(e) => { console.log('[DIAG] onChange homeName ->', e.target.value); setHomeName(e.target.value); }}
                          placeholder="ex: Portugal"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Trigramme (Code)</label>
                          <input 
                            type="text" 
                            value={homeCode} 
                            onChange={(e) => setHomeCode(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="POR"
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white text-center font-mono" 
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Couleur primaire</label>
                          <div className="flex gap-1.5 items-center">
                            <input 
                              type="color" 
                              value={homeColor} 
                              onChange={(e) => setHomeColor(e.target.value)}
                              className="w-8 h-8 rounded border border-white/10 bg-transparent p-0 overflow-hidden cursor-pointer" 
                            />
                            <span className="font-mono text-[10px] text-slate-300">{homeColor}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Drapeau Emoji ou URL de logo</label>
                        <input 
                          type="text" 
                          value={homeLogo} 
                          onChange={(e) => setHomeLogo(e.target.value)}
                          placeholder="Emoji ou URL d'image"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono" 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Téléverser un logo (Optionnel)</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'home')}
                          className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-zinc-800 file:text-white file:hover:bg-zinc-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Away Team Fields */}
                  <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                    <h4 className="font-mono text-[10px] text-blue-500 font-bold uppercase tracking-wider border-b border-white/5 pb-1 mb-3">
                      Équipe Visiteur (Away)
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Nom complet</label>
                        <input 
                          type="text" 
                          value={awayName} 
                          onChange={(e) => setAwayName(e.target.value)}
                          placeholder="ex: RD Congo"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Trigramme (Code)</label>
                          <input 
                            type="text" 
                            value={awayCode} 
                            onChange={(e) => setAwayCode(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="COD"
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white text-center font-mono" 
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Couleur primaire</label>
                          <div className="flex gap-1.5 items-center">
                            <input 
                              type="color" 
                              value={awayColor} 
                              onChange={(e) => setAwayColor(e.target.value)}
                              className="w-8 h-8 rounded border border-white/10 bg-transparent p-0 overflow-hidden cursor-pointer" 
                            />
                            <span className="font-mono text-[10px] text-slate-300">{awayColor}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Drapeau Emoji ou URL de logo</label>
                        <input 
                          type="text" 
                          value={awayLogo} 
                          onChange={(e) => setAwayLogo(e.target.value)}
                          placeholder="Emoji ou URL d'image"
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono" 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Téléverser un logo (Optionnel)</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'away')}
                          className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-zinc-800 file:text-white file:hover:bg-zinc-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Nom de la Compétition
                  </label>
                  <input
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    placeholder="ex: Match Amical"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="mt-4 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                    ID Match API-Football (statistiques réelles uniquement)
                  </label>
                  <input
                    type="text"
                    value={selectedApiMatchId || ''}
                    onChange={(e) => setSelectedApiMatchId(e.target.value)}
                    placeholder="ex: 1035037 (laisser vide pour stats manuelles)"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                  <p className="text-[9px] font-mono text-slate-500 mt-1.5 leading-relaxed">
                    Cherche l'ID du match sur api-football.com (fixture id). Le reste (score, noms, événements) reste géré manuellement — seules les stats (possession, tirs, corners, fautes, cartons) seront récupérées automatiquement.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                        ID Équipe Domicile (optionnel)
                      </label>
                      <input
                        type="text"
                        value={match.homeTeam.apiTeamId || ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setMatchState(prev => ({ ...prev, homeTeam: { ...prev.homeTeam, apiTeamId: val } }));
                        }}
                        placeholder="ex: 33"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                        ID Équipe Visiteur (optionnel)
                      </label>
                      <input
                        type="text"
                        value={match.awayTeam.apiTeamId || ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setMatchState(prev => ({ ...prev, awayTeam: { ...prev.awayTeam, apiTeamId: val } }));
                        }}
                        placeholder="ex: 34"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 mt-1.5 leading-relaxed">
                    Renseigne ces 2 IDs (trouvables sur dashboard.api-football.com → Ids → Teams) uniquement si le rapprochement automatique par nom d'équipe échoue.
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div>
                      <span className="block text-[10px] font-mono text-white font-bold uppercase tracking-wider">
                        Rafraîchissement auto des stats
                      </span>
                      <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                        {isTokenSavingMode
                          ? "Désactivé — recharge la page manuellement pour mettre à jour les stats (économise tes appels API)"
                          : "Activé — les stats se mettent à jour toutes les 30 secondes automatiquement"}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsTokenSavingMode(!isTokenSavingMode)}
                      className={`shrink-0 w-11 h-6 rounded-full relative transition cursor-pointer ${!isTokenSavingMode ? 'bg-brand-green' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${!isTokenSavingMode ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                {/* Match events / Scorer Timeline list */}
                <div className="mt-4 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                  <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 pb-1 mb-3">
                    Chronologie des Buts / Événements ({match.events?.length || 0})
                  </h4>

                  {(!match.events || match.events.length === 0) ? (
                    <p className="text-[10px] text-slate-500 font-mono italic text-center py-4">
                      Aucun buteur ou événement actuellement enregistré.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {match.events.map((ev, index) => (
                        <div key={ev.id || index} className="flex items-center justify-between bg-zinc-900/80 p-2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-amber-500">{ev.minute}'</span>
                            <span className="text-[11px] font-bold text-white">{ev.player}</span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                              ev.team === 'home' ? 'bg-brand-red/15 text-brand-red' : 'bg-brand-blue/15 text-brand-blue'
                            }`}>
                              {ev.team === 'home' ? homeCode : awayCode}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className="text-slate-500 hover:text-brand-red p-1 cursor-pointer"
                            title="Supprimer ce but"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4 flex justify-end">
                <button
                  onClick={saveMainMatchInfo}
                  className="bg-zinc-100 hover:bg-white text-black font-display font-black tracking-widest text-xs uppercase py-3.5 px-6 rounded-xl flex items-center gap-2 transition cursor-pointer active:scale-97"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder les détails du match
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COMPOSITIONS D'EQUIPES (LINEUPS) */}
        {activeTab === 'lineups' && (
          <div className="bg-zinc-900/60 rounded-3xl p-5 border border-white/10 shadow-2xl animate-fade-in" id="tab-lineups-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Users className="text-zinc-400 w-5 h-5" />
                <div>
                  <h3 className="font-display font-black text-xs tracking-widest text-white uppercase leading-none">
                    Compositions Tactiques
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider block">
                    Récupérées automatiquement depuis l'API-Football
                  </span>
                </div>
              </div>

              {/* Toggle Team (preview only) */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSelectedTeam('home')}
                  className={`font-mono font-black text-[10px] uppercase px-4 py-2 rounded-lg transition cursor-pointer ${
                    selectedTeam === 'home' 
                      ? 'bg-brand-red text-white' 
                      : 'text-slate-400 hover:text-white bg-transparent'
                  }`}
                >
                  {homeName || "Domicile"}
                </button>
                <button
                  onClick={() => setSelectedTeam('away')}
                  className={`font-mono font-black text-[10px] uppercase px-4 py-2 rounded-lg transition cursor-pointer ${
                    selectedTeam === 'away' 
                      ? 'bg-brand-blue text-white' 
                      : 'text-slate-400 hover:text-white bg-transparent'
                  }`}
                >
                  {awayName || "Visiteur"}
                </button>
              </div>
            </div>

            {!selectedApiMatchId ? (
              <div className="bg-zinc-950/40 rounded-2xl border border-amber-500/20 p-5 text-center">
                <p className="text-[11px] font-mono text-amber-400 font-bold uppercase mb-1">
                  Aucun ID de match API renseigné
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  Va dans l'onglet "Infos Match" et renseigne l'ID du match API-Football pour que les compositions se récupèrent automatiquement.
                </p>
              </div>
            ) : playersList.length === 0 ? (
              <div className="bg-zinc-950/40 rounded-2xl border border-white/5 p-5 text-center">
                <p className="text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Composition pas encore disponible
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  Les compositions officielles sont généralement publiées par l'API environ 30-60 min avant le coup d'envoi. Réessaie un peu plus tard.
                </p>
              </div>
            ) : (
              <div className="bg-zinc-950/40 rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Formation : {lineupFormation}
                  </span>
                  <span className="font-mono text-[9px] text-brand-green font-bold uppercase">
                    ● Synchronisé via API
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {playersList.map((p: any) => (
                    <div key={p.id} className="bg-zinc-900/60 rounded-xl px-3 py-2 border border-white/5 flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black text-white bg-black/40 rounded w-5 h-5 flex items-center justify-center shrink-0">
                        {p.number}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UPCOMING MATCHES */}
        {activeTab === 'upcoming' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="tab-upcoming-panel">
            
            {/* Create / Add Match Form (Col 1-5) */}
            <form onSubmit={handleAddUpcomingMatch} className="lg:col-span-5 bg-zinc-900/60 rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
                <Plus className="text-zinc-400 w-5 h-5" />
                <h3 className="font-display font-black text-xs tracking-widest text-white uppercase leading-none">
                  Ajouter un Match au Programme
                </h3>
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Nom Équipe Domicile (1)</label>
                <input
                  type="text"
                  value={newMatchHome}
                  onChange={(e) => setNewMatchHome(e.target.value)}
                  placeholder="ex: France"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Drapeau / URL Logo Domicile (1)</label>
                <input
                  type="text"
                  value={newMatchHomeFlag}
                  onChange={(e) => setNewMatchHomeFlag(e.target.value)}
                  placeholder="ex: 🇫🇷 ou URL"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Téléverser Logo Domicile (Optionnel)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'upcomingHome')}
                  className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-zinc-800 file:text-white file:hover:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 my-2" />

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Nom Équipe Visiteur (2)</label>
                <input
                  type="text"
                  value={newMatchAway}
                  onChange={(e) => setNewMatchAway(e.target.value)}
                  placeholder="ex: Espagne"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Drapeau / URL Logo Visiteur (2)</label>
                <input
                  type="text"
                  value={newMatchAwayFlag}
                  onChange={(e) => setNewMatchAwayFlag(e.target.value)}
                  placeholder="ex: 🇪🇸 ou URL"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Téléverser Logo Visiteur (Optionnel)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'upcomingAway')}
                  className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-zinc-800 file:text-white file:hover:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 my-2" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Date / Jour</label>
                  <input
                    type="text"
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    placeholder="ex: Demain ou 14/07"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Heure / Statut</label>
                  <input
                    type="text"
                    value={newMatchTime}
                    onChange={(e) => setNewMatchTime(e.target.value)}
                    placeholder="ex: 20:45 ou Direct"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-400 uppercase font-black block mb-1">Nom de la Compétition</label>
                <input
                  type="text"
                  value={newMatchCompetition}
                  onChange={(e) => setNewMatchCompetition(e.target.value)}
                  placeholder="ex: Euro 2026"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-zinc-100 hover:bg-white text-black font-display font-black tracking-widest text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-97 shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Ajouter au programme
                </button>
              </div>
            </form>

            {/* List / Delete Match Column (Col 6-12) */}
            <div className="lg:col-span-7 bg-zinc-900/60 rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
                  <Calendar className="text-zinc-400 w-5 h-5" />
                  <h3 className="font-display font-black text-xs tracking-widest text-white uppercase leading-none">
                    Calendrier de Diffusion Actuel
                  </h3>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {customUpcomingMatches.length === 0 ? (
                    <p className="text-center font-mono text-slate-500 text-[10px] py-12">
                      Aucun match au programme. Utilisez la colonne de gauche pour en ajouter.
                    </p>
                  ) : (
                    customUpcomingMatches.map((m) => (
                      <div key={m.id} className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-mono text-[8px] bg-brand-blue/15 border border-brand-blue/30 text-brand-blue px-1.5 py-0.5 rounded leading-none uppercase font-black">
                              {m.competition}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 font-bold">
                              {m.date} - {m.time}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Home Team */}
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                                {m.homeTeamFlag && (m.homeTeamFlag.startsWith('http') || m.homeTeamFlag.startsWith('data:')) ? <img src={m.homeTeamFlag} className="w-4 h-4 object-contain rounded" /> : m.homeTeamFlag}
                              </span>
                              <span className="font-display font-bold text-xs text-slate-100 truncate max-w-[120px]">{m.homeTeam}</span>
                            </div>

                            <span className="font-mono text-[10px] text-slate-500 font-black">vs</span>

                            {/* Away Team */}
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                                {m.awayTeamFlag && (m.awayTeamFlag.startsWith('http') || m.awayTeamFlag.startsWith('data:')) ? <img src={m.awayTeamFlag} className="w-4 h-4 object-contain rounded" /> : m.awayTeamFlag}
                              </span>
                              <span className="font-display font-bold text-xs text-slate-100 truncate max-w-[120px]">{m.awayTeam}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteUpcomingMatch(m.id)}
                          className="bg-zinc-800 hover:bg-zinc-700/80 hover:text-brand-red text-slate-400 p-2.5 rounded-xl border border-white/5 cursor-pointer transition active:scale-95"
                          title="Supprimer ce match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  * Les matchs s'enregistrent automatiquement lors de l'ajout ou de la suppression.
                </span>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer credits lines */}
      <footer className="bg-[#121214]/30 border-t border-white/5 py-4 px-6 flex flex-wrap items-center justify-between gap-4 text-center shrink-0 text-slate-500">
        <span className="text-[9px] font-mono uppercase tracking-[0.1em]">
          Réalisation Directe - Système de Real-Time Sync Socket.io ACTIF
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.1em]">
          Abidjan, Côte d'Ivoire & Kinshasa, RDC ● Portugal Match Regisseur
        </span>
      </footer>
    </div>
  );
}