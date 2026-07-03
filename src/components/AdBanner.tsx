/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAds } from '../context/MatchContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Gift, Coins, Tag } from 'lucide-react';

export default function AdBanner() {
  const { ads, currentAd, currentAdIndex } = useAds();
  const [copiedCode, setCopiedCode] = useState(false);

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));

  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;

  const handleCtaClick = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl shadow-lg relative flex flex-col h-full overflow-hidden" id="ad-banner-widget">

      {/* RENDER DYNAMIC BANNER BLOCK DESIGN 300x250 - fills the entire widget edge to edge */}
      <div className="flex-1 relative min-h-0 overflow-hidden" id="ad-banner-core">
        <AnimatePresence mode="wait" initial={false}>
          {currentAd ? (
            <motion.div
              key={currentAd.id}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 100, damping: 14 }}
              className="absolute inset-0 select-none bg-[#141414]/20 overflow-hidden"
            >
              {currentAd.imageUrl ? (
                <div className="absolute inset-0 w-full h-full relative">
                  <img 
                    src={currentAd.imageUrl} 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                    alt="Publicité" 
                    referrerPolicy="no-referrer"
                  />
                  {/* SLEEK PAGINATION OVERLAY AT THE BOTTOM FOR UPLOADED IMAGES */}
                  <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center gap-1.5 px-3 py-1 mx-auto bg-black/60 backdrop-blur-xs border border-white/5 rounded-full w-fit">
                    {ads.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === currentAdIndex 
                            ? 'w-4 bg-[#00E5FF]' 
                            : 'w-1 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${currentAd.bgColor || 'from-[#1E1E1E] to-[#121212]'} z-0`} />
                  
                  {/* CORE FLOATING CONTENT WRAPPER */}
                  <div className={`relative z-20 flex flex-col h-full justify-between ${isFullScreenView ? 'gap-2 p-1.5' : 'gap-1.5'}`}>
                    
                    {/* 1. HEADER ROW: SPONSOR BADGE & LIVE STATUS */}
                    <div className="flex items-center justify-between leading-none">
                      <span 
                        className="font-mono font-black tracking-wider px-2 py-1 rounded uppercase max-w-[170px] truncate shadow-sm border bg-white/5 border-white/10"
                        style={{ 
                          borderColor: currentAd.accentColor ? `${currentAd.accentColor}40` : 'rgba(255,255,255,0.15)',
                          color: currentAd.accentColor || '#00E5FF',
                          fontSize: isFullScreenView ? '10.5px' : '8px'
                        }}
                      >
                        {currentAd.sponsorName || 'PUB'} OFFICIEL
                      </span>

                      <div className={`flex items-center shrink-0 bg-black/50 rounded-full border border-white/5 ${isFullScreenView ? 'gap-1.5 px-2 py-1' : 'gap-1 px-1 py-0.5'}`}>
                        <span className={`font-mono text-slate-400 uppercase tracking-widest leading-none ${isFullScreenView ? 'text-[8.5px]' : 'text-[6.5px]'}`}>SPONSOR</span>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green"></span>
                        </span>
                      </div>
                    </div>

                    {/* 2. CENTER ICON (Only if no image, to make card look fantastic!) */}
                    <div className="flex-1 flex items-center justify-center py-2 shrink-0">
                      <div className={`rounded-full flex items-center justify-center border animate-pulse ${isFullScreenView ? 'w-14 h-14' : 'w-12 h-12'}`}
                           style={{ 
                             backgroundColor: currentAd.accentColor ? `${currentAd.accentColor}12` : 'rgba(255,255,255,0.02)',
                             borderColor: currentAd.accentColor ? `${currentAd.accentColor}30` : 'rgba(255,255,255,0.1)'
                           }}
                      >
                        {React.createElement(
                          (() => {
                            const sponsorUpper = (currentAd.sponsorName || '').toUpperCase();
                            if (sponsorUpper.includes('BET') || sponsorUpper.includes('WIN')) return Coins;
                            if (sponsorUpper.includes('STORE') || sponsorUpper.includes('MAILLOT') || sponsorUpper.includes('ACHET')) return Tag;
                            if (sponsorUpper.includes('ENERGY') || sponsorUpper.includes('VOLT') || sponsorUpper.includes('POWER')) return Sparkles;
                            return Gift;
                          })(),
                          { 
                            className: isFullScreenView ? "w-7 h-7" : "w-6 h-6", 
                            style: { color: currentAd.accentColor || '#EAB308' }
                          }
                        )}
                      </div>
                    </div>

                    {/* 3. DETAILS: TITLE, SUBTITLE & BADGE STACK */}
                    <div className="mt-auto space-y-1.5 flex-1 flex flex-col justify-center">
                      {currentAd.highlightText && (
                        <span 
                          className="font-mono font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-black/50 border inline-block w-fit leading-none uppercase text-shadow-sm"
                          style={{ 
                            borderColor: currentAd.accentColor || '#EAB308', 
                            color: currentAd.accentColor || '#EAB308',
                            fontSize: isFullScreenView ? '10px' : '7.5px'
                          }}
                        >
                          {currentAd.highlightText}
                        </span>
                      )}
                      
                      <h3 className={`font-display font-black text-white tracking-wide leading-tight uppercase line-clamp-2 ${
                        isFullScreenView ? 'text-sm sm:text-base md:text-lg font-black' : 'text-xs sm:text-sm'
                      }`}>
                        {currentAd.title}
                      </h3>
                      
                      {currentAd.subtitle && (
                        <p className={`font-sans text-slate-300 font-medium leading-snug line-clamp-2 ${
                          isFullScreenView ? 'text-[10px] sm:text-[11px]' : 'text-[9px] sm:text-[10px]'
                        }`}>
                          {currentAd.subtitle}
                        </p>
                      )}
                    </div>

                    {/* 4. CTA BUTTON & SLIDER FOOTER */}
                    <div className="space-y-2 shrink-0 pt-1 border-t border-white/5">
                      <button
                        onClick={handleCtaClick}
                        className={`w-full text-black hover:scale-[1.02] active:scale-95 duration-100 font-display font-black rounded-lg flex items-center justify-between shadow-xl cursor-pointer transition-all uppercase tracking-wider ${
                          isFullScreenView ? 'text-[10px] sm:text-[11.5px] py-2.5 px-3.5' : 'text-[9px] sm:text-[10.5px] py-2 px-3'
                        }`}
                        style={{ backgroundColor: currentAd.accentColor || '#EAB308' }}
                      >
                        <span className="truncate max-w-[90%]">{copiedCode ? "Copié !" : (currentAd.ctaText || 'REJOINDRE L\'OFFRE')}</span>
                        <ArrowRight className={`${isFullScreenView ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0`} />
                      </button>

                      {/* Slicing pagination dots */}
                      <div className="flex justify-center gap-1.5 py-0.5">
                        {ads.map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              i === currentAdIndex 
                                ? 'w-4 bg-white' 
                                : 'w-1 bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-[#151515] flex flex-col items-center justify-center p-4 text-slate-500 text-xs text-center font-mono font-bold">
              <span>AUCUNE PUBLICITÉ ACTIVE</span>
              <span className="text-[9px] font-normal text-slate-600 mt-1">Configurez vos images dans la Régie</span>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}