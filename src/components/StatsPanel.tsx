/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStats, useMatchData } from '../context/MatchContext';
import { motion } from 'motion/react';
import { BarChart3, Activity } from 'lucide-react';

export default function StatsPanel() {
  const { stats, possession } = useStats();
  const { homeTeam, awayTeam, match, selectedApiMatchId } = useMatchData();

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));

  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;

  const hasStats = selectedApiMatchId && match?.hasRealStats;

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

  // Determine dynamic parameters based on current widget height
  let size = 50;
  let strokeWidth = 5.5;

  if (isFullScreenView) {
    if (height < 340) {
      size = 46;
      strokeWidth = 4.5;
    } else if (height < 450) {
      size = 60;
      strokeWidth = 6.0;
    } else {
      size = 76;
      strokeWidth = 8.0;
    }
  } else {
    if (height < 210) {
      size = 40;
      strokeWidth = 4.0;
    } else if (height < 250) {
      size = 46;
      strokeWidth = 5.0;
    } else {
      size = 50;
      strokeWidth = 5.5;
    }
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffsetHome = circumference - (possession / 100) * circumference;

  // Helper for double-sided progress bar split
  const renderSplitBar = (label: string, homeVal: number, awayVal: number) => {
    const total = homeVal + awayVal;
    const homePercent = total === 0 ? 50 : Math.round((homeVal / total) * 100);
    const awayPercent = 100 - homePercent;

    let rowClass = 'w-[90%] space-y-0.5';
    let labelTextClass = 'text-[11px] font-black tracking-wide';
    let homeValClass = 'w-6 text-[14px]';
    let awayValClass = 'w-6 text-[14px]';
    let labelMidClass = 'text-[9.5px] uppercase tracking-wider text-slate-450 select-none';
    let barClass = 'h-3 w-full rounded-full bg-slate-800 overflow-hidden flex gap-[1.5px]';

    if (isFullScreenView) {
      if (height < 340) {
        rowClass = 'w-[95%] space-y-0.5';
        labelTextClass = 'text-[10px] font-bold';
        homeValClass = 'w-8 text-[12px] font-black';
        awayValClass = 'w-8 text-[12px] font-black';
        labelMidClass = 'text-[9px] uppercase tracking-wider text-slate-450';
        barClass = 'h-2 w-full rounded-full bg-slate-800 overflow-hidden flex gap-[1px]';
      } else if (height < 450) {
        rowClass = 'w-[95%] space-y-0.5';
        labelTextClass = 'text-[11px] font-bold';
        homeValClass = 'w-10 text-[14px] font-black';
        awayValClass = 'w-10 text-[14px] font-black';
        labelMidClass = 'text-[10px] text-slate-350 uppercase tracking-wider';
        barClass = 'h-2 w-full rounded-full bg-slate-800 overflow-hidden flex gap-[1.5px]';
      } else {
        rowClass = 'w-full space-y-0.5';
        labelTextClass = 'text-xs font-bold';
        homeValClass = 'w-12 text-lg font-black';
        awayValClass = 'w-12 text-lg font-black';
        labelMidClass = 'text-[11px] font-bold tracking-wider text-slate-300';
        barClass = 'h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex gap-[1.5px]';
      }
    } else {
      if (height < 210) {
        rowClass = 'w-[95%] space-y-0.5';
        labelTextClass = 'text-[9.5px] font-black';
        homeValClass = 'w-5 text-[11px]';
        awayValClass = 'w-5 text-[11px]';
        labelMidClass = 'text-[8.5px] uppercase tracking-wider text-slate-450';
        barClass = 'h-2 w-full rounded-full bg-slate-800 overflow-hidden flex gap-[1px]';
      } else if (height < 250) {
        rowClass = 'w-[92%] space-y-0.5';
        labelTextClass = 'text-[10.5px] font-black';
        homeValClass = 'w-6 text-[13px]';
        awayValClass = 'w-6 text-[13px]';
        labelMidClass = 'text-[9px] uppercase tracking-wider text-slate-450';
        barClass = 'h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex gap-[1.5px]';
      }
    }

    return (
      <div className={`shrink-0 mx-auto ${rowClass}`} id={`stat-row-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {/* Metric Label Row */}
        <div className={`flex items-center justify-between font-mono text-slate-100 ${labelTextClass}`}>
          <span className={`font-black text-[#10B981] text-left ${homeValClass}`}>{homeVal}</span>
          <span className={`${labelMidClass}`}>{label}</span>
          <span className={`font-black text-[#EF4444] text-right ${awayValClass}`}>{awayVal}</span>
        </div>

        {/* Dual Split Bar styling */}
        <div className={barClass}>
          <motion.div 
            initial={{ width: "50%" }}
            animate={{ width: `${homePercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            className="h-full bg-brand-green rounded-l-full"
          />
          <motion.div 
            initial={{ width: "50%" }}
            animate={{ width: `${awayPercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            className="h-full bg-brand-red rounded-r-full"
          />
        </div>
      </div>
    );
  };

  // Outer padding classes
  let outerPaddingClass = 'p-2 sm:p-2.5';
  let headerSpacingClass = 'pb-1.5 mb-1.5';
  let logoSizeClass = 'w-5 h-5';
  let liveDotClass = 'h-2.5 w-2.5';
  let headerTitleClass = 'text-[11px] sm:text-xs';

  if (isFullScreenView) {
    if (height < 340) {
      outerPaddingClass = 'p-2';
      headerSpacingClass = 'pb-1 mb-1';
      logoSizeClass = 'w-5 h-5';
      liveDotClass = 'h-2.5 w-2.5';
      headerTitleClass = 'text-[10px]';
    } else if (height < 450) {
      outerPaddingClass = 'p-2.5';
      headerSpacingClass = 'pb-1 mb-1';
      logoSizeClass = 'w-6 h-6';
      liveDotClass = 'h-2.5 w-2.5';
      headerTitleClass = 'text-xs';
    } else {
      outerPaddingClass = 'p-3.5 sm:p-4';
      headerSpacingClass = 'pb-1.5 mb-2';
      logoSizeClass = 'w-7 h-7';
      liveDotClass = 'h-3 w-3 mr-1.5';
      headerTitleClass = 'text-sm font-black';
    }
  } else {
    if (height < 210) {
      outerPaddingClass = 'p-1.5';
      headerSpacingClass = 'pb-1 mb-1';
      logoSizeClass = 'w-4 h-4';
      liveDotClass = 'h-2 w-2';
      headerTitleClass = 'text-[9.5px]';
    }
  }

  return (
    <div ref={containerRef} className={`backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl flex flex-col h-full shadow-xl relative overflow-hidden ${outerPaddingClass}`} id="stats-panel-widget">
      
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/3 rounded-full blur-2xl" />

      {/* Header with live pulsing dot */}
      <div className={`flex items-center justify-between border-b border-white/10 shrink-0 ${headerSpacingClass}`} id="stats-panel-header">
        <div className="flex items-center gap-2">
          {/* Live pulsing dot */}
          <span className={`relative flex shrink-0 ${liveDotClass}`}>
            <span className="pulsing-dot absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
            <span className={`relative inline-flex rounded-full bg-[#EF4444] ${liveDotClass}`}></span>
          </span>
          <h2 className={`font-display font-black tracking-widest text-white uppercase leading-none ${headerTitleClass}`}>
            LIVE STATISTIQUES
          </h2>
        </div>

        {/* Small Flag symbols */}
        <div className={`flex items-center bg-[#1C1C1C] rounded border border-white/5 shrink-0 ${isFullScreenView ? 'gap-2 px-3 py-1.5 border-white/10' : 'gap-1 px-1.5 py-0.5'}`}>
          <span className="flex items-center justify-center shrink-0" title={homeTeam.name}>
            {homeTeam.logoUrl && (homeTeam.logoUrl.startsWith("http") || homeTeam.logoUrl.startsWith("data:")) ? (
              <img src={homeTeam.logoUrl} className={`${logoSizeClass} object-contain rounded-md`} referrerPolicy="no-referrer" alt={homeTeam.name} />
            ) : (
              <span className="text-xs">{homeTeam.logoUrl}</span>
            )}
          </span>
          <span className="font-mono text-slate-450 uppercase select-none text-[8px] sm:text-[9px] px-0.5">vs</span>
          <span className="flex items-center justify-center shrink-0" title={awayTeam.name}>
            {awayTeam.logoUrl && (awayTeam.logoUrl.startsWith("http") || awayTeam.logoUrl.startsWith("data:")) ? (
              <img src={awayTeam.logoUrl} className={`${logoSizeClass} object-contain rounded-md`} referrerPolicy="no-referrer" alt={awayTeam.name} />
            ) : (
              <span className="text-xs">{awayTeam.logoUrl}</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden" id="stats-scroller">
          {/* Possession Circular Ring chart in a safe, non-overflowing flex layout */}
          <div className={`flex items-center justify-center gap-4 sm:gap-6 shrink-0 ${
            isFullScreenView 
              ? height < 340 ? 'py-0.5 my-0.5' : height < 450 ? 'py-1 my-0.5' : 'py-1.5 my-1' 
              : 'py-0.5 my-0.5'
          }`} id="possession-ring-section">
            
            {/* Left Large Green Percentage Label */}
            <div className={`font-display font-black text-[#10B981] select-none text-right tracking-tight shrink-0 ${
              isFullScreenView 
                ? height < 340 ? 'text-[13px] w-10' : height < 450 ? 'text-base w-14' : 'text-2xl w-20' 
                : 'text-[13px] w-10'
            }`}>
              {possession}%
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
              
              {/* SVG ring */}
              <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background Circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="var(--color-brand-red)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Foreground Circle */}
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="var(--color-brand-green)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: strokeDashoffsetHome }}
                  transition={{ type: "spring", stiffness: 60 }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Text in the absolute center */}
              <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className={`font-mono font-black text-slate-350 tracking-widest ${
                  isFullScreenView 
                    ? height < 340 ? 'text-[8.5px]' : height < 450 ? 'text-[10px]' : 'text-xs' 
                    : 'text-[10px]'
                }`}>POSS.</span>
              </div>

            </div>

            {/* Right Large Red Percentage Label */}
            <div className={`font-display font-black text-[#EF4444] select-none text-left tracking-tight shrink-0 ${
              isFullScreenView 
                ? height < 340 ? 'text-[13px] w-10' : height < 450 ? 'text-base w-14' : 'text-2xl w-20' 
                : 'text-[13px] w-10'
            }`}>
              {100 - possession}%
            </div>

          </div>

          {/* Numerical Stats rows */}
          <div className={`shrink-0 flex flex-col ${
            isFullScreenView 
              ? height < 340 ? 'space-y-0.5 my-0.5' : height < 450 ? 'space-y-1 my-1' : 'space-y-1.5 my-1.5' 
              : 'space-y-0.5 mt-0.5'
          }`} id="stats-records-list">
            {renderSplitBar("TIRS (TOTAL)", stats.tirsTotal[0], stats.tirsTotal[1])}
            {renderSplitBar("TIRS CADRÉS", stats.tirsCadres[0], stats.tirsCadres[1])}
            {renderSplitBar("FAUTES", stats.fautes[0], stats.fautes[1])}
            {renderSplitBar("CORNERS", stats.corners[0], stats.corners[1])}
          </div>

          {/* Cards indicators block */}
          <div className={`border-t border-white/10 flex justify-around shrink-0 ${
            isFullScreenView 
              ? height < 340 ? 'pt-0.5 mt-0.5 pb-0.5' : height < 450 ? 'pt-1 mt-1 pb-0.5' : 'pt-1.5 mt-1.5 pb-0.5' 
              : 'pt-1.5 mt-1.5'
          }`} id="cards-stats-box">
            
            {/* Yellow Cards Split */}
            <div className="text-center">
              <span className={`font-mono uppercase text-slate-400 block mb-1 leading-none ${
                isFullScreenView 
                  ? height < 340 ? 'text-[8.5px] font-bold mb-0.5' : height < 450 ? 'text-[9.5px] font-bold mb-1' : 'text-xs font-bold mb-1 tracking-wider' 
                  : 'text-[8.5px] font-bold mb-0.5'
              }`}>CARTONS J.</span>
              <div className={`flex items-center justify-center bg-[#1C1C1C] rounded-lg border border-white/10 ${
                isFullScreenView 
                  ? height < 340 ? 'py-0.5 px-2.5 gap-1' : height < 450 ? 'py-1 px-3.5 gap-1.5' : 'py-1.5 px-5 gap-2.5' 
                  : 'py-0.5 px-2 gap-1 border-white/15'
              }`}>
                <span className={`font-black text-yellow-300 font-mono leading-none ${
                  isFullScreenView 
                    ? height < 340 ? 'text-[11px]' : height < 450 ? 'text-xs' : 'text-lg' 
                    : 'text-[13px]'
                }`}>{stats.cartonsJaunes[0]}</span>
                <div className={`bg-yellow-400 rounded-[1px] shadow-md ${
                  isFullScreenView 
                    ? height < 340 ? 'w-1.5 h-3' : height < 450 ? 'w-1.5 h-3.5' : 'w-2.5 h-4.5' 
                    : 'w-2 h-3.5'
                }`} />
                <span className={`font-black text-yellow-300 font-mono leading-none ${
                  isFullScreenView 
                    ? height < 340 ? 'text-[11px]' : height < 450 ? 'text-xs' : 'text-lg' 
                    : 'text-[13px]'
                }`}>{stats.cartonsJaunes[1]}</span>
              </div>
            </div>

            {/* Red Cards Split */}
            <div className="text-center">
              <span className={`font-mono uppercase text-slate-400 block mb-1 leading-none ${
                isFullScreenView 
                  ? height < 340 ? 'text-[8.5px] font-bold mb-0.5' : height < 450 ? 'text-[9.5px] font-bold mb-1' : 'text-xs font-bold mb-1 tracking-wider' 
                  : 'text-[8.5px] font-bold mb-0.5'
              }`}>CARTONS R.</span>
              <div className={`flex items-center justify-center bg-[#1C1C1C] rounded-lg border border-white/10 ${
                isFullScreenView 
                  ? height < 340 ? 'py-0.5 px-2.5 gap-1' : height < 450 ? 'py-1 px-3.5 gap-1.5' : 'py-1.5 px-5 gap-2.5' 
                  : 'py-0.5 px-2 gap-1 border-white/15'
              }`}>
                <span className={`font-black text-red-500 font-mono leading-none ${
                  isFullScreenView 
                    ? height < 340 ? 'text-[11px]' : height < 450 ? 'text-xs' : 'text-lg' 
                    : 'text-[13px]'
                }`}>{stats.cartonsRouges[0]}</span>
                <div className={`bg-red-600 rounded-[1px] shadow-md ${
                  isFullScreenView 
                    ? height < 340 ? 'w-1.5 h-3' : height < 450 ? 'w-1.5 h-3.5' : 'w-2.5 h-4.5' 
                    : 'w-2 h-3.5'
                }`} />
                <span className={`font-black text-red-500 font-mono leading-none ${
                  isFullScreenView 
                    ? height < 340 ? 'text-[11px]' : height < 450 ? 'text-xs' : 'text-lg' 
                    : 'text-[13px]'
                }`}>{stats.cartonsRouges[1]}</span>
              </div>
            </div>
          </div>
        </div>

    </div>
  );
}