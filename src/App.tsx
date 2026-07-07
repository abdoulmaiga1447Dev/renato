/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MatchProvider, useMatchContext, useMatchData } from './context/MatchContext';
import Header from './components/Header';
import Scoreboard from './components/Scoreboard';
import StatsPanel from './components/StatsPanel';
import UpcomingMatches from './components/UpcomingMatches';
import LiveCamera from './components/LiveCamera';
import LineupBoard from './components/LineupBoard';
import AdBanner from './components/AdBanner';
import CompetitionLogo from './components/CompetitionLogo';
import Footer from './components/Footer';
import TeamCard from './components/TeamCard';
import AdManager from './components/AdManager';
import AdminDashboard from './components/AdminDashboard';
import { LayoutGrid, Radio, Tv, Monitor, Image, X } from 'lucide-react';

function BroadcastGrid() {
  const { backgroundImage, setBackgroundImage } = useMatchData();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isAdminMode = typeof window !== 'undefined' && 
    (window.location.search.includes('admin=true') || window.location.hash.includes('admin=true'));

  if (isAdminMode) {
    return <AdminDashboard />;
  }

  const [bgUploadStatus, setBgUploadStatus] = useState<string>('');

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setBgUploadStatus('❌ Image trop grande (max 2 Mo)');
      setTimeout(() => setBgUploadStatus(''), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const image = reader.result;

      // Update local state/preview immediately
      setBackgroundImage(image);

      // Directly and reliably push to the server (bypasses any stale context closure issues)
      setBgUploadStatus('⏳ Envoi au serveur...');
      fetch('/api/sync/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundImage: image })
      })
        .then(res => {
          if (!res.ok) throw new Error('Serveur a répondu ' + res.status);
          return res.json();
        })
        .then(() => {
          setBgUploadStatus('✅ Image envoyée et synchronisée !');
          setTimeout(() => setBgUploadStatus(''), 4000);
        })
        .catch(err => {
          setBgUploadStatus('❌ Échec de l\'envoi : ' + err.message);
        });
    };
    reader.onerror = () => {
      setBgUploadStatus('❌ Impossible de lire le fichier');
    };
    reader.readAsDataURL(file);
  };

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));
  
  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  React.useEffect(() => {
    if (isOverlayMode) {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
    }
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, [isOverlayMode]);

  const isFullScreenView = isOverlayMode || isStudioMode;
  
  const [broadcasterMode, setBroadcasterMode] = useState<'both' | 'stream-only'>(
    isFullScreenView ? 'stream-only' : 'both'
  );

  // 100% borderless/console-free mode optimized specifically for OBS studio capture or direct browser tab capture
  if (isFullScreenView) {
    return (
      <div className={`w-full h-screen ${isOverlayMode ? 'bg-transparent' : 'bg-[#050505]'} font-sans relative text-white flex items-center justify-center overflow-hidden`} id="obs-overlay-view">
        
        {/* Full-screen Background Image with subtle elegant overlay */}
        {backgroundImage && (
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <img 
              src={backgroundImage} 
              alt="Custom Background" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
          </div>
        )}

        {/* FULL TELEVISION SCOREBOARD GOAL ALERT SYSTEM OVERLAY */}
        <Scoreboard />

        {/* ASPECT-VIDEO CONSTRAINED CONTAINER TO PRESERVE PROPORTIONS REGARDLESS OF THE VIEWPORT */}
        <div 
          style={{
            width: '100vw',
            height: '56.25vw',
            maxWidth: '177.78vh',
            maxHeight: '100vh',
          }}
          className="relative flex items-center justify-center overflow-hidden shrink-0" 
          id="obs-overlay-aspect-wrapper"
        >
          {/* UNIFIED DESIGN GRID (Header + 2 rows of widgets) */}
          <div className={`w-full h-full ${isOverlayMode ? 'bg-transparent' : (backgroundImage ? 'bg-transparent' : 'bg-[#050505]')} p-2 sm:p-3 overflow-hidden grid grid-rows-[16fr_42fr_42fr] grid-cols-[28fr_44fr_28fr] gap-2 sm:gap-3 relative z-10`} id="obs-overlay-grid">
            
            {/* HEADER ROW */}
            <div className="col-span-3 h-full min-h-0">
              <Header />
            </div>

            {/* ZONE CENTRALE (Row 2) */}
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="stats-panel-cell">
              <StatsPanel />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="live-camera-cell">
              <LiveCamera />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="lineup-board-cell">
              <LineupBoard />
            </div>

            {/* ZONE BASSE (Row 3) */}
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="upcoming-matches-cell">
              <UpcomingMatches />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="ad-banner-cell">
              <AdBanner />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="competition-logo-cell">
              <CompetitionLogo />
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans relative text-white" id="main-application-view">
      
      {/* FULL TELEVISION SCOREBOARD GOAL ALERT SYSTEM OVERLAY */}
      <Scoreboard />

      {/* COMPACT FLOATING IN-APP HEADER NOTES / MODE SELECTORS (NOT SEEN BY STREAM VIEWER) */}
      <div className="bg-[#111111] border-b border-white/10 py-2.5 px-6 flex flex-wrap items-center justify-between gap-4" id="top-broadcasting-bar">
        
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-brand-red animate-pulse" />
          <div className="flex flex-col">
            <span className="font-display font-black text-sm tracking-widest text-white uppercase flex items-center gap-1.5 leading-none">
              COCKPIT DE REALISATION DIRECTE
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-500 tracking-[0.15em] uppercase mt-0.5">
              Diffusion de Matchs de Football - Conçu pour les flux OBS, TikTok et YouTube
            </span>
          </div>
        </div>

        {/* Studio View Selector controls */}
        <div className="flex items-center gap-1.5 bg-[#1C1C1C] p-1 rounded-xl border border-white/10" id="display-mode-selector">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleBackgroundChange} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            onClick={() => setBroadcasterMode('both')}
            className={`text-[10px] font-mono font-black py-1.5 px-3.5 rounded-lg duration-155 uppercase flex items-center gap-1.5 cursor-pointer ${
              broadcasterMode === 'both' 
                ? 'bg-brand-blue text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Régie & Aperçu
          </button>

          <button
            onClick={() => setBroadcasterMode('stream-only')}
            className={`text-[10px] font-mono font-black py-1.5 px-3.5 rounded-lg duration-155 uppercase flex items-center gap-1.5 cursor-pointer ${
              broadcasterMode === 'stream-only' 
                ? 'bg-brand-blue text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-brand-red animate-pulse" /> Flux Seul
          </button>

          <button
            onClick={() => window.open(window.location.origin + window.location.pathname + '?overlay=true', '_blank')}
            className="text-[10px] font-mono font-black py-1.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg duration-155 uppercase flex items-center gap-1.5 cursor-pointer border border-white/5 ml-1"
            title="Ouvrir l'Overlay plein écran dédié avec fond transparent pour OBS Studio"
          >
            <Tv className="w-3.5 h-3.5 text-brand-blue" /> Overlay OBS (Transparent)
          </button>

          <button
            onClick={() => window.open(window.location.origin + window.location.pathname + '?studio=true', '_blank')}
            className="text-[10px] font-mono font-black py-1.5 px-3 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] rounded-lg duration-155 uppercase flex items-center gap-1.5 cursor-pointer border border-[#00E5FF]/20 ml-1"
            title="Ouvrir le Studio Plein Écran tout-en-un pour diffuser directement sur TikTok, YouTube, Facebook par capture d'onglet"
          >
            <Monitor className="w-3.5 h-3.5" /> Studio Direct (Sans OBS)
          </button>

          <button
            onClick={() => window.open(window.location.origin + window.location.pathname + '?admin=true', '_blank')}
            className="text-[10px] font-mono font-black py-1.5 px-3 bg-amber-950/45 hover:bg-amber-900/45 text-amber-400 rounded-lg duration-155 uppercase flex items-center gap-1.5 cursor-pointer border border-amber-900/30 ml-2 shadow-sm animate-pulse"
            title="Ouvrir le panneau d'administration pour charger les compositions d'équipes et les matchs au programme"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" /> Panneau Admin (Manuel)
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] font-mono font-black py-1.5 px-3 bg-emerald-950/45 hover:bg-emerald-900/45 text-emerald-400 rounded-lg duration-155 uppercase flex items-center gap-1.5 cursor-pointer border border-emerald-900/30 ml-2 shadow-sm"
            title="Uploader une image d'arrière-plan personnalisée (effet vitré)"
          >
            <Image className="w-3.5 h-3.5 text-emerald-400" /> Image Fond
          </button>

          {backgroundImage && (
            <button
              onClick={() => setBackgroundImage(null)}
              className="text-[10px] font-mono font-black py-1.5 px-2 bg-red-950/45 hover:bg-red-900/45 text-red-400 rounded-lg duration-155 uppercase flex items-center cursor-pointer border border-red-900/30 ml-0.5"
              title="Supprimer l'image d'arrière-plan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {bgUploadStatus && (
            <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2.5 py-1.5 rounded-lg ml-1.5 whitespace-nowrap">
              {bgUploadStatus}
            </span>
          )}
        </div>

      </div>

      {/* CORE ACTIVE STREAM OVERLAY VIEWPORT WRAPPER */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-6 flex items-center justify-center min-h-0" id="stream-grid-environment">
        
        {/* PREVIEW CONTAINER STAYING PERFECTLY WITHIN 16:9 PROPORTIONAL LIMITS */}
        <div 
          className="w-full max-w-[1360px] aspect-video bg-[#050505] rounded-[30px] overflow-hidden shadow-[0_0_55px_rgba(0,0,0,0.85)] border border-white/10 relative"
          id="stream-card-frame"
        >
          {/* Custom Background Image Layer */}
          {backgroundImage && (
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              <img 
                src={backgroundImage} 
                alt="Custom Stream Background" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
            </div>
          )}

          {/* UNIFIED DESIGN GRID (Header + 2 rows of widgets) */}
          <div className={`w-full h-full ${backgroundImage ? 'bg-transparent' : 'bg-black'} p-2 sm:p-3 overflow-hidden grid grid-rows-[16fr_42fr_42fr] grid-cols-[28fr_44fr_28fr] gap-2 sm:gap-3 relative z-10`} id="stream-grid-container">
            
            {/* HEADER ROW */}
            <div className="col-span-3 h-full min-h-0">
              <Header />
            </div>

            {/* ZONE CENTRALE (Row 2) */}
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="stats-panel-cell">
              <StatsPanel />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="live-camera-cell">
              <LiveCamera />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="lineup-board-cell">
              <LineupBoard />
            </div>

            {/* ZONE BASSE (Row 3) */}
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="upcoming-matches-cell">
              <UpcomingMatches />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="ad-banner-cell">
              <AdBanner />
            </div>
            <div className="h-full min-h-0 min-w-0 overflow-hidden" id="competition-logo-cell">
              <CompetitionLogo />
            </div>

          </div>
        </div>

      </div>

      {/* EDIT TEAM DETAILS & CONFIG HUD CONTAINER (VISIBLE ONLY IN STUDIO VIEW) */}
      {broadcasterMode === 'both' && (
        <>
          <div className="max-w-[1920px] mx-auto w-full px-6 md:px-8 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4" id="studio-team-cards-row">
            <TeamCard teamKey="home" />
            <TeamCard teamKey="away" />
          </div>
          <div className="max-w-[1920px] mx-auto w-full px-6 md:px-8 pb-8" id="studio-ad-manager-row">
            <AdManager />
          </div>
          <Footer />
        </>
      )}

    </div>
  );
}

export default function App() {
  return (
    <MatchProvider>
      <BroadcastGrid />
    </MatchProvider>
  );
}