/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLineup, useMatchData } from '../context/MatchContext';
import { Users, Shield, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const formatPlayerName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  
  const firstPart = parts[0];
  // Check if firstPart is an initial like "O.", "M.", "L.", "J.", etc. or just a single letter
  const isInitial = firstPart.length <= 2 && (firstPart.endsWith('.') || firstPart.length === 1);
  
  if (isInitial) {
    // If it's an initial, return the second part (e.g., "GARCIA" from "O. GARCIA")
    return parts[1] || firstPart;
  }
  
  // Otherwise return the first part (e.g., "Oscar" from "Oscar Garcia", "Vinicius" from "Vinicius Jr.")
  return firstPart;
};

export default function LineupBoard() {
  const { selectedTeamRef, lineup, setLineupTeam } = useLineup();
  const { homeTeam, awayTeam, match, selectedApiMatchId } = useMatchData();

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));

  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;

  const isHomeSelected = selectedTeamRef === 'home';
  const activeTeam = isHomeSelected ? homeTeam : awayTeam;

  const hasLineup = lineup && Array.isArray(lineup.players) && lineup.players.length > 0;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number>(isFullScreenView ? 480 : 250);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setHeight(containerRef.current.getBoundingClientRect().height);
      }
    };
    updateSize();
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const hasImage = hasLineup && !!lineup?.imageUrl;
  // Compact/edge-to-edge styling now applies whenever real data is shown (API players or an image),
  // not only when an uploaded image is present.
  const compact = hasLineup;

  return (
    <div ref={containerRef} className={`esports-panel flex flex-col h-full ${compact ? 'p-0' : 'p-2.5 sm:p-3'}`} id="lineup-board-widget">
      <div className="esports-panel-glow" style={{ zIndex: 25 }} />

      {/* Full-bleed composition image: fills the ENTIRE widget card, edge to edge, behind all other content */}
      {hasImage && (
        <img
          src={lineup!.imageUrl}
          alt={`Composition ${activeTeam.name}`}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}
      
      {/* 30-Second Auto-Rotation Progress Bar */}
      {hasLineup && (
        <div className="absolute top-0 inset-x-0 h-[3px] bg-white/5 pointer-events-none z-30">
          <motion.div 
            key={selectedTeamRef}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 30, ease: "linear" }}
            className="h-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.5)]"
          />
        </div>
      )}
      
      {/* Background shadow highlight */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

      {/* Header controls for toggle teams */}
      <div className={`flex items-center justify-between shrink-0 relative z-20 ${
        compact
          ? 'px-2.5 sm:px-3 pt-2.5 sm:pt-3 pb-3 mb-2 bg-gradient-to-b from-black/85 via-black/50 to-transparent'
          : 'esports-ribbon -mx-2.5 sm:-mx-3 -mt-2.5 sm:-mt-3 px-2.5 sm:px-3 py-2 mb-2 rounded-t-lg'
      }`} id="lineup-title-bar">
        {!compact && (
          <div className="flex items-center gap-1.5">
            <span className="esports-ribbon-stripes"><span /><span /><span /></span>
            {/* Numbers emblem icon */}
            <div className="bg-brand-green/20 text-brand-green text-[10px] sm:text-xs font-mono font-black w-5 h-5 rounded flex items-center justify-center shrink-0">
              22
            </div>
            <div>
              <h2 className="font-display font-black text-[10px] sm:text-xs tracking-widest text-white uppercase leading-none">
                COMPOSITIONS
              </h2>
              <span className="text-[7px] font-mono text-brand-green uppercase tracking-wider block mt-0.5 font-bold">
                ● ROTATION AUTO (30S)
              </span>
            </div>
          </div>
        )}

        {/* Small selector pills exactly as drawn with shields of Portugal/Congo */}
        <div className={`flex items-center bg-black/40 rounded-lg border border-white/10 ml-auto ${compact ? 'gap-0.5 p-0.5' : 'gap-1 p-1 rounded-xl'}`} id="lineup-teams-toggler shadow-inner">
          <button
            onClick={() => setLineupTeam('home')}
            style={isHomeSelected ? { backgroundColor: homeTeam.color, color: homeTeam.textColor || '#FFFFFF' } : {}}
            className={`rounded-md font-bold duration-155 uppercase flex items-center cursor-pointer ${
              compact ? 'text-[7px] p-1 px-1.5 gap-0.5' : 'text-[10px] p-1.5 px-3 rounded-lg gap-1.5'
            } ${
              isHomeSelected 
                ? 'shadow-md scale-102' 
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
            title={`Afficher ${homeTeam.name}`}
          >
            <span className={compact ? 'text-[9px]' : 'text-[12px]'}>{homeTeam.logoUrl && (homeTeam.logoUrl.startsWith('http') || homeTeam.logoUrl.startsWith('data:')) ? <img src={homeTeam.logoUrl} className={compact ? 'w-2.5 h-2.5 object-contain inline' : 'w-4 h-4 object-contain inline'} /> : homeTeam.logoUrl}</span>
            <span className={`font-mono tracking-wider font-black ${compact ? 'text-[8px]' : 'text-[11px]'}`}>{homeTeam.code}</span>
          </button>
          
          <button
            onClick={() => setLineupTeam('away')}
            style={!isHomeSelected ? { backgroundColor: awayTeam.color, color: awayTeam.textColor || '#FFFFFF' } : {}}
            className={`rounded-md font-bold duration-155 uppercase flex items-center cursor-pointer ${
              compact ? 'text-[7px] p-1 px-1.5 gap-0.5' : 'text-[10px] p-1.5 px-3 rounded-lg gap-1.5'
            } ${
              !isHomeSelected 
                ? 'shadow-md scale-102' 
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
            title={`Afficher ${awayTeam.name}`}
          >
            <span className={compact ? 'text-[9px]' : 'text-[12px]'}>{awayTeam.logoUrl && (awayTeam.logoUrl.startsWith('http') || awayTeam.logoUrl.startsWith('data:')) ? <img src={awayTeam.logoUrl} className={compact ? 'w-2.5 h-2.5 object-contain inline' : 'w-4 h-4 object-contain inline'} /> : awayTeam.logoUrl}</span>
            <span className={`font-mono tracking-wider font-black ${compact ? 'text-[8px]' : 'text-[11px]'}`}>{awayTeam.code}</span>
          </button>
        </div>
      </div>

      {/* COMPACTED VERTICAL FOOTBALL TACTICAL BOARD REPRESENTATION */}
      <div className={`flex-1 relative shadow-inner overflow-hidden flex flex-col justify-between z-10 ${
        compact ? '' : 'bg-black/40 hover:bg-black/35 rounded-2xl border border-white/10'
      }`} id="lineup-pitch-stage">
        
        {!hasLineup ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6" id="lineup-unavailable-overlay">
            <Shield className="w-10 h-10 text-amber-500/80 mb-2" />
            <h3 className="text-amber-500 font-display font-black text-xs tracking-widest uppercase">FEUILLE DE MATCH INDISPONIBLE</h3>
            <p className="text-[11px] font-mono text-slate-300 font-bold mt-1 max-w-[200px]">
              Aucun joueur défini
            </p>
          </div>
        ) : hasImage ? null : (
          <>
            {/* 3D Perspective Pitch Viewport */}
            <div 
              style={{ perspective: '450px', perspectiveOrigin: '50% 15%' }}
              className="absolute inset-0 w-full h-full overflow-hidden z-10"
              id="pitch-3d-perspective-viewport"
            >
              <div 
                style={{ 
                  transform: 'rotateX(26deg) scale(1.08) translateY(-4%)', 
                  transformStyle: 'preserve-3d',
                  background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.16)), repeating-linear-gradient(180deg, rgba(20, 20, 20, 0.15) 0px, rgba(20, 20, 20, 0.15) 20px, rgba(10, 10, 10, 0.35) 20px, rgba(10, 10, 10, 0.35) 40px)',
                }} 
                className="w-full h-full relative"
                id="pitch-3d-plane"
              >
                {/* Tactical Pitch background watermarks */}
                <div className="absolute inset-x-2 inset-y-4 border border-white/10 rounded-xl pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Center Line horizontal */}
                  <div className="absolute top-1/2 inset-x-0 h-px bg-white/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/10" />
                  
                  {/* Penalty box at the top */}
                  <div className="absolute top-0 left-[18%] right-[18%] h-14 border-b border-x border-white/10" />
                  <div className="absolute top-0 left-[34%] right-[34%] h-5 border-b border-x border-white/10" />

                  {/* Goal zone at the bottom */}
                  <div className="absolute bottom-0 left-[18%] right-[18%] h-14 border-t border-x border-white/10" />
                  <div className="absolute bottom-0 left-[34%] right-[34%] h-5 border-t border-x border-white/10" />
                </div>

                {/* Players container layer */}
                <div className="w-full h-full relative" id="players-tactical-layout" style={{ transformStyle: 'preserve-3d' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedTeamRef}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full relative"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {lineup?.players?.map((player) => {
                        // Determine player sizes dynamically based on the height of the LineupBoard widget
                        let jerseyClass = 'w-7 h-7 text-xs font-black';
                        let positionBadgeClass = '-top-1.5 -right-1.5 text-[7px] px-1 scale-90';
                        let namePillClass = 'text-[9px] max-w-[84px] py-0.5 px-1';

                        if (isFullScreenView) {
                          if (height < 320) {
                            jerseyClass = 'w-7 h-7 text-[10px] font-black';
                            positionBadgeClass = '-top-1 -right-1 text-[6.5px] px-0.5 scale-85';
                            namePillClass = 'text-[7.5px] max-w-[70px] mt-0.5 py-0 px-1';
                          } else if (height < 400) {
                            jerseyClass = 'w-9 h-9 text-xs font-black';
                            positionBadgeClass = '-top-1.5 -right-1.5 text-[7.5px] px-1 scale-90';
                            namePillClass = 'text-[9px] max-w-[95px] mt-1 py-0.5 px-1.5';
                          } else {
                            jerseyClass = 'w-11 h-11 text-sm sm:text-base shadow-emerald-500/10';
                            positionBadgeClass = '-top-1.5 -right-1.5 text-[8.5px] sm:text-[9.5px] px-1.5 py-0.5 scale-90 shadow-md';
                            namePillClass = 'text-[10px] sm:text-[11px] md:text-xs max-w-[125px] mt-1.5 py-1 px-2';
                          }
                        } else {
                          if (height < 210) {
                            jerseyClass = 'w-[22px] h-[22px] text-[8.5px] font-black border';
                            positionBadgeClass = '-top-1 -right-1 text-[5.5px] px-0.5 scale-80';
                            namePillClass = 'text-[7px] max-w-[65px] mt-0 py-0 px-0.5';
                          } else if (height < 250) {
                            jerseyClass = 'w-6 h-6 text-[10px] font-black';
                            positionBadgeClass = '-top-1 -right-1 text-[6.5px] px-0.5 scale-85';
                            namePillClass = 'text-[8px] max-w-[75px] mt-0.5 py-0 px-0.5';
                          }
                        }

                        return (
                          <div
                            key={player.id}
                            className="absolute flex flex-col items-center gap-0.5 group z-20 cursor-help"
                            style={{ 
                              left: `${player.x}%`, 
                              top: `${player.y}%`,
                              transform: 'translate3d(-50%, -50%, 0) rotateX(-26deg)',
                              transformStyle: 'preserve-3d'
                            }}
                            title={`${player.name} - Maillot #${player.number} (${player.position})`}
                          >
                            {/* Styled Player Jersey/Circle - TV broadcast size */}
                            <motion.div 
                              whileHover={{ scale: 1.15, zIndex: 30 }}
                              style={{ backgroundColor: activeTeam.color, color: activeTeam.textColor || '#FFFFFF' }}
                              className={`rounded-full border-2 border-white shadow-xl flex items-center justify-center font-mono font-black relative ${jerseyClass}`}
                            >
                              <span>{player.number}</span>
                              {/* Position badge */}
                              <span className={`absolute bg-black font-mono font-black text-yellow-400 rounded-md border border-white/10 ${positionBadgeClass}`}>
                                {player.position}
                              </span>
                            </motion.div>

                            {/* Player Surname Pill Name - Enlarged for mobile readability */}
                            <span className={`bg-black/95 text-white border border-white/10 leading-none rounded-md shadow-lg font-black text-center tracking-wide truncate group-hover:border-yellow-400 duration-150 uppercase ${namePillClass}`}>
                              {formatPlayerName(player.name)}
                            </span>

                          </div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* FOOTER STRATEGY FORMATION METADATA BANNER */}
            <div className={`absolute bottom-3 left-3 z-25 bg-black/85 border border-white/10 rounded-md flex items-center pointer-events-none ${
              isFullScreenView ? 'pl-3 pr-3.5 py-1 gap-2' : 'pl-2 pr-2.5 py-0.5 gap-1.5'
            }`}>
              <Award className={`text-brand-green ${isFullScreenView ? 'w-4 h-4' : 'w-3 h-3'}`} />
              <span className={`font-mono font-black text-slate-200 uppercase leading-none tracking-widest ${
                isFullScreenView ? 'text-[11px]' : 'text-[9px]'
              }`}>
                FOR : {lineup?.formation}
              </span>
            </div>
          </>
        )}

      </div>

    </div>
  );
}