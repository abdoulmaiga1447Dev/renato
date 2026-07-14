/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useMatchContext } from '../context/MatchContext';
import { 
  Smartphone, Plus, Minus, Users, Calendar, Settings, 
  Check, RotateCcw, Upload, Clock, Wifi, UserPlus, 
  Trash2, Edit, Save, ArrowLeft, BarChart3, ChevronRight, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lineup, UpcomingMatch } from '../types';

export default function MobileController() {
  const {
    state: match,
    upcomingMatches,
    customLineups,
    setCustomLineups,
    customUpcomingMatches,
    setCustomUpcomingMatches,
    updateScore,
    updateTimer,
    togglePlay,
    triggerGoal,
    triggerEvent,
    setTeamProperty,
    resetSimulation,
    selectedApiMatchId,
    selectApiMatch,
    allSelectableMatches,
    isLoadingApi,
    streamSource,
    setStreamSource
  } = useMatchContext();

  const [activeTab, setActiveTab] = useState<'match' | 'lineups' | 'programme' | 'equipes'>('match');
  const [lineupTeam, setLineupTeam] = useState<'home' | 'away'>('home');
  const [selectedFormation, setSelectedFormation] = useState<string>(
    customLineups?.[lineupTeam]?.formation || "4-3-3"
  );

  // Scorer state for goal trigger

  // Local editing states for upcoming matches
  const [newMatchHome, setNewMatchHome] = useState('');
  const [newMatchAway, setNewMatchAway] = useState('');
  const [newMatchHomeFlag, setNewMatchHomeFlag] = useState('⚽');
  const [newMatchAwayFlag, setNewMatchAwayFlag] = useState('⚽');
  const [newMatchComp, setNewMatchComp] = useState('Match Amical');
  const [newMatchDate, setNewMatchDate] = useState('20:00');

  const fileInputHomeRef = useRef<HTMLInputElement>(null);
  const fileInputAwayRef = useRef<HTMLInputElement>(null);

  // Handle Logo Base64 Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, team: 'home' | 'away') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setTeamProperty(team, 'logoUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Formations coordinate definitions
  const formationCoords: Record<string, { x: number, y: number, position: "GK" | "DEF" | "MID" | "ATT" }[]> = {
    "4-3-3": [
      { x: 50, y: 90, position: "GK" },
      { x: 35, y: 72, position: "DEF" },
      { x: 65, y: 72, position: "DEF" },
      { x: 15, y: 65, position: "DEF" },
      { x: 85, y: 65, position: "DEF" },
      { x: 32, y: 46, position: "MID" },
      { x: 68, y: 46, position: "MID" },
      { x: 50, y: 32, position: "MID" },
      { x: 20, y: 18, position: "ATT" },
      { x: 80, y: 18, position: "ATT" },
      { x: 50, y: 10, position: "ATT" }
    ],
    "4-4-2": [
      { x: 50, y: 90, position: "GK" },
      { x: 35, y: 72, position: "DEF" },
      { x: 65, y: 72, position: "DEF" },
      { x: 15, y: 65, position: "DEF" },
      { x: 85, y: 65, position: "DEF" },
      { x: 32, y: 46, position: "MID" },
      { x: 68, y: 46, position: "MID" },
      { x: 15, y: 38, position: "MID" },
      { x: 85, y: 38, position: "MID" },
      { x: 38, y: 15, position: "ATT" },
      { x: 62, y: 15, position: "ATT" }
    ],
    "4-2-3-1": [
      { x: 50, y: 90, position: "GK" },
      { x: 35, y: 74, position: "DEF" },
      { x: 65, y: 74, position: "DEF" },
      { x: 15, y: 66, position: "DEF" },
      { x: 85, y: 66, position: "DEF" },
      { x: 35, y: 48, position: "MID" },
      { x: 65, y: 48, position: "MID" },
      { x: 20, y: 30, position: "MID" },
      { x: 50, y: 30, position: "MID" },
      { x: 80, y: 30, position: "MID" },
      { x: 50, y: 12, position: "ATT" }
    ],
    "3-5-2": [
      { x: 50, y: 90, position: "GK" },
      { x: 50, y: 74, position: "DEF" },
      { x: 25, y: 70, position: "DEF" },
      { x: 75, y: 70, position: "DEF" },
      { x: 50, y: 50, position: "MID" },
      { x: 28, y: 42, position: "MID" },
      { x: 72, y: 42, position: "MID" },
      { x: 15, y: 35, position: "MID" },
      { x: 85, y: 35, position: "MID" },
      { x: 38, y: 15, position: "ATT" },
      { x: 62, y: 15, position: "ATT" }
    ]
  };

  // Change formation for current team lineup
  const handleFormationChange = (form: string) => {
    setSelectedFormation(form);
    const coords = formationCoords[form];
    if (!coords) return;

    const currentLineup = customLineups[lineupTeam];
    const updatedPlayers = currentLineup.players.map((p, idx) => {
      const coord = coords[idx] || coords[coords.length - 1];
      return {
        ...p,
        position: coord.position,
        x: coord.x,
        y: coord.y
      };
    });

    const nextLineups = {
      ...customLineups,
      [lineupTeam]: {
        formation: form,
        players: updatedPlayers
      }
    };
    setCustomLineups(nextLineups);
  };

  // Edit single player details
  const handlePlayerChange = (playerIdx: number, field: 'name' | 'number', value: any) => {
    const currentLineup = customLineups[lineupTeam];
    const updatedPlayers = [...currentLineup.players];
    updatedPlayers[playerIdx] = {
      ...updatedPlayers[playerIdx],
      [field]: field === 'number' ? parseInt(value, 10) || 0 : value
    };

    const nextLineups = {
      ...customLineups,
      [lineupTeam]: {
        ...currentLineup,
        players: updatedPlayers
      }
    };
    setCustomLineups(nextLineups);
  };

  // Add custom upcoming match
  const handleAddUpcomingMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchHome.trim() || !newMatchAway.trim()) return;

    const newMatch: UpcomingMatch = {
      id: `custom-match-${Date.now()}`,
      homeTeam: newMatchHome,
      awayTeam: newMatchAway,
      homeTeamFlag: newMatchHomeFlag,
      awayTeamFlag: newMatchAwayFlag,
      competition: newMatchComp,
      date: newMatchDate,
      time: "Direct",
      status: "UPCOMING",
      homeScore: 0,
      awayScore: 0
    };

    setCustomUpcomingMatches([newMatch, ...customUpcomingMatches]);
    setNewMatchHome('');
    setNewMatchAway('');
    setNewMatchHomeFlag('⚽');
    setNewMatchAwayFlag('⚽');
  };

  // Delete upcoming match
  const handleDeleteUpcomingMatch = (id: string) => {
    setCustomUpcomingMatches(customUpcomingMatches.filter(m => m.id !== id));
  };

  // Quick Action Buttons
  const handleTriggerGoal = (team: 'home' | 'away') => {
    triggerGoal(team);
  };

  return (
    <div className="min-h-screen bg-[#060A13] text-slate-100 flex flex-col font-sans select-none" id="mobile-controller-view">
      
      {/* HEADER BANNER */}
      <div className="bg-[#0B1220]/90 border-b border-white/10 px-4 py-3 sticky top-0 z-50 backdrop-blur-md flex items-center justify-between shadow-md" id="mobile-header">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-brand-blue animate-pulse" />
          <div className="flex flex-col">
            <h1 className="font-display font-black text-xs tracking-wider text-white uppercase leading-none">
              RÉGIE MOBILE FOOTBALL
            </h1>
            <span className="text-[8px] font-mono font-bold text-slate-400 tracking-wider uppercase mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Synchronisation Directe Active
            </span>
          </div>
        </div>

        {/* Stream View Source Toggle for quick mobile debugging */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setStreamSource(streamSource === 'phone' ? 'greenscreen' : 'phone')}
            className={`text-[8px] font-mono font-black px-2 py-1 rounded cursor-pointer uppercase duration-150 ${
              streamSource === 'phone' ? 'bg-amber-500 text-black font-black' : 'text-slate-400'
            }`}
          >
            Camera {streamSource === 'phone' ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* CORE CONTROLLER AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" id="mobile-content-stage">
        
        {/* TAB BUTTONS */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#0B1220] p-1 rounded-xl border border-white/5 shadow-inner" id="mobile-tab-nav">
          <button
            onClick={() => setActiveTab('match')}
            className={`py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all duration-150 flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'match' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Scores
          </button>
          <button
            onClick={() => setActiveTab('lineups')}
            className={`py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all duration-150 flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'lineups' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Compos
          </button>
          <button
            onClick={() => setActiveTab('programme')}
            className={`py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all duration-150 flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'programme' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Programme
          </button>
          <button
            onClick={() => setActiveTab('equipes')}
            className={`py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all duration-150 flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'equipes' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Équipes
          </button>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: MATCH / SCORES */}
          {activeTab === 'match' && (
            <motion.div
              key="match-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
              id="tab-match-panel"
            >
              
              {/* CURRENT LIVE BOARD */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 relative shadow-lg overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />
                
                <span className="text-[8px] font-mono tracking-widest text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase font-black">
                  {match.competition || "MATCH PRINCIPAL"}
                </span>

                <div className="w-full flex items-center justify-between gap-2 mt-1">
                  
                  {/* Home Team Display */}
                  <div className="flex-1 flex flex-col items-center text-center min-w-0">
                    <div className="w-11 h-11 bg-black/40 rounded-full flex items-center justify-center border border-white/10 shadow-inner p-1 overflow-hidden shrink-0">
                      {match.homeTeam.logoUrl && (match.homeTeam.logoUrl.startsWith('http') || match.homeTeam.logoUrl.startsWith('data:')) ? (
                        <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xl leading-none">{match.homeTeam.logoUrl || "⚽"}</span>
                      )}
                    </div>
                    <span className="font-display font-black text-xs text-white uppercase mt-1.5 truncate w-full">
                      {match.homeTeam.name || "Domicile"}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">
                      DOMICILE
                    </span>
                  </div>

                  {/* SCORE VALUE */}
                  <div className="flex items-center gap-3 shrink-0 bg-black/30 border border-white/5 rounded-2xl px-4 py-2 font-mono">
                    <span className="text-3xl font-black text-emerald-400 leading-none">{match.homeScore}</span>
                    <span className="text-slate-600 font-bold">:</span>
                    <span className="text-3xl font-black text-brand-red leading-none">{match.awayScore}</span>
                  </div>

                  {/* Away Team Display */}
                  <div className="flex-1 flex flex-col items-center text-center min-w-0">
                    <div className="w-11 h-11 bg-black/40 rounded-full flex items-center justify-center border border-white/10 shadow-inner p-1 overflow-hidden shrink-0">
                      {match.awayTeam.logoUrl && (match.awayTeam.logoUrl.startsWith('http') || match.awayTeam.logoUrl.startsWith('data:')) ? (
                        <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xl leading-none">{match.awayTeam.logoUrl || "⚽"}</span>
                      )}
                    </div>
                    <span className="font-display font-black text-xs text-white uppercase mt-1.5 truncate w-full">
                      {match.awayTeam.name || "Extérieur"}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">
                      EXTÉRIEUR
                    </span>
                  </div>

                </div>

                {/* MATCH TIME PROGRESS & CLOCK */}
                <div className="w-full border-t border-white/5 pt-3 mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-blue" />
                    <span className="font-mono font-black text-sm text-white leading-none tracking-widest">
                      {String(match.minute).padStart(2, '0')}:{String(match.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[8.5px] font-mono bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded leading-none uppercase font-black">
                      {match.shortStatus || '1H'}
                    </span>
                  </div>

                  {/* Play / Pause Toggle button */}
                  <button 
                    onClick={togglePlay}
                    className={`text-[9.5px] font-mono font-black py-1 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer shadow border ${
                      match.isPlaying 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : 'bg-emerald-500 text-black border-emerald-400'
                    }`}
                  >
                    {match.isPlaying ? (
                      <>⏸️ PAUSE</>
                    ) : (
                      <>▶️ DÉMARRER</>
                    )}
                  </button>
                </div>
              </div>

              {/* DIRECT SCORE TOUCH CONTROLS */}
              <div className="grid grid-cols-2 gap-3" id="score-touch-pads">
                
                {/* Home controls */}
                <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3 flex flex-col gap-2 shadow">
                  <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {match.homeTeam.name || "DOMICILE"}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateScore('home', -1)}
                      className="bg-black/40 hover:bg-black/60 border border-white/5 py-3 rounded-xl flex items-center justify-center cursor-pointer text-slate-300"
                      title="Diminuer score"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => updateScore('home', 1)}
                      className="bg-brand-green text-black font-black py-3 rounded-xl flex items-center justify-center cursor-pointer shadow"
                      title="Augmenter score"
                    >
                      <Plus className="w-5 h-5 text-black font-black" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleTriggerGoal('home')}
                    className="w-full bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] font-mono font-black text-[10px] py-2.5 rounded-xl uppercase tracking-widest cursor-pointer mt-1"
                  >
                    ⚽ Triger But Dom
                  </button>
                </div>

                {/* Away controls */}
                <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3 flex flex-col gap-2 shadow">
                  <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {match.awayTeam.name || "EXTÉRIEUR"}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateScore('away', -1)}
                      className="bg-black/40 hover:bg-black/60 border border-white/5 py-3 rounded-xl flex items-center justify-center cursor-pointer text-slate-300"
                      title="Diminuer score"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => updateScore('away', 1)}
                      className="bg-brand-red text-white font-black py-3 rounded-xl flex items-center justify-center cursor-pointer shadow"
                      title="Augmenter score"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleTriggerGoal('away')}
                    className="w-full bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] font-mono font-black text-[10px] py-2.5 rounded-xl uppercase tracking-widest cursor-pointer mt-1"
                  >
                    ⚽ Triger But Ext
                  </button>
                </div>

              </div>

{/* [SUPPRIMÉ] Champ « Nom du buteur » retiré à la demande du client */}

              {/* QUICK STATS & EVENT INJECTOR */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3.5 space-y-2.5 shadow">
                <span className="font-display font-black text-[10px] tracking-wider text-white uppercase block border-b border-white/5 pb-1.5">
                  ÉVÉNEMENTS RAPIDES
                </span>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => triggerEvent('foul', 'home', undefined, 'Fautes commises')}
                    className="bg-slate-800 border border-white/5 py-2 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer"
                  >
                    💥 Faute Commise Dom
                  </button>
                  <button
                    onClick={() => triggerEvent('foul', 'away', undefined, 'Fautes commises')}
                    className="bg-slate-800 border border-white/5 py-2 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer"
                  >
                    💥 Faute Commise Ext
                  </button>
                </div>
              </div>

              {/* TIMELINE EVENTS HISTORY */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3.5 shadow">
                <span className="font-display font-black text-[10px] tracking-wider text-white uppercase block border-b border-white/5 pb-1.5 mb-2.5">
                  TIMELINE DES ÉVÉNEMENTS ({match.events.length})
                </span>
                
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-xs">
                  {match.events.length === 0 ? (
                    <p className="text-[9px] font-mono text-slate-500 uppercase text-center py-4">
                      Aucun événement pour le moment
                    </p>
                  ) : (
                    match.events.slice(0, 10).map((ev: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border-b border-white/[0.03] pb-1 font-mono text-[9px]">
                        <span className="text-brand-blue font-black">{ev.minute}'</span>
                        <span className="text-white truncate max-w-[150px] uppercase font-bold">{ev.player || ev.type}</span>
                        <span className="text-slate-500 truncate max-w-[120px]">{ev.description}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RESET BUTTON */}
              <button
                onClick={resetSimulation}
                className="w-full bg-red-950/20 border border-red-900/35 hover:bg-red-900/30 text-red-400 font-mono font-black text-[9px] py-3 rounded-xl uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Recommencer à Zéro (0-0)
              </button>

            </motion.div>
          )}

          {/* TAB 2: LINEUPS */}
          {activeTab === 'lineups' && (
            <motion.div
              key="lineups-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
              id="tab-lineups-panel"
            >
              {/* Team toggle for lineups */}
              <div className="grid grid-cols-2 gap-2 bg-[#050A14] p-1 border border-white/5 rounded-xl shadow-inner">
                <button
                  onClick={() => {
                    setLineupTeam('home');
                    setSelectedFormation(customLineups.home.formation);
                  }}
                  className={`py-2 text-[10.5px] font-mono font-black uppercase rounded-lg cursor-pointer ${
                    lineupTeam === 'home' ? 'bg-[#10B981] text-black shadow-md' : 'text-slate-400'
                  }`}
                >
                  🟢 DOMICILE ({match.homeTeam.name})
                </button>
                <button
                  onClick={() => {
                    setLineupTeam('away');
                    setSelectedFormation(customLineups.away.formation);
                  }}
                  className={`py-2 text-[10.5px] font-mono font-black uppercase rounded-lg cursor-pointer ${
                    lineupTeam === 'away' ? 'bg-[#EF4444] text-white shadow-md' : 'text-slate-400'
                  }`}
                >
                  🔴 EXTÉRIEUR ({match.awayTeam.name})
                </button>
              </div>

              {/* FORMATION CHANGER */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3.5 space-y-2.5 shadow">
                <span className="font-display font-black text-[10px] tracking-wider text-white uppercase block border-b border-white/5 pb-1.5">
                  CHOIX DE LA FORMATION
                </span>

                <div className="grid grid-cols-4 gap-2">
                  {["4-3-3", "4-4-2", "4-2-3-1", "3-5-2"].map((form) => (
                    <button
                      key={form}
                      onClick={() => handleFormationChange(form)}
                      className={`py-2 rounded-lg text-xs font-mono font-black cursor-pointer border transition-all ${
                        selectedFormation === form 
                          ? 'bg-brand-blue text-white border-brand-blue shadow' 
                          : 'bg-black/30 text-slate-400 border-white/5'
                      }`}
                    >
                      {form}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIST OF 11 PLAYERS FOR MANUALLY UPLOADED COMPOSITIONS */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3.5 space-y-3 shadow">
                <span className="font-display font-black text-[10px] tracking-wider text-white uppercase block border-b border-white/5 pb-1.5">
                  SÉLECTION DES 11 TITULAIRES
                </span>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {customLineups?.[lineupTeam]?.players?.map((player, idx) => (
                    <div key={player.id} className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl p-1.5">
                      {/* Position badge */}
                      <span className={`w-8 text-[9px] font-mono font-black rounded text-center py-1 select-none shrink-0 ${
                        player.position === 'GK' ? 'bg-[#D1A110] text-black' :
                        player.position === 'DEF' ? 'bg-blue-900 text-blue-200 border border-blue-800' :
                        player.position === 'MID' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                        'bg-red-950 text-red-400 border border-red-900'
                      }`}>
                        {player.position}
                      </span>

                      {/* Jersey number */}
                      <input
                        type="number"
                        value={player.number}
                        onChange={(e) => handlePlayerChange(idx, 'number', e.target.value)}
                        placeholder="N°"
                        className="w-10 bg-[#0B1220] border border-white/10 rounded-lg py-1 px-1 text-xs font-mono text-center text-white"
                      />

                      {/* Name input */}
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                        placeholder="NOM DU JOUEUR"
                        className="flex-1 bg-[#0B1220] border border-white/10 rounded-lg py-1 px-2.5 text-xs font-mono text-white"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-[8.5px] font-mono text-slate-500 uppercase leading-relaxed text-center mt-2">
                  La composition est enregistrée et transmise instantanément aux écrans et overlays de diffusion.
                </p>
              </div>

            </motion.div>
          )}

          {/* TAB 3: PROGRAMME */}
          {activeTab === 'programme' && (
            <motion.div
              key="programme-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
              id="tab-programme-panel"
            >
              
              {/* ADD NEW UPCOMING MATCH FORM */}
              <form onSubmit={handleAddUpcomingMatch} className="bg-[#0B1220] border border-white/5 rounded-2xl p-3.5 space-y-3 shadow">
                <span className="font-display font-black text-[10px] tracking-wider text-white uppercase block border-b border-white/5 pb-1.5">
                  AJOUTER UN MATCH AU PROGRAMME
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Éq. Domicile</label>
                    <input
                      type="text"
                      value={newMatchHome}
                      onChange={(e) => setNewMatchHome(e.target.value)}
                      placeholder="Portugal"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Éq. Extérieur</label>
                    <input
                      type="text"
                      value={newMatchAway}
                      onChange={(e) => setNewMatchAway(e.target.value)}
                      placeholder="RDC"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Drapeau Dom</label>
                    <input
                      type="text"
                      value={newMatchHomeFlag}
                      onChange={(e) => setNewMatchHomeFlag(e.target.value)}
                      placeholder="🇵🇹 ou URL"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Drapeau Ext</label>
                    <input
                      type="text"
                      value={newMatchAwayFlag}
                      onChange={(e) => setNewMatchAwayFlag(e.target.value)}
                      placeholder="🇨🇩 ou URL"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Compétition</label>
                    <input
                      type="text"
                      value={newMatchComp}
                      onChange={(e) => setNewMatchComp(e.target.value)}
                      placeholder="Euro 2026"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Heure/Date</label>
                    <input
                      type="text"
                      value={newMatchDate}
                      onChange={(e) => setNewMatchDate(e.target.value)}
                      placeholder="20:45"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-mono font-black text-[10px] py-2.5 rounded-xl uppercase tracking-widest cursor-pointer mt-1 flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Ajouter ce match
                </button>
              </form>

              {/* SCHEDULED PROGRAM LIST */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-3.5 space-y-2 shadow">
                <span className="font-display font-black text-[10px] tracking-wider text-white uppercase block border-b border-white/5 pb-1.5 mb-2.5">
                  LISTE DES MATCHS AU PROGRAMME ({customUpcomingMatches.length})
                </span>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {customUpcomingMatches.length === 0 ? (
                    <p className="text-[9px] font-mono text-slate-500 uppercase text-center py-6">
                      Aucun match programmé
                    </p>
                  ) : (
                    customUpcomingMatches.map((item) => {
                      const isCurrentlyActive = selectedApiMatchId === item.id;
                      return (
                        <div key={item.id} className={`bg-black/35 border rounded-xl p-2.5 flex items-center justify-between gap-3 ${
                          isCurrentlyActive ? 'border-brand-blue/60 ring-1 ring-brand-blue/25' : 'border-white/5'
                        }`}>
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="text-[7.5px] font-mono font-black text-slate-400 uppercase block tracking-wider leading-none">
                              {item.competition} • {item.date}
                            </span>
                            
                            <div className="flex items-center gap-1.5 min-w-0 mt-1">
                              <span className="text-xs truncate font-display font-black text-white max-w-[90px] uppercase">
                                {item.homeTeam}
                              </span>
                              <span className="text-[8px] font-mono font-bold text-slate-500">vs</span>
                              <span className="text-xs truncate font-display font-black text-white max-w-[90px] uppercase">
                                {item.awayTeam}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Load into Main controller */}
                            <button
                              onClick={() => selectApiMatch(item.id)}
                              className={`text-[8.5px] font-mono font-black py-1 px-2 rounded-lg cursor-pointer duration-150 border uppercase ${
                                isCurrentlyActive 
                                  ? 'bg-brand-blue border-brand-blue text-white' 
                                  : 'bg-black/40 border-white/10 hover:border-brand-blue/30 text-brand-blue'
                              }`}
                              title="Activer ce match pour l'administrer"
                            >
                              {isCurrentlyActive ? "Actif ⭐" : "Activer"}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUpcomingMatch(item.id)}
                              className="text-red-500 hover:text-red-400 bg-black/40 border border-white/10 p-1.5 rounded-lg cursor-pointer"
                              title="Supprimer du programme"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: EQUIPES */}
          {activeTab === 'equipes' && (
            <motion.div
              key="equipes-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
              id="tab-equipes-panel"
            >
              
              {/* HOME TEAM MANUAL CONFIGURATION */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-4 space-y-3.5 shadow">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full" />
                  <span className="font-display font-black text-[10.5px] tracking-wider text-white uppercase">
                    ÉQUIPE DOMICILE (MANUEL)
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Nom de l'équipe</label>
                    <input
                      type="text"
                      value={match.homeTeam.name}
                      onChange={(e) => setTeamProperty('home', 'name', e.target.value)}
                      placeholder="Ex: Portugal"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Code (3 let.)</label>
                      <input
                        type="text"
                        value={match.homeTeam.code}
                        maxLength={3}
                        onChange={(e) => setTeamProperty('home', 'code', e.target.value.toUpperCase())}
                        placeholder="Ex: POR"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-center text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Couleur Maillot</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={match.homeTeam.color || '#EF4444'}
                          onChange={(e) => setTeamProperty('home', 'color', e.target.value)}
                          className="w-9 h-8 bg-black/40 border border-white/10 rounded-lg p-0.5 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={match.homeTeam.color || '#EF4444'}
                          onChange={(e) => setTeamProperty('home', 'color', e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 text-[11px] font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo/Flag */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Logo ou Émoticône Drapeau</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={match.homeTeam.logoUrl}
                        onChange={(e) => setTeamProperty('home', 'logoUrl', e.target.value)}
                        placeholder="Ex: 🇵🇹 ou URL d'image"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                      
                      <input
                        type="file"
                        ref={fileInputHomeRef}
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'home')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputHomeRef.current?.click()}
                        className="bg-black/50 hover:bg-black/70 border border-white/10 text-slate-300 p-2 rounded-xl cursor-pointer shrink-0"
                        title="Uploader une image de logo"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AWAY TEAM MANUAL CONFIGURATION */}
              <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-4 space-y-3.5 shadow">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2.5 h-2.5 bg-[#EF4444] rounded-full" />
                  <span className="font-display font-black text-[10.5px] tracking-wider text-white uppercase">
                    ÉQUIPE EXTÉRIEUR (MANUEL)
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Nom de l'équipe</label>
                    <input
                      type="text"
                      value={match.awayTeam.name}
                      onChange={(e) => setTeamProperty('away', 'name', e.target.value)}
                      placeholder="Ex: RD Congo"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Code (3 let.)</label>
                      <input
                        type="text"
                        value={match.awayTeam.code}
                        maxLength={3}
                        onChange={(e) => setTeamProperty('away', 'code', e.target.value.toUpperCase())}
                        placeholder="Ex: RDC"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-center text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Couleur Maillot</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={match.awayTeam.color || '#2563EB'}
                          onChange={(e) => setTeamProperty('away', 'color', e.target.value)}
                          className="w-9 h-8 bg-black/40 border border-white/10 rounded-lg p-0.5 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={match.awayTeam.color || '#2563EB'}
                          onChange={(e) => setTeamProperty('away', 'color', e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 text-[11px] font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo/Flag */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 uppercase font-black">Logo ou Émoticône Drapeau</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={match.awayTeam.logoUrl}
                        onChange={(e) => setTeamProperty('away', 'logoUrl', e.target.value)}
                        placeholder="Ex: 🇨🇩 ou URL d'image"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                      
                      <input
                        type="file"
                        ref={fileInputAwayRef}
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'away')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputAwayRef.current?.click()}
                        className="bg-black/50 hover:bg-black/70 border border-white/10 text-slate-300 p-2 rounded-xl cursor-pointer shrink-0"
                        title="Uploader une image de logo"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>



            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}