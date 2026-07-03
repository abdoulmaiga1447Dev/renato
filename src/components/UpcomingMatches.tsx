/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useMatchContext } from '../context/MatchContext';
import { Calendar, Eye, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UpcomingMatches() {
  const { 
    state: match, 
    upcomingMatches, 
    selectApiMatch, 
    selectedApiMatchId,
    pinnedMatchIds,
    isTokenSavingMode,
  } = useMatchContext();

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));

  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;

  // Helper to format viewer counts with space sep (15 151)
  const formatCount = (num: number | undefined | null) => {
    const safeNum = typeof num === 'number' && !isNaN(num) ? num : 0;
    return safeNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl p-2 sm:p-2.5 flex flex-col h-full shadow-lg relative overflow-hidden" id="upcoming-matches-widget">
      
      {/* Background soft blue highlight */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-2xl animate-pulse" />

      {/* Titled bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5 shrink-0 animate-fade-in" id="upcoming-title-bar">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-brand-blue" />
          <h2 className="font-display font-black text-[10px] sm:text-[11px] tracking-widest text-white uppercase leading-none">
            AU PROGRAMME
          </h2>
        </div>

        {/* Selected count badge */}
        <span className="font-mono font-black tracking-widest bg-brand-blue/15 border border-brand-blue/30 text-brand-blue px-2 py-0.5 rounded uppercase text-[8px]">
          {pinnedMatchIds.length} SÉLECTIONNÉ{pinnedMatchIds.length > 1 ? 'S' : ''}
        </span>
      </div>

      {/* Mode status line */}
      <div className="flex items-center justify-between mb-1.5 text-slate-400 font-mono text-[8.5px] shrink-0 select-none" id="upcoming-status-tag">
        <span className="font-extrabold uppercase tracking-widest">
          DIFFUSION SÉLECTIONNÉE
        </span>
        
        {/* Real-time sync / static token-saver state */}
        <span className="font-black pr-1 tracking-widest uppercase">
          {isTokenSavingMode ? (
            <span className="text-emerald-400 flex items-center gap-1" title="Mode statique actif">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              STATIQUE
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1 animate-pulse" title="Mise à jour en temps réel active">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              DIRECT ACTIVE
            </span>
          )}
        </span>
      </div>

      {/* Main Container section */}
      <div className="flex-1 flex flex-col min-h-0 relative" id="upcoming-interaction-stage">
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5 scrollbar-none" id="upcoming-list-group">
          {upcomingMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-6 text-center px-4 bg-white/[0.01] rounded-xl border border-white/5 border-dashed my-auto">
              <Calendar className="w-5 h-5 text-brand-blue/30 mb-2" />
              <p className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest leading-none">Aucun match programmé</p>
              <p className="text-[9px] font-mono text-slate-500 mt-1 max-w-[190px] leading-relaxed">
                Sélectionnez et figez les matchs à afficher depuis la régie de synchronisation (en bas de page).
              </p>
            </div>
          ) : (
            upcomingMatches.map((item, index) => {
              const isSelected = String(item.id) === String(selectedApiMatchId);
              return (
                <div 
                  key={item.id}
                  onClick={() => selectApiMatch(item.id)}
                  className={`group border rounded-xl duration-150 cursor-pointer select-none transition-all ${
                    isFullScreenView ? 'py-2 px-3' : 'py-1 px-2'
                  } ${
                    isSelected 
                      ? 'bg-brand-blue/10 border-brand-blue/60 shadow-[0_0_8px_rgba(37,99,235,0.12)] ring-1 ring-brand-blue/20' 
                      : 'bg-[#1C1C1C]/40 border-white/5 hover:border-brand-blue/35 hover:bg-white/[0.01]'
                  }`}
                  id={`upcoming-item-${index}`}
                >
                  <div className="flex items-center justify-between pointer-events-none mb-1.5">
                    <span className={`font-mono font-black text-slate-300 tracking-wider uppercase flex items-center gap-1 truncate max-w-[200px] ${
                      isFullScreenView ? 'text-xs' : 'text-[7.5px]'
                    }`}>
                      {item.competition}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-ping shrink-0" />}
                    </span>
                    <span className={`font-mono font-black rounded shrink-0 uppercase tracking-widest ${
                      isFullScreenView ? 'text-[9px] px-1.5 py-0.5' : 'text-[7px] px-1 py-0.5'
                    } ${
                      isSelected ? 'bg-brand-blue text-white shadow-md' : 'text-brand-blue bg-brand-blue/15 border border-brand-blue/10'
                    }`}>
                      {isSelected ? 'ACTIF ⭐' : item.date}
                    </span>
                  </div>

                  {/* Teams pairing flags & names */}
                  <div className="flex items-center justify-between pointer-events-none gap-1.5">
                    {/* Home Team */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className={`bg-[#222] rounded flex items-center justify-center border border-white/10 shadow-inner shrink-0 p-0.5 ${
                        isFullScreenView ? 'w-6.5 h-6.5' : 'w-5 h-5'
                      }`}>
                        {item.homeTeamFlag && (item.homeTeamFlag.startsWith('http') || item.homeTeamFlag.startsWith('data:')) ? (
                          <img src={item.homeTeamFlag} alt={item.homeTeam} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[9px] leading-none">{item.homeTeamFlag || "⚽"}</span>
                        )}
                      </span>
                      <span className={`font-display tracking-wide truncate ${
                        isFullScreenView ? 'text-xs font-black' : 'text-[9.5px] font-bold'
                      } ${
                        isSelected ? 'text-brand-blue font-black' : 'text-slate-200 group-hover:text-amber-250'
                      }`}>
                        {item.homeTeam}
                      </span>
                    </div>

                    {/* VS mark or live score */}
                    {item.status && ['IN_PLAY', 'LIVE', 'IN_PLAY_MOCK', '1H', '2H', 'HT', 'ET', 'P', 'BT', 'FINISHED', 'FT', 'AET', 'PEN'].includes(item.status) ? (
                      <span className={`font-mono font-black bg-brand-blue/15 border border-brand-blue/30 text-brand-blue rounded px-1.5 py-0.5 leading-none shrink-0 ${
                        isFullScreenView ? 'text-[11px]' : 'text-[8px]'
                      }`}>
                        {item.homeScore ?? 0} - {item.awayScore ?? 0}
                      </span>
                    ) : (
                      <span className="font-mono font-black text-slate-400 italic shrink-0 px-1 select-none text-[8px]">
                        vs
                      </span>
                    )}

                    {/* Away Team */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end text-right">
                      <span className={`font-display tracking-wide truncate ${
                        isFullScreenView ? 'text-xs font-black' : 'text-[9.5px] font-bold'
                      } ${
                        isSelected ? 'text-brand-blue font-black' : 'text-slate-200 group-hover:text-amber-250'
                      }`}>
                        {item.awayTeam}
                      </span>
                      <span className={`bg-[#222] rounded flex items-center justify-center border border-white/10 shadow-inner shrink-0 p-0.5 ${
                        isFullScreenView ? 'w-6.5 h-6.5' : 'w-5 h-5'
                      }`}>
                        {item.awayTeamFlag && (item.awayTeamFlag.startsWith('http') || item.awayTeamFlag.startsWith('data:')) ? (
                          <img src={item.awayTeamFlag} alt={item.awayTeam} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[9px] leading-none">{item.awayTeamFlag || "⚽"}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Social Streaming Statistics footer panel */}
        <div className="pt-1.5 mt-1.5 pb-0.5 border-t border-white/5 flex items-center justify-between bg-black/20 p-1.5 rounded-xl shrink-0" id="social-views-bar">
          {/* View Count Card (Eye icon with count) */}
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <AnimatePresence mode="popLayout">
              <motion.span 
                key={match.viewers}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 4, opacity: 0 }}
                className="font-mono font-black text-slate-200 tracking-wide select-none text-[10px]"
              >
                {formatCount(match.viewers)}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* separator */}
          <div className="w-px bg-white/10 h-3" />

          {/* Likes Count Card (ThumbsUp icon with count) */}
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
            <AnimatePresence mode="popLayout">
              <motion.span 
                key={match.likes}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 4, opacity: 0 }}
                className="font-mono font-black text-slate-200 tracking-wide select-none text-[10px]"
              >
                {formatCount(match.likes)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        
      </div>

    </div>
  );
}