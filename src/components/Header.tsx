/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useMatchData } from '../context/MatchContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, HelpCircle, Laptop, Upload, X, Image } from 'lucide-react';

export default function Header() {
  const { match, homeTeam, awayTeam, homeScore, awayScore, minute, seconds, selectedApiMatchId, streamerLogo, setStreamerLogo, competitionImage, setCompetitionImage } = useMatchData();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const trophyFileInputRef = React.useRef<HTMLInputElement>(null);

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));
  
  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStreamerLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (!isFullScreenView && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStreamerLogo(null);
  };

  const handleTrophyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("L'image du trophée est trop volumineuse (max 1.5 Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompetitionImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerTrophyFileInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFullScreenView && trophyFileInputRef.current) {
      trophyFileInputRef.current.click();
    }
  };

  // Helper to format match clock normally as MM:SS
  const formatTime = (min: number, sec: number) => {
    const padMin = min < 10 ? `0${min}` : min;
    const padSec = sec < 10 ? `0${sec}` : sec;
    return `${padMin}:${padSec}`;
  };

  const getFormattedStartTime = (dateStr?: string) => {
    if (!dateStr) return "À VENIR";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "À VENIR";
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "À VENIR";
    }
  };

  const status = match?.status || 'IN_PLAY';

  // Find all goals
  const allGoals = (match.events || []).filter(e => e.type?.toLowerCase() === 'goal');
  const homeGoals = allGoals.filter(e => e.team?.toLowerCase() === 'home');
  const awayGoals = allGoals.filter(e => e.team?.toLowerCase() === 'away');

  return (
    <div className="w-full relative z-30 h-full flex flex-col" id="header-container">
      {/* Outer professional television bezel */}
      <div className="bg-gradient-to-b from-[#111111] to-[#050505] border-b-2 border-white/15 shadow-2xl relative flex-1 min-h-0">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-10 flex items-center justify-between h-full py-1 sm:py-2">
          
          {/* HOME TEAM - PORTUGAL */}
          <div className="flex items-center justify-between w-1/3 h-full gap-3 sm:gap-6" id="home-team-header-side">
            
            {/* STREAMER LOGO - UPLOAD ZONE */}
            <div className="flex items-center select-none shrink-0" id="streamer-logo-top-left">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={triggerFileInput}
                className={`relative group rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 transition-all duration-200 overflow-hidden shrink-0 flex items-center justify-center ${
                  isFullScreenView ? 'w-10 h-10 sm:w-14 sm:h-14 sm:rounded-2xl' : 'w-10 h-10 sm:w-14 sm:h-14 sm:rounded-2xl cursor-pointer'
                }`}
                title={isFullScreenView ? undefined : "Téléverser le logo de votre page"}
              >
                {streamerLogo ? (
                  <>
                    <img 
                      src={streamerLogo} 
                      alt="Logo Streamer" 
                      className="w-full h-full object-contain p-1 rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    {!isFullScreenView && (
                      <button 
                        onClick={removeLogo}
                        className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md z-10"
                        title="Supprimer le logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-1 text-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-white group-hover:scale-110 duration-150" />
                    {!isFullScreenView && (
                      <span className="text-[7px] sm:text-[8px] font-mono text-slate-500 group-hover:text-slate-300 uppercase mt-0.5 font-bold tracking-wider hidden xs:block">
                        LOGO LIVE
                      </span>
                    )}
                  </div>
                )}
                
                {/* Upload Hover Overlay */}
                {!isFullScreenView && streamerLogo && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* TEAM DETAILS */}
            <div className="flex flex-col items-end justify-center gap-1 flex-1 min-w-0 h-full">
              <div className="flex items-center gap-3 sm:gap-6 max-w-full justify-end">
                <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black font-display tracking-wider text-white uppercase truncate">
                   {homeTeam.name}
                </span>
              </div>
            </div>

          </div>

          {/* DYNAMIC TV SCOREBOARD BLOCK (MOCKUP COMPLIANT) */}
          <div className="flex flex-col items-center justify-center h-full relative" id="score-block-center">
            
            {/* Unified TV Scoreboard Bar */}
            <div className="flex items-stretch bg-[#111111] border border-white/10 rounded-lg shadow-2xl overflow-hidden h-8 sm:h-11 md:h-13" id="tv-score-bar">
              
              {/* HOME GROUP: Flag + Code with bottom Jersey Color line */}
              <div 
                className="flex items-stretch relative border-b-4 select-none" 
                style={{ borderColor: homeTeam.color || '#eab308' }}
              >
                {/* HOME TEAM FLAG (Slanted/Cropped) */}
                <div 
                  className="relative overflow-hidden w-9 sm:w-14 md:w-16 shrink-0 bg-slate-900" 
                  style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)' }}
                >
                  {homeTeam.logoUrl && (homeTeam.logoUrl.startsWith("http") || homeTeam.logoUrl.startsWith("data:")) ? (
                    <img 
                      src={homeTeam.logoUrl} 
                      alt={homeTeam.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-brand-red to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                      {homeTeam.code}
                    </div>
                  )}
                </div>

                {/* HOME TEAM CODE */}
                <div className="bg-black/90 px-2 sm:px-4 flex items-center justify-center border-r border-white/5 shrink-0">
                  <span className="font-sans font-extrabold text-[11px] sm:text-base md:text-lg text-white tracking-wider uppercase">
                    {homeTeam.code || 'POR'}
                  </span>
                </div>
              </div>

              {/* SCORE PILL CONTAINER (Gold/Bronze gradient with real-time scaling scores) */}
              <div className="relative px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2.5 sm:gap-4 md:gap-5 bg-gradient-to-r from-[#8a6f27] via-[#e8c86b] to-[#8a6f27] border-x border-white/20 select-none">
                
                {/* Home Score */}
                <span className="font-sans font-black text-sm sm:text-xl md:text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] min-w-[12px] text-center">
                  {homeScore}
                </span>

                {/* Center Trophy Rounded vertical capsule */}
                <div 
                  onClick={triggerTrophyFileInput}
                  className={`w-7 sm:w-11 md:w-13 bg-white rounded-lg py-0.5 px-1 flex flex-col items-center justify-center shadow-lg border border-white/80 z-20 shrink-0 transform -translate-y-[1px] ${
                    !isFullScreenView ? 'cursor-pointer hover:bg-slate-50 hover:scale-105 duration-100' : ''
                  }`}
                  title={!isFullScreenView ? "Cliquer pour téléverser l'image du trophée de la compétition" : undefined}
                >
                  <input 
                    type="file" 
                    ref={trophyFileInputRef} 
                    onChange={handleTrophyUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {competitionImage ? (
                    <img 
                      src={competitionImage} 
                      alt="Trophy" 
                      className="w-4 h-4 sm:w-7 sm:h-7 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Trophy className="w-4 h-4 sm:w-7 sm:h-7 text-[#d4af37] animate-pulse" />
                  )}
                  
                  <span className="text-[5px] sm:text-[7px] font-mono font-black text-black uppercase tracking-wider mt-0.5 leading-none">
                    {match.competition ? match.competition.substring(0, 5).toUpperCase() : 'FIFA'}
                  </span>
                </div>

                {/* Away Score */}
                <span className="font-sans font-black text-sm sm:text-xl md:text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] min-w-[12px] text-center">
                  {awayScore}
                </span>
                
              </div>

              {/* AWAY GROUP: Code + Flag with bottom Jersey Color line */}
              <div 
                className="flex items-stretch relative border-b-4 select-none" 
                style={{ borderColor: awayTeam.color || '#ef4444' }}
              >
                {/* AWAY TEAM CODE */}
                <div className="bg-black/90 px-2 sm:px-4 flex items-center justify-center border-l border-white/5 shrink-0">
                  <span className="font-sans font-extrabold text-[11px] sm:text-base md:text-lg text-white tracking-wider uppercase">
                    {awayTeam.code || 'RDC'}
                  </span>
                </div>

                {/* AWAY TEAM FLAG (Slanted/Cropped) */}
                <div 
                  className="relative overflow-hidden w-9 sm:w-14 md:w-16 shrink-0 bg-slate-900" 
                  style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)' }}
                >
                  {awayTeam.logoUrl && (awayTeam.logoUrl.startsWith("http") || awayTeam.logoUrl.startsWith("data:")) ? (
                    <img 
                      src={awayTeam.logoUrl} 
                      alt={awayTeam.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-400 to-yellow-400 flex items-center justify-center text-white font-bold text-xs">
                      {awayTeam.code}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* GOALSCORERS REMOVED AS REQUESTED */}

          </div>

          {/* AWAY TEAM - RD CONGO */}
          <div className="flex flex-col items-start w-1/3 justify-center gap-1" id="away-team-header-side">
            <div className="flex items-center gap-3 sm:gap-6">
              <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black font-display tracking-wider text-white uppercase truncate">
                {awayTeam.name}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SUB HEADER TICKER BAR - EXACTLY AS DRAWN */}
      <div className="bg-[#050505] border-b border-white/10 px-4 h-6 sm:h-7 md:h-8 flex items-center justify-between shrink-0" id="sub-header-overlay-bar">
        <div className="max-w-[1920px] mx-auto w-full flex items-center justify-between h-full">
          
          {/* Match Venue / Competition Information Tag on the left */}
          <div className="flex items-center gap-2 max-w-[45%]" id="fixture-details-info">
            <div className="bg-brand-blue/10 border border-brand-blue/30 text-sky-450 text-[8px] sm:text-[9.5px] font-bold font-mono px-2 py-0.5 rounded flex items-center gap-1 shadow-sm shrink-0">
              <Trophy className="w-2.5 h-2.5 text-brand-blue animate-pulse" />
              <span className="uppercase tracking-wider truncate max-w-[130px] sm:max-w-[280px]">
                {match.competition || "SIGNAL DIRECT"}
              </span>
            </div>
            {selectedApiMatchId && (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                <span>FLUX TRANSMISSION STATS</span>
              </div>
            )}
          </div>

          {/* Matches center status ticker exactly as drawn */}
          <div className="flex justify-center" id="live-chronometer">
            <div className="bg-[#111111] text-white border border-white/10 font-mono font-black tracking-widest text-[9px] sm:text-xs px-4 py-1 rounded-lg flex items-center gap-2 hover:border-brand-blue duration-200 shadow-inner">
              {status === 'FINISHED' || status === 'FT' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                  <span className="text-brand-green uppercase font-black">TERMINÉ</span>
                </>
              ) : status === 'HALF_TIME' || status === 'HT' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-brand-green uppercase font-black">MI-TEMPS</span>
                </>
              ) : status === 'UPCOMING' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-slate-400 font-bold uppercase">À VENIR</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
                  <span className="text-brand-green font-mono font-black tracking-widest text-[10px] sm:text-xs flex items-center">
                    {formatTime(minute, seconds)}
                    {status === '2H' ? (
                      match.extraTime2H && (
                        <span className="text-amber-400 font-extrabold ml-1.5 animate-pulse" style={{ textShadow: '0 0 8px rgba(245, 158, 11, 0.7)' }}>
                          {String(match.extraTime2H).startsWith('+') ? match.extraTime2H : `+${match.extraTime2H}`}
                        </span>
                      )
                    ) : (
                      match.extraTime1H && (
                        <span className="text-amber-400 font-extrabold ml-1.5 animate-pulse" style={{ textShadow: '0 0 8px rgba(245, 158, 11, 0.7)' }}>
                          {String(match.extraTime1H).startsWith('+') ? match.extraTime1H : `+${match.extraTime1H}`}
                        </span>
                      )
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right side live stats alert label */}
          <div className="flex items-center gap-2 justify-end min-w-[120px] sm:min-w-[200px]" id="active-event-overlay-badge">
            <AnimatePresence mode="popLayout">
              {match.currentEvent && (
                <motion.div
                  key={match.currentEvent.id}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-brand-blue/15 border border-brand-blue/50 text-sky-400 font-mono text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase font-black flex items-center gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-blue animate-pulse"></span>
                  <span>{match.currentEvent.player} ({match.currentEvent.minute}')</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}