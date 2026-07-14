/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useMatchContext } from '../context/MatchContext';
import { 
  Sliders, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  Calendar, 
  PlusCircle, 
  Clock, 
  Flag,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Footer() {
  const { 
    state: match, 
    customUpcomingMatches,
    setMatchState,
    setCustomUpcomingMatches
  } = useMatchContext();

  const [isOpen, setIsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // --- Match Principal Local States ---
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

  const [extraTime1H, setExtraTime1H] = useState(match.extraTime1H || '');
  const [extraTime2H, setExtraTime2H] = useState(match.extraTime2H || '');

  const [isMainInfoDirty, setIsMainInfoDirty] = useState(false);

  // --- Upcoming Matches Add States ---
  const [upHome, setUpHome] = useState('');
  const [upAway, setUpAway] = useState('');
  const [upHomeFlag, setUpHomeFlag] = useState('⚽');
  const [upAwayFlag, setUpAwayFlag] = useState('⚽');
  const [upDate, setUpDate] = useState('Aujourd\'hui');
  const [upTime, setUpTime] = useState('Direct');
  const [upComp, setUpComp] = useState('Match Amical');

  const timerContainerRef = useRef<HTMLDivElement>(null);
  const mainInfoContainerRef = useRef<HTMLDivElement>(null);

  const handleDiscardChanges = () => {
    setHomeName(match.homeTeam.name || '');
    setHomeCode(match.homeTeam.code || '');
    setHomeColor(match.homeTeam.color || '#EF4444');
    setHomeLogo(match.homeTeam.logoUrl || '🇵🇹');

    setAwayName(match.awayTeam.name || '');
    setAwayCode(match.awayTeam.code || '');
    setAwayColor(match.awayTeam.color || '#2563EB');
    setAwayLogo(match.awayTeam.logoUrl || '🇨🇩');

    setCompetition(match.competition || '');
    setIsMainInfoDirty(false);
  };

  // Sync inputs with state when state updates from backend, unless the user has unsaved modifications
  useEffect(() => {
    const activeEl = document.activeElement;
    const activeId = activeEl?.id || '';

    // Only sync team names, codes, colors, and logos if they are not currently being edited
    if (!isMainInfoDirty) {
      if (activeId !== 'input-home-name') setHomeName(match.homeTeam.name || '');
      if (activeId !== 'input-home-code') setHomeCode(match.homeTeam.code || '');
      if (activeId !== 'input-home-logo') setHomeLogo(match.homeTeam.logoUrl || '🇵🇹');
      if (activeId !== 'input-home-color') setHomeColor(match.homeTeam.color || '#EF4444');

      if (activeId !== 'input-away-name') setAwayName(match.awayTeam.name || '');
      if (activeId !== 'input-away-code') setAwayCode(match.awayTeam.code || '');
      if (activeId !== 'input-away-logo') setAwayLogo(match.awayTeam.logoUrl || '🇨🇩');
      if (activeId !== 'input-away-color') setAwayColor(match.awayTeam.color || '#2563EB');

      if (activeId !== 'input-competition') setCompetition(match.competition || '');
    }

    // Timer fields sync: only skip the specific inputs if the user is actively focused on them to edit manually
    if (activeId !== 'input-timer-min') {
      setMinute(match.minute || 0);
    }
    if (activeId !== 'input-timer-sec') {
      setSeconds(match.seconds || 0);
    }
    if (activeId !== 'input-extra-1h') {
      setExtraTime1H(match.extraTime1H || '');
    }
    if (activeId !== 'input-extra-2h') {
      setExtraTime2H(match.extraTime2H || '');
    }

    // Always sync non-input states since they don't have focused inputs
    setIsPlaying(match.isPlaying || false);
    setStatus(match.status || 'UPCOMING');
  }, [match, isMainInfoDirty]);

  const updateMatchInfoOnServer = async (updatedFields: any) => {
    try {
      await fetch('/api/admin/match-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
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
        setSaveStatus("Enregistré !");
        setIsMainInfoDirty(false);
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (err) {
      setSaveStatus("Erreur");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleScoreChange = async (team: 'home' | 'away', change: number) => {
    const currentScore = team === 'home' ? match.homeScore : match.awayScore;
    const newScore = Math.max(0, currentScore + change);
    
    let nextEvents = [...(match.events || [])];
    if (change > 0) {
      const eventId = 'ev-' + Date.now();
      nextEvents.push({
        id: eventId,
        type: 'goal' as any,
        team: team,
        player: "But",
        minute: minute,
        detail: "But !"
      });
    } else if (change < 0) {
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
      let nextStatus = status;
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

  const handleSetFirstHalf = async () => {
    setMinute(0);
    setSeconds(0);
    setIsPlaying(false);
    setStatus('1H');
    await updateMatchInfoOnServer({ minute: 0, seconds: 0, isPlaying: false, status: '1H' });
  };

  const handleSetSecondHalf = async () => {
    setMinute(45);
    setSeconds(0);
    setIsPlaying(false);
    setStatus('2H');
    await updateMatchInfoOnServer({ minute: 45, seconds: 0, isPlaying: false, status: '2H' });
  };

  const handleExtraTime1HChange = async (val: string) => {
    setExtraTime1H(val);
    await updateMatchInfoOnServer({ extraTime1H: val });
  };

  const handleExtraTime2HChange = async (val: string) => {
    setExtraTime2H(val);
    await updateMatchInfoOnServer({ extraTime2H: val });
  };

  const handleAddUpcomingMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upHome || !upAway) return;

    setSaveStatus("Ajout...");
    try {
      const payload = {
        id: 'up-' + Date.now(),
        date: upDate || 'Aujourd\'hui',
        time: upTime || 'Direct',
        homeTeam: upHome,
        awayTeam: upAway,
        homeTeamFlag: upHomeFlag,
        awayTeamFlag: upAwayFlag,
        competition: upComp || 'Match Amical',
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
        setUpHome('');
        setUpAway('');
        setUpHomeFlag('⚽');
        setUpAwayFlag('⚽');
        setUpDate('Aujourd\'hui');
        setUpTime('Direct');
        setSaveStatus("Ajouté !");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (err) {
      setSaveStatus("Erreur");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDeleteUpcomingMatch = async (id: string) => {
    setSaveStatus("Suppression...");
    try {
      const nextList = customUpcomingMatches.filter(m => m.id !== id);
      const res = await fetch('/api/admin/upcoming-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextList)
      });

      if (res.ok) {
        setSaveStatus("Supprimé !");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (err) {
      setSaveStatus("Erreur");
      setTimeout(() => setSaveStatus(null), 3000);
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
    <div className="w-full relative z-35 bg-[#111111] border-t border-white/10" id="control-dashboard-panel">
      {/* Toggle Bar Header */}
      <div className="max-w-[1920px] mx-auto px-6 py-2 flex items-center justify-between border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-red animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
            RÉGIE DE CONTRÔLE 100% MANUEL ET TEMPS RÉEL (SANS API-FOOTBALL)
            {saveStatus && (
              <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] uppercase font-black animate-pulse">
                {saveStatus}
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open(window.location.origin + window.location.pathname + '?admin=true', '_blank')}
            className="text-[10.5px] font-mono font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
          >
            💻 Ouvrir Compo Tactique (Full)
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-brand-red/20 hover:bg-brand-red/40 border border-brand-red/30 text-rose-400 font-mono text-[10px] uppercase font-bold py-1 px-3.5 rounded-lg active:scale-95 duration-100 cursor-pointer"
          >
            {isOpen ? "Masquer la Régie [-]" : "Ouvrir la Régie [+]"}
          </button>
        </div>
      </div>

      {/* Main Panel Content with collapsibility */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-w-[1920px] mx-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-gradient-to-b from-neutral-900/60 to-[#050505]/95">
              
              {/* BLOCK 1: TÉLÉCOMMANDE DU SCORE & TEMPS (Columns 1-4) */}
              <div ref={timerContainerRef} className="lg:col-span-4 bg-[#1C1C1C] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                    <Clock className="w-3.5 h-3.5 text-brand-red shrink-0" />
                    <span className="text-xs font-mono font-black text-white uppercase">TÉLÉCOMMANDE DU DIRECT</span>
                  </div>

                  {/* SCORE CLICKERS */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-black/45 p-3 rounded-xl border border-white/5 relative">
                      <div className="text-[10px] font-mono text-slate-400 truncate font-black mb-1">
                        {homeName || "Domicile"}
                      </div>
                      <div className="font-mono text-4xl font-black text-white py-1">
                        {match.homeScore}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => handleScoreChange('home', 1)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> +1
                        </button>
                        <button
                          onClick={() => handleScoreChange('home', -1)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-slate-400 p-1.5 rounded-lg font-bold text-xs cursor-pointer"
                          title="Annuler goal"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/45 p-3 rounded-xl border border-white/5 relative">
                      <div className="text-[10px] font-mono text-slate-400 truncate font-black mb-1">
                        {awayName || "Visiteur"}
                      </div>
                      <div className="font-mono text-4xl font-black text-white py-1">
                        {match.awayScore}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => handleScoreChange('away', 1)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> +1
                        </button>
                        <button
                          onClick={() => handleScoreChange('away', -1)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-slate-400 p-1.5 rounded-lg font-bold text-xs cursor-pointer"
                          title="Annuler goal"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TIMER SECTION */}
                  <div ref={timerContainerRef} className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">CHRONOMÈTRE DIRECT</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                          {String(minute).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Half selector buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handleSetFirstHalf}
                        className={`py-1.5 rounded font-mono text-[10px] font-bold duration-100 cursor-pointer border ${
                          status === '1H'
                            ? 'bg-brand-red text-white border-brand-red shadow-lg'
                            : 'bg-zinc-900 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        ⚽ 1er Mi-temps
                      </button>
                      <button
                        type="button"
                        onClick={handleSetSecondHalf}
                        className={`py-1.5 rounded font-mono text-[10px] font-bold duration-100 cursor-pointer border ${
                          status === '2H'
                            ? 'bg-brand-red text-white border-brand-red shadow-lg'
                            : 'bg-zinc-900 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        ⚽ 2nd Mi-temps
                      </button>
                    </div>

                    {/* Start/Pause and Reset buttons */}
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleTimerToggle}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer text-white duration-100 ${
                          isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlaying ? 'Pause' : 'Commencer'}
                      </button>
                      <button
                        type="button"
                        onClick={handleTimerReset}
                        className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer duration-100"
                        title="Reset chronomètre"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Adjust inputs for min and sec */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <div className="text-[8px] font-mono text-slate-500 font-bold mb-0.5 uppercase">Min</div>
                        <input 
                          id="input-timer-min"
                          type="number" 
                          value={minute}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setMinute(val);
                            updateMatchInfoOnServer({ minute: val });
                          }}
                          placeholder="Min"
                          className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-xs text-center font-mono text-white focus:outline-none focus:border-brand-red/40"
                        />
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-slate-500 font-bold mb-0.5 uppercase">Sec</div>
                        <input 
                          id="input-timer-sec"
                          type="number" 
                          value={seconds}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setSeconds(val);
                            updateMatchInfoOnServer({ seconds: val });
                          }}
                          placeholder="Sec"
                          className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-xs text-center font-mono text-white focus:outline-none focus:border-brand-red/40"
                        />
                      </div>
                    </div>

                    {/* Extra time Inputs */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <div>
                        <div className="text-[8px] font-mono text-slate-500 font-bold mb-0.5 uppercase">T.A. 1ère Mi-temps</div>
                        <input 
                          id="input-extra-1h"
                          type="text" 
                          value={extraTime1H}
                          onChange={(e) => handleExtraTime1HChange(e.target.value)}
                          placeholder="Ex: +3"
                          className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-xs text-center font-mono text-amber-400 placeholder-slate-700 font-bold focus:outline-none focus:border-amber-400/50"
                        />
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-slate-500 font-bold mb-0.5 uppercase">T.A. 2nd Mi-temps</div>
                        <input 
                          id="input-extra-2h"
                          type="text" 
                          value={extraTime2H}
                          onChange={(e) => handleExtraTime2HChange(e.target.value)}
                          placeholder="Ex: +5"
                          className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-xs text-center font-mono text-amber-400 placeholder-slate-700 font-bold focus:outline-none focus:border-amber-400/50"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex gap-1 font-mono text-[9px] text-slate-500 justify-center">
                  <span>Match Period:</span>
                  {['UPCOMING', '1H', 'HT', '2H', 'FINISHED'].map((st) => (
                    <button
                      key={st}
                      onClick={async () => {
                        setStatus(st);
                        await updateMatchInfoOnServer({ status: st });
                      }}
                      className={`px-1 rounded uppercase font-bold cursor-pointer text-[8px] border ${
                        status === st ? 'bg-brand-red text-white border-brand-red' : 'text-slate-400 border-white/15'
                      }`}
                    >
                      {st === 'UPCOMING' ? 'À venir' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* BLOCK 2: IDENTITÉ DES ÉQUIPES & BUTEURS (Columns 5-8) */}
              <div ref={mainInfoContainerRef} className="lg:col-span-4 bg-[#1C1C1C] p-4 rounded-xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                    <Flag className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                    <span className="text-xs font-mono font-black text-white uppercase">INFOS MATCH PRINCIPAL</span>
                  </div>

                  {/* Team configuration rows */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Domicile details */}
                    <div className="space-y-2 p-2 bg-black/25 rounded-xl border border-white/5">
                      <div className="text-[8px] font-mono text-slate-500 font-bold uppercase">Domicile (Home)</div>
                      <input 
                        id="input-home-name"
                        type="text" 
                        value={homeName} 
                        onChange={(e) => {
                          setHomeName(e.target.value);
                          setIsMainInfoDirty(true);
                        }}
                        placeholder="Nom équipe" 
                        className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <input 
                          id="input-home-code"
                          type="text" 
                          value={homeCode} 
                          onChange={(e) => {
                            setHomeCode(e.target.value.toUpperCase());
                            setIsMainInfoDirty(true);
                          }}
                          placeholder="POR" 
                          maxLength={3}
                          className="w-full bg-black border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-white text-center"
                        />
                        <input 
                          id="input-home-logo"
                          type="text" 
                          value={homeLogo} 
                          onChange={(e) => {
                            setHomeLogo(e.target.value);
                            setIsMainInfoDirty(true);
                          }}
                          placeholder="🇵🇹" 
                          className="w-full bg-black border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          id="input-home-color"
                          type="color" 
                          value={homeColor} 
                          onChange={(e) => {
                            setHomeColor(e.target.value);
                            setIsMainInfoDirty(true);
                          }}
                          className="w-6 h-6 rounded border border-white/10 cursor-pointer p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{homeColor}</span>
                      </div>
                    </div>
 
                    {/* Visiteur details */}
                    <div className="space-y-2 p-2 bg-black/25 rounded-xl border border-white/5">
                      <div className="text-[8px] font-mono text-slate-500 font-bold uppercase">Visiteur (Away)</div>
                      <input 
                        id="input-away-name"
                        type="text" 
                        value={awayName} 
                        onChange={(e) => {
                          setAwayName(e.target.value);
                          setIsMainInfoDirty(true);
                        }}
                        placeholder="Nom équipe" 
                        className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <input 
                          id="input-away-code"
                          type="text" 
                          value={awayCode} 
                          onChange={(e) => {
                            setAwayCode(e.target.value.toUpperCase());
                            setIsMainInfoDirty(true);
                          }}
                          placeholder="COD" 
                          maxLength={3}
                          className="w-full bg-black border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-white text-center"
                        />
                        <input 
                          id="input-away-logo"
                          type="text" 
                          value={awayLogo} 
                          onChange={(e) => {
                            setAwayLogo(e.target.value);
                            setIsMainInfoDirty(true);
                          }}
                          placeholder="🇨🇩" 
                          className="w-full bg-black border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          id="input-away-color"
                          type="color" 
                          value={awayColor} 
                          onChange={(e) => {
                            setAwayColor(e.target.value);
                            setIsMainInfoDirty(true);
                          }}
                          className="w-6 h-6 rounded border border-white/10 cursor-pointer p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{awayColor}</span>
                      </div>
                    </div>
                  </div>
 
                </div>
 
                <div className="flex flex-col gap-2 shrink-0 pt-2 border-t border-white/5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">COMPÉTITION</span>
                    </div>
                    <input 
                      id="input-competition"
                      type="text" 
                      value={competition} 
                      onChange={(e) => {
                        setCompetition(e.target.value);
                        setIsMainInfoDirty(true);
                      }}
                      placeholder="Compétition (ex: Match Amical)" 
                      className="w-full bg-[#111] border border-white/10 rounded px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-brand-red/40"
                    />
                  </div>

                  <div className="flex gap-2 items-center justify-end pt-1">
                    {isMainInfoDirty && (
                      <button 
                        type="button" 
                        onClick={handleDiscardChanges}
                        className="bg-zinc-850 hover:bg-zinc-800 text-slate-300 border border-white/10 px-3 py-1 rounded text-[10px] cursor-pointer duration-75 font-mono font-bold"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={saveMainMatchInfo}
                      className={`text-[10px] font-bold px-4 py-1.5 rounded cursor-pointer duration-100 flex items-center gap-1.5 border font-mono ${
                        isMainInfoDirty 
                          ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse' 
                          : 'bg-zinc-100 hover:bg-white text-black border-transparent'
                      }`}
                    >
                      <Save className="w-3 h-3" /> Appliquer
                    </button>
                  </div>
                </div>
              </div>

              {/* BLOCK 3: MATCHS AU PROGRAMME ("AU PROGRAMME" LIST) (Columns 9-12) */}
              <div className="lg:col-span-4 bg-[#1C1C1C] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-mono font-black text-white uppercase">MATCHS AU PROGRAMME ({customUpcomingMatches.length})</span>
                    </div>

                    {/* Simple inputs to add upcoming match */}
                    <form onSubmit={handleAddUpcomingMatch} className="bg-black/35 p-2 rounded-xl border border-white/5 space-y-1.5 mb-2 text-left">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input 
                          type="text" 
                          value={upHome}
                          onChange={(e) => setUpHome(e.target.value)}
                          placeholder="Équipe Dom." 
                          className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[9.5px] text-white"
                          required
                        />
                        <input 
                          type="text" 
                          value={upAway}
                          onChange={(e) => setUpAway(e.target.value)}
                          placeholder="Équipe Vis." 
                          className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[9.5px] text-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <input 
                          type="text" 
                          value={upDate}
                          onChange={(e) => setUpDate(e.target.value)}
                          placeholder="Aujourd'hui" 
                          className="w-full bg-[#111] border border-white/10 rounded px-1.5 py-1 text-[9.5px] text-white font-mono text-center"
                        />
                        <input 
                          type="text" 
                          value={upTime}
                          onChange={(e) => setUpTime(e.target.value)}
                          placeholder="Direct" 
                          className="w-full bg-[#111] border border-white/10 rounded px-1.5 py-1 text-[9.5px] text-white font-mono text-center"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-[9.5px] uppercase rounded py-1 cursor-pointer duration-100 flex items-center justify-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Ajouter
                        </button>
                      </div>
                    </form>

                    {/* List of current upcoming matches */}
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {customUpcomingMatches.length === 0 ? (
                        <div className="text-center font-mono text-[9px] text-slate-500 py-3 italic">Aucun match au programme</div>
                      ) : (
                        customUpcomingMatches.map((m) => (
                          <div key={m.id} className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-white/5 text-[10px] text-slate-300">
                            <span className="font-sans truncate flex-1 pr-2">
                              {m.homeTeamFlag} {m.homeTeam} vs {m.awayTeam} {m.awayTeamFlag}
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[8.5px] text-slate-500">
                              <span>{m.date}</span>
                              <button 
                                type="button" 
                                onClick={() => handleDeleteUpcomingMatch(m.id)}
                                className="text-slate-500 hover:text-red-400 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                <div className="bg-black/40 p-1 rounded border border-white/5 text-[8.5px] font-mono text-slate-500 text-center uppercase tracking-wider mt-2.5">
                  Régie : Mode Saisie Manuelle Actif • Synchro Locale Immédiate
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini technical footer note */}
      <div className="bg-[#050505] py-2 px-6 text-center text-[10px] font-mono text-slate-500 select-none uppercase tracking-[0.2em] border-t border-white/10">
        Prêt pour l'intégration OBS / Streamlabs • Renault TV Cockpit v2.0.0
      </div>
    </div>
  );
}
