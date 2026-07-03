/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useMatchData } from '../context/MatchContext';
import { Trophy, Upload, Trash2, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function CompetitionLogo() {
  const { 
    competition, 
    competitionImage, 
    setCompetitionImage 
  } = useMatchData();
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));

  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError("Le fichier doit être une image (PNG, JPG, SVG).");
      return;
    }

    // Limit size to ~1.5MB to be safe with LocalStorage limits
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError("L'image est trop volumineuse (max 1.5 Mo) pour un stockage local fluide.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setCompetitionImage(base64);
        setUploadError(null);
      }
    };
    reader.onerror = () => {
      setUploadError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompetitionImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // FULL SCREEN/OBS OVERLAY MODE ONLY: Just the gorgeous, clean, non-interactive logo aspect ratio box
  if (isFullScreenView) {
    return (
      <div 
        className="backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl overflow-hidden relative flex flex-col h-full w-full items-center justify-center text-center select-none"
        id="competition-logo-overlay"
      >
        {competitionImage ? (
          <img 
            src={competitionImage} 
            alt={competition || "Compétition"} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5 p-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5">
              <Trophy className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-black tracking-[0.2em] text-amber-400 uppercase">
                LOGO COMPÉTITION
              </span>
              <h3 className="font-display font-black text-sm uppercase tracking-wide text-white max-w-[350px] line-clamp-2 leading-tight">
                {competition || "SANS SIGNAL DIRECT"}
              </h3>
            </div>
          </div>
        )}
      </div>
    );
  }

  // INTERACTIVE COCKPIT/ADMIN MODE
  return (
    <div 
      className="backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-lg relative flex flex-col h-full overflow-hidden" 
      id="competition-logo-widget"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <h2 className="font-display font-black text-[10px] sm:text-xs tracking-widest text-white uppercase leading-none">
            LOGO COMPÉTITION
          </h2>
        </div>
        <span className="text-[7px] sm:text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          Visuel Live
        </span>
      </div>

      {/* Main Drag-Drop / Viewer Area */}
      <div 
        onClick={() => !competitionImage && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 relative min-h-0 rounded-xl overflow-hidden border transition-all duration-150 flex flex-col items-center justify-center p-3 text-center ${
          competitionImage 
            ? 'border-white/10 bg-black/25' 
            : isDragging 
              ? 'border-amber-500 bg-amber-500/5 cursor-pointer' 
              : 'border-dashed border-white/15 hover:border-amber-500/40 hover:bg-white/[0.01] cursor-pointer'
        }`}
        id="logo-upload-zone"
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {competitionImage ? (
          <div className="absolute inset-0 z-10 bg-[#141414] group/logo-container">
            {/* Logo Viewer occupies 100% width & height */}
            <img 
              src={competitionImage} 
              alt="Logo Compétition" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Premium quick actions overlaid at the bottom */}
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/85 to-transparent flex items-center justify-between duration-200">
              <span className="text-[8px] font-mono text-slate-300 font-bold max-w-[120px] truncate drop-shadow">
                Logo personnalisé
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-[8px] text-white font-bold rounded hover:text-white transition-colors uppercase font-mono border border-white/15"
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1 bg-red-950/60 hover:bg-red-900/60 border border-red-500/35 text-red-350 hover:text-red-300 rounded transition-colors"
                  title="Supprimer le logo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pointer-events-none select-none max-w-[210px]">
            <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-300">
                {isDragging ? "Déposez l'image !" : "Importer le logo"}
              </p>
              <p className="text-[8px] text-slate-500 leading-normal mt-0.5 font-mono">
                Glissez-déposez ou cliquez pour parcourir (PNG, JPG, SVG - max 1.5M)
              </p>
            </div>
          </div>
        )}

        {/* Floating error notification */}
        {uploadError && (
          <div className="absolute bottom-2 inset-x-2 bg-red-950/90 border border-red-500/30 rounded-lg p-1.5 text-center z-20">
            <p className="text-[8.5px] font-medium text-red-300 leading-tight">
              {uploadError}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
