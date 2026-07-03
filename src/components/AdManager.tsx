/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAds } from '../context/MatchContext';
import { Ad } from '../types';
import { 
  Upload, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Image as ImageIcon, 
  Tag, 
  Check, 
  X, 
  Sparkles,
  Link,
  ChevronRight,
  Eye,
  AlertTriangle
} from 'lucide-react';

export default function AdManager() {
  const { ads, setAds } = useAds();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [ctaText, setCtaText] = useState('VOIR PLUS');
  const [imageUrl, setImageUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#EAB308');
  const [bgColor, setBgColor] = useState('from-emerald-800 to-green-950');
  
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default initial ads for restore
  const initialAds: Ad[] = [
    {
      id: "ad-default-base",
      title: "RENATO AUSTINE",
      subtitle: "ON CONTINUE FAMILLE",
      highlightText: "OCF DIRECT",
      sponsorName: "OCF",
      ctaText: "Contactez le +212 603-420352 pour vous faire afficher ici",
      accentColor: "#EAB308", // Gold
      bgColor: "from-blue-950 via-neutral-900 to-black"
    },
    {
      id: "ad-1",
      title: "PARIEZ EN DIRECT !",
      subtitle: "100€ OFFERTS SANS DÉPÔT",
      highlightText: "CRAZY BONUS",
      sponsorName: "BET WIN",
      ctaText: "PARIER MAINTENANT",
      accentColor: "#EAB308",
      bgColor: "from-emerald-800 to-green-950"
    },
    {
      id: "ad-2",
      title: "VOTRE MAILLOT PRÉFÉRÉ",
      subtitle: "-30% SUR TOUTE LA COLLECTION SPORT",
      highlightText: "CODE: SPORT30",
      sponsorName: "LIVE STORE",
      ctaText: "ACHETER DIRECT",
      accentColor: "#2563EB",
      bgColor: "from-blue-900 to-slate-950"
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).");
      return;
    }

    // Limit size to ~1.2MB for local storage safety
    if (file.size > 1200000) {
      setErrorMsg("Cette image est trop lourde (limite de 1.2 Mo pour l'enregistrement local). Veuillez utiliser un fichier plus léger.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Une erreur est survenue lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setSponsorName('');
    setHighlightText('');
    setCtaText('VOIR PLUS');
    setImageUrl('');
    setAccentColor('#EAB308');
    setBgColor('from-emerald-800 to-green-950');
    setErrorMsg(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setTitle(ad.title || '');
    setSubtitle(ad.subtitle || '');
    setSponsorName(ad.sponsorName || '');
    setHighlightText(ad.highlightText || '');
    setCtaText(ad.ctaText || 'VOIR PLUS');
    setImageUrl(ad.imageUrl || '');
    setAccentColor(ad.accentColor || '#EAB308');
    setBgColor(ad.bgColor || 'from-emerald-800 to-green-950');
    setIsAdding(true);
    setErrorMsg(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sponsorName.trim()) {
      setErrorMsg("Le nom du sponsor/annonceur est obligatoire.");
      return;
    }
    if (!title.trim() && !imageUrl) {
      setErrorMsg("Veuillez saisir au moins un titre ou téléverser une image de fond.");
      return;
    }

    const newAd: Ad = {
      id: editingId || 'ad-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      subtitle: subtitle.trim(),
      sponsorName: sponsorName.trim().toUpperCase(),
      highlightText: highlightText.trim(),
      ctaText: ctaText.trim() || 'VOIR PLUS',
      imageUrl: imageUrl || undefined,
      accentColor,
      bgColor
    };

    if (editingId) {
      // Edit existing
      setAds(prev => prev.map(item => item.id === editingId ? newAd : item));
    } else {
      // Add new
      setAds(prev => [...prev, newAd]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      setAds(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm("Voulez-vous restaurer les publicités de démonstration d'origine ? Vos modifications actuelles seront écrasées.")) {
      setAds(initialAds);
      resetForm();
    }
  };

  return (
    <div className="bg-[#131A2D] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl" id="ad-manager-widget">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-[#1C263F] pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#00E5FF]" />
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-[#FFFFFF] uppercase">
              RÉGIE PUBLICITAIRE
            </h2>
            <p className="text-[9px] font-mono text-slate-400 mt-0.5">
              Gérez les images et les annonces qui défilent sur l'Overlay Live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestoreDefaults}
            className="text-[9px] font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 py-1 px-2.5 rounded-lg border border-white/5 transition duration-150 flex items-center gap-1 cursor-pointer"
            title="Restaurer les configurations initiales"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" /> Réinitialiser
          </button>
          
          {!isAdding && (
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-brand-blue hover:bg-brand-blue/80 text-white font-mono text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-1 cursor-pointer shadow-md duration-150"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          )}
        </div>
      </div>

      {isAdding ? (
        /* Add / Edit Form */
        <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono font-black text-[#00E5FF] uppercase">
              {editingId ? "✍️ ÉDITER UNE ANNONCE" : "➕ NOUVELLE ANNONCE OUTIL"}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-red-400 flex items-start gap-2 font-mono text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sponsor */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Annonceur / Nom du Sponsor *</label>
              <input
                type="text"
                placeholder="Ex: BET WIN, MA PLANÈTE..."
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="w-full bg-[#1C263F] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue placeholder-slate-500"
                required
              />
            </div>

            {/* CTA action text */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Texte du Bouton (CTA)</label>
              <input
                type="text"
                placeholder="Ex: PARIER MAINTENANT, VISITER..."
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full bg-[#1C263F] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title / Slogan */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Titre principal</label>
              <input
                type="text"
                placeholder="Ex: -40% SUR VOTRE MAILLOT"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#1C263F] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue placeholder-slate-500"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Sous-titre / Description</label>
              <input
                type="text"
                placeholder="Ex: Avec le code de promo EXCLUSIF"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-[#1C263F] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Highlight Badged text */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Texte en Évidence (Badge)</label>
              <input
                type="text"
                placeholder="Ex: CODE: SOCCER40"
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                className="w-full bg-[#1C263F] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue placeholder-slate-500"
              />
            </div>

            {/* Accent styling color picker */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1 font-mono">Couleur d'accentuation (Bouton/Bordure)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300 uppercase">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Drag and Drop File Upload Area */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
              Téléverser une Image de Fond (Recommandé)
            </label>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition duration-150 flex flex-col items-center justify-center gap-1.5 ${
                dragActive 
                  ? 'border-brand-blue bg-brand-blue/5' 
                  : 'border-[#1C263F] bg-black/20 hover:border-white/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imageUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/15 shadow-inner mx-auto group">
                  <img src={imageUrl} className="w-full h-full object-cover" alt="Prévisualisation" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-white uppercase bg-black/70 px-2 py-0.5 rounded border border-white/10">
                      Remplacer
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-400 animate-pulse" />
                  <p className="text-[10px] text-slate-300 font-bold">
                    Glissez-déposez votre image ici, ou <span className="text-brand-blue hover:underline">parcourez</span>
                  </p>
                  <p className="text-[8px] font-mono text-slate-500">
                    PNG, JPG, WEBP • Max 1.2 Mo (Optimisé pour le format carré 1:1 !)
                  </p>
                </>
              )}
            </div>

            {imageUrl && (
              <div className="flex items-center gap-1.5 mt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[9px] font-mono text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded"
                >
                  Supprimer l'image
                </button>
              </div>
            )}
          </div>

          {/* Fallback gradients if no image is uploaded */}
          {!imageUrl && (
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Style d'arrière-plan dégradé (sans image)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Esprit Vert', val: 'from-emerald-800 to-green-950' },
                  { label: 'Gamer Bleu', val: 'from-blue-900 to-slate-950' },
                  { label: 'Obsidian Rouge', val: 'from-red-950 via-neutral-900 to-red-900' },
                  { label: 'Dark Violet', val: 'from-indigo-950 via-purple-950 to-neutral-950' }
                ].map((grad) => (
                  <button
                    key={grad.val}
                    type="button"
                    onClick={() => setBgColor(grad.val)}
                    className={`text-[9px] font-mono py-1 px-1.5 rounded-lg border text-left truncate cursor-pointer transition ${
                      bgColor === grad.val 
                        ? 'border-[#00e5ff] text-white bg-white/5 font-black' 
                        : 'border-white/5 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1 bg-gradient-to-br ${grad.val}`} />
                    {grad.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C263F]">
            <button
              type="button"
              onClick={resetForm}
              className="text-[10px] font-mono text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-lg py-1.5 px-3.5 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-mono font-black text-[10px] uppercase tracking-wider py-1.5 px-4 rounded-lg cursor-pointer flex items-center gap-1 shadow-md"
            >
              <Check className="w-3.5 h-3.5" /> Enregistrer publicitaire
            </button>
          </div>

        </form>
      ) : (
        /* List View */
        <div className="space-y-2">
          {ads.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#1C263F] rounded-2xl flex flex-col items-center gap-1.5">
              <ImageIcon className="w-8 h-8 text-slate-600" />
              <p className="text-[11px] font-mono text-slate-400">Aucune annonce n'est configurée pour le défilement.</p>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="text-[10px] font-sans font-bold text-brand-blue hover:underline cursor-pointer"
              >
                Créer la première annonce
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {ads.map((ad, idx) => (
                <div 
                  key={ad.id}
                  className="bg-black/35 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3 group hover:border-[#1C263F] transition duration-150 relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 relative z-10">
                    <div className="w-12 h-12 rounded-lg border border-white/10 shrink-0 overflow-hidden relative bg-neutral-900 flex items-center justify-center">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${ad.bgColor}`} />
                      )}
                      
                      {/* Slides Number Pill */}
                      <span className="absolute bottom-0 right-0 bg-black/75 px-1 text-[8px] font-mono text-[#00E5FF] font-black border-t border-l border-white/10 leading-none py-0.5">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[8px] font-mono font-black text-[#00E5FF] bg-[#00E5FF]/10 px-1 rounded truncate leading-none uppercase">
                          {ad.sponsorName}
                        </span>
                        {ad.imageUrl && (
                          <span className="text-[7px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded leading-none uppercase">
                            Image
                          </span>
                        )}
                      </div>
                      <h4 className="text-[11px] font-display font-medium text-white truncate mt-1">
                        {ad.title || "Annonce Image seule"}
                      </h4>
                      {ad.subtitle && (
                        <p className="text-[9px] font-sans text-slate-400 truncate">
                          {ad.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 shrink-0 relative z-10 opacity-70 group-hover:opacity-100 transition duration-150">
                    <button
                      onClick={() => startEdit(ad)}
                      className="text-slate-400 hover:text-white p-1 rounded-md bg-white/5 hover:bg-white/10"
                      title="Modifier l'annonce"
                    >
                      <Plus className="w-3.5 h-3.5 scale-x-[-1] border-b border-r border-[#1C263F] p-0.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded-md bg-red-500/5 hover:bg-red-500/10"
                      title="Supprimer l'annonce"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtle decorative edge */}
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-brand-blue opacity-5" style={{ backgroundColor: ad.accentColor }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
