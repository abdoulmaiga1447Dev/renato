/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { useMatchData } from '../context/MatchContext';
import { Camera, Radio, VideoOff, SlidersHorizontal, Smartphone, ExternalLink, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LiveCamera() {
  const { 
    match, 
    streamSource, 
    setStreamSource, 
    phoneCamStreamId,
    showOverlayInstructions,
    setShowOverlayInstructions
  } = useMatchData();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useScanlines, setUseScanlines] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    try {
      return localStorage.getItem('preferredWebcamId') || '';
    } catch {
      return '';
    }
  });

  // Active danger bar state computed from current ball position
  const dangerLevel = match.activeAttacker === 'home' 
    ? Math.min(100, Math.max(0, Math.round((100 - match.ballPosition.x) * 1.2)))
    : match.activeAttacker === 'away'
      ? Math.min(100, Math.max(0, Math.round(match.ballPosition.x * 1.2)))
      : 12;

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true'));

  const isStudioMode = typeof window !== 'undefined' && 
    (window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  const isFullScreenView = isOverlayMode || isStudioMode;
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Enumerate all video capture devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const updateDevicesList = () => {
        navigator.mediaDevices.enumerateDevices()
          .then((deviceInfos) => {
            const videoDevices = deviceInfos.filter(d => d.kind === 'videoinput');
            setDevices(videoDevices);
            
            // Auto-select preferred webcam
            if (videoDevices.length > 0) {
              const saved = localStorage.getItem('preferredWebcamId');
              const exists = videoDevices.some(d => d.deviceId === saved);
              
              setSelectedDeviceId((currentId) => {
                // If we already have a stream active, check its actual device ID to prevent infinite loops
                const activeTrack = streamRef.current?.getVideoTracks()[0];
                const activeTrackDeviceId = activeTrack?.getSettings()?.deviceId;
                const idToMatch = currentId || activeTrackDeviceId;

                if (idToMatch && videoDevices.some(d => d.deviceId === idToMatch)) {
                  return idToMatch;
                }
                if (saved && exists) {
                  return saved;
                }
                // Look for Logitech, C920, USB cameras or select the first device
                const preferredCam = videoDevices.find(d => 
                  d.label.toLowerCase().includes('logitech') || 
                  d.label.toLowerCase().includes('c920') || 
                  d.label.toLowerCase().includes('external') ||
                  d.label.toLowerCase().includes('usb')
                );
                return preferredCam ? preferredCam.deviceId : videoDevices[0].deviceId;
              });
            }
          })
          .catch(err => console.warn("Failed to list media devices:", err));
      };

      updateDevicesList();
      navigator.mediaDevices.addEventListener('devicechange', updateDevicesList);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', updateDevicesList);
      };
    }
  }, []);

  // Handle webcam activation / cleanup
  useEffect(() => {
    let active = true;

    if (streamSource === 'camera') {
      const currentTrack = streamRef.current?.getVideoTracks()[0];
      const currentTrackDeviceId = currentTrack?.getSettings()?.deviceId;

      // If a valid stream with matching device ID is already active, DO NOT re-acquire!
      if (streamRef.current && streamRef.current.active && 
          (selectedDeviceId === '' || currentTrackDeviceId === selectedDeviceId)) {
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Stop any old stream first before launching a new one
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setStream(null);
        }

        const selectedConstraints: MediaStreamConstraints = {
          video: selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        };

        navigator.mediaDevices.getUserMedia(selectedConstraints)
          .then((mediaStream) => {
            if (!active) {
              mediaStream.getTracks().forEach(track => track.stop());
              return;
            }
            streamRef.current = mediaStream;
            setStream(mediaStream);
            setCameraError(null);

            // Auto-align selectedDeviceId with actual device ID in use
            const activeTrack = mediaStream.getVideoTracks()[0];
            const actualId = activeTrack?.getSettings()?.deviceId;
            if (actualId && selectedDeviceId !== actualId) {
              setSelectedDeviceId(actualId);
              try {
                localStorage.setItem('preferredWebcamId', actualId);
              } catch {}
            }
            
            // Retrieve devices list with human labels now that permission is granted
            navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
              if (!active) return;
              const videoDevices = deviceInfos.filter(d => d.kind === 'videoinput');
              setDevices(videoDevices);
            });
          })
          .catch((err) => {
            if (!active) return;
            console.error("Camera acquisition failed:", err);

            // Fallback to default camera if exact ID constraint failed
            if (selectedDeviceId) {
              console.warn("Exact device match failed. Falling back to default camera...");
              setSelectedDeviceId('');
              return;
            }

            if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              setCameraError("Aucun périphérique caméra (Logitech C920 ou autre) n'a été détecté. Veuillez brancher votre caméra externe.");
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setCameraError("Accès caméra refusé. Veuillez accorder l'autorisation d'accès à la caméra dans les paramètres de votre navigateur.");
            } else {
              setCameraError("La caméra est introuvable ou indisponible (elle peut être déjà utilisée par une autre application ou par OBS).");
            }
          });
      } else {
        setCameraError("L'accès à la caméra n'est pas supporté ou est bloqué par les restrictions de sécurité.");
      }
    } else {
      // Stream source is not camera (e.g. greenscreen), stop the webcam
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
      }
    }

    return () => {
      active = false;
    };
  }, [streamSource, selectedDeviceId, retryTrigger]);

  // Keep the video element srcObject fully in sync with stream state
  useEffect(() => {
    if (videoRef.current) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (stream) {
      setStream(null);
    }
  };

  const handleRetryCamera = () => {
    setCameraError(null);
    setRetryTrigger(prev => prev + 1);
  };

  return (
    <div 
      className={`${isOverlayMode && (streamSource === 'camera' || streamSource === 'phone') ? 'bg-transparent border-white/5 shadow-none' : 'bg-[#111111] border-white/10 shadow-[0_0_35px_rgba(0,0,0,0.2)]'} border rounded-2xl overflow-hidden relative h-full w-full`}
      id="live-camera-feed-container"
    >
      
      {/* 1. CHROMA KEY GREEN SCREEN BACKGROUND (FOR OBS TRANSPARENT OVERLAY MODE) */}
      {streamSource === 'greenscreen' && (
        <div className="absolute inset-0 bg-[#00FF00] flex flex-col items-center justify-center pointer-events-none" id="greenscreen-viewport">
          <div className="bg-black/90 px-8 py-5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 shadow-2xl max-w-sm text-center">
            <Radio className="w-8 h-8 text-[#00FF00] animate-pulse" />
            <span className="text-sm font-display font-medium text-white uppercase tracking-wider">
              MODE INCRUSTATION ACTIVE (VERT)
            </span>
            <p className="text-[10px] font-mono text-slate-400">
              Ajoutez l'URL en tant que "Source Navigateur" dans OBS Studio, puis appliquez un filtre "Chroma Key" pour rendre l'arrière-plan transparent !
            </p>
          </div>
        </div>
      )}

      {/* 2. REAL DEVICE WEBCAM IN IFRAME */}
      {streamSource === 'camera' && (
        <div className={`w-full h-full relative ${isOverlayMode && !stream ? 'bg-transparent' : 'bg-neutral-900'} flex items-center justify-center`}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover scale-x-[-1] ${stream ? 'block' : 'hidden'}`} 
            id="webcam-video-feed"
          />

          {!stream && (
            isFullScreenView ? (
              showOverlayInstructions ? (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center overflow-y-auto">
                  <div className="max-w-md w-full space-y-3 px-2 py-2">
                    <div className="flex justify-center gap-2 mb-1 animate-pulse">
                      <Camera className="w-6 h-6 text-brand-blue" />
                      <VideoOff className="w-6 h-6 text-slate-500" />
                    </div>
                    
                    <h3 className="text-xs font-display font-black text-[#00E5FF] tracking-wider uppercase">
                      {isStudioMode ? "Studio de Diffusion Directe (Sans OBS)" : "Configuration de la Caméra [OBS OVERLAY]"}
                    </h3>
                    
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                      {isStudioMode 
                        ? "Vous utilisez le mode de diffusion direct tout-en-un ! Pas besoin d'OBS pour intégrer votre caméra."
                        : "Une webcam ne peut être utilisée que par une seule application à la fois. Choisissez l'une des deux solutions ultra-simples :"
                      }
                    </p>

                    <div className="grid grid-cols-1 gap-2 text-left mt-2 font-sans">
                      {isStudioMode ? (
                        <>
                          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 space-y-1">
                            <span className="text-[8px] font-black text-emerald-400 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              ÉTAPE 1 : AUTORISATION
                            </span>
                            <h4 className="text-[10px] font-bold text-white leading-tight">Autorisez l'accès à votre caméra</h4>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              Cliquez sur l'icône de caméra dans la barre d'adresse de votre navigateur et assurez-vous que l'accès est autorisé pour ce site.
                            </p>
                          </div>

                          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 space-y-1">
                            <span className="text-[8px] font-black text-brand-blue font-mono uppercase bg-brand-blue/10 px-1.5 py-0.5 rounded">
                              ÉTAPE 2 : DIFFUSION DIRECTE
                            </span>
                            <h4 className="text-[10px] font-bold text-white leading-tight">Lancez votre live sur TikTok, YouTube ou Facebook</h4>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              Ouvrez votre console de live (ex: <strong className="text-white">TikTok Live Studio</strong>, <strong className="text-white">YouTube Live</strong> ou <strong className="text-white">Facebook Live Producer</strong>). Choisissez l'option <strong className="text-[#00E5FF]">"Partager un écran / Partager un onglet de navigateur"</strong>, puis sélectionnez cet onglet ! Votre caméra et le score s'enverront ensemble en parfaite qualité.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 space-y-1">
                            <span className="text-[8px] font-black text-emerald-400 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              OPTION A (MÉTHODE PRO CONSEILLÉE)
                            </span>
                            <h4 className="text-[10px] font-bold text-white leading-tight">Superposer la caméra directement dans OBS</h4>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              L’arrière-plan de cette fenêtre est transparent. Dans OBS, placez simplement votre source <strong className="text-white">"Périphérique de capture vidéo" (votre caméra)</strong> juste <strong className="text-brand-blue">sous</strong> cette source navigateur. Votre caméra s'incrustera à la perfection et à 0ms de latence !
                            </p>
                          </div>

                          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 space-y-1">
                            <span className="text-[8px] font-black text-brand-blue font-mono uppercase bg-brand-blue/10 px-1.5 py-0.5 rounded">
                              OPTION B (DESSIN WEB DIRECT)
                            </span>
                            <h4 className="text-[10px] font-bold text-white leading-tight">Afficher la Webcam directement dans ce site</h4>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              1. Sur votre régie principale (ce site), cliquez sur le bouton bleu <strong className="text-white">"Incrust' OBS"</strong> en bas. L'écran de la régie deviendra vert : c'est normal, cela libère la webcam.<br />
                              2. Dans OBS, faites un clic droit sur votre source navigateur &rarr; <strong className="text-white">"Rafraîchir le cache de la page actuelle"</strong> pour que la caméra démarre directement dans votre scène OBS.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-transparent" />
              )
            ) : cameraError ? (
              <div className="text-center p-6 bg-slate-950/95 border border-red-500/30 rounded-2xl max-w-lg mx-auto shadow-2xl relative z-20 space-y-4 font-sans text-white">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <VideoOff className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-red-400 font-display font-black text-xs uppercase tracking-widest">
                      Accès Caméra Bloqué
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      (Permission refusée par le navigateur)
                    </p>
                  </div>
                </div>

                <div className="border-t border-b border-white/5 py-3 text-left space-y-2.5">
                  {isIframe ? (
                    <>
                      <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/25 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[#00E5FF]">
                          <span className="text-[9px] font-black font-mono bg-[#00E5FF]/15 px-1.5 py-0.5 rounded uppercase">Recommandé</span>
                          <span className="text-[10px] font-bold">1. Ouvrir dans un nouvel onglet</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-normal">
                          Les navigateurs bloquent souvent l'accès à la caméra lorsqu'un site est chargé dans un cadre de prévisualisation (iframe). Ouvrez-le en plein écran pour contourner cette restriction.
                        </p>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-1.5">
                        <span className="text-[10px] font-bold text-white block">2. Réactiver l'autorisation</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Une fois l'application ouverte dans son nouvel onglet, cliquez sur le petit bouton <strong>"Réessayer"</strong> ci-dessous. Si le navigateur ne vous demande rien, cliquez sur l'icône de <strong>cadenas 🔒</strong> ou de <strong>caméra 🎥</strong> tout en haut à gauche de votre barre d'adresse pour autoriser la caméra.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-2">
                      <span className="text-[11px] font-black text-[#00E5FF] font-mono uppercase bg-[#00E5FF]/10 px-1.5 py-0.5 rounded inline-block">
                        Comment débloquer la caméra :
                      </span>
                      <ol className="list-decimal list-inside text-[10px] text-slate-300 space-y-1.5 leading-relaxed font-sans">
                        <li>
                          Cliquez sur l'icône de <strong className="text-white">cadenas 🔒</strong> ou de <strong className="text-white">caméra 🎥</strong> située tout à gauche de votre barre d'adresse (à côté de l'URL).
                        </li>
                        <li>
                          Modifiez l'autorisation de la <strong className="text-white">Caméra</strong> pour la passer sur <strong className="text-emerald-400">"Autoriser"</strong> (ou "Demander").
                        </li>
                        <li>
                          Cliquez sur le bouton bleu <strong className="text-white">"Réessayer l'accès"</strong> ci-dessous pour activer votre flux vidéo en direct !
                        </li>
                      </ol>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {isIframe && (
                    <a 
                      href={typeof window !== 'undefined' ? window.location.href : '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-lg font-sans text-[10px] transition-all duration-150 border border-white/5"
                    >
                      Ouvrir dans un nouvel onglet ↗
                    </a>
                  )}
                  <button 
                    onClick={handleRetryCamera}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/85 text-slate-950 font-black rounded-lg font-sans text-[10px] transition-all duration-150 shadow-lg shadow-[#00E5FF]/15 uppercase tracking-wider"
                  >
                    Réessayer l'accès 🔄
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 font-mono text-xs">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-500 animate-pulse" />
                <span>Recherche d'une caméra disponible...</span>
              </div>
            )
          )}
        </div>
      )}

      {/* 3. SCANLINE EFFECT FILTER */}
      {useScanlines && streamSource === 'camera' && stream && (
        <div className="absolute inset-0 scanlines pointer-events-none opacity-40 z-10" />
      )}

      {/* 4. CORNER TARGET RETICLES & HUD OVERLAYS */}
      {streamSource === 'camera' && stream && (
        <>
          <div className="absolute inset-0 border border-white/5 pointer-events-none z-15">
            {/* Reticles on margins */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-white/40" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-white/40" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-white/40" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-white/40" />
          </div>

          {/* HUD WATERMARKS */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 pointer-events-none">
            {/* Red pulsing dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
            </span>
            <span className="text-[9px] font-mono font-black tracking-[0.2em] text-white bg-black/55 px-2 py-0.5 rounded backdrop-blur-xs uppercase">
              CAMÉRA LIVE
            </span>
          </div>

          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 pointer-events-none">
            <span className="text-[8px] font-mono font-bold text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
              1080P 60FPS
            </span>
            <span className="text-[8px] font-mono font-bold text-brand-green bg-emerald-950/80 border border-brand-green/30 px-1.5 py-0.5 rounded uppercase">
              Flux Direct
            </span>
          </div>
        </>
      )}

      {/* DYNAMIC ATTACK DANGER BROADCAST OVERLAY ALERT */}
      <AnimatePresence>
        {dangerLevel > 65 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-xl border font-mono text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl pointer-events-none ${
              match.activeAttacker === 'home' 
                ? 'bg-brand-green/95 border-emerald-400 text-white' 
                : 'bg-brand-red/95 border-red-500 text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ATTENTAT DANGEREUX : ZONE ACTIVE ({dangerLevel}%)
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER CAMERA CONTROLS BAR (STREAM SOURCE & SCANLINE TOGGLE) */}
      {!isFullScreenView && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-6 z-20 flex items-center justify-between gap-2">
          
          {/* Source Selectors */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setStreamSource('camera')}
              className={`text-[10px] font-mono font-black px-3 py-1 rounded-lg duration-150 uppercase flex items-center gap-1 cursor-pointer ${
                streamSource === 'camera' 
                  ? 'bg-brand-blue text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-3 h-3" /> Caméra C920 / Webcam
            </button>

            <button
              onClick={() => setStreamSource('greenscreen')}
              className={`text-[10px] font-mono font-black px-3 py-1 rounded-lg duration-150 uppercase flex items-center gap-1 cursor-pointer ${
                streamSource === 'greenscreen' 
                  ? 'bg-brand-blue text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" /> Incrust' OBS
            </button>
          </div>

          {/* Specific Device Selector (Logitech C920, etc.) */}
          {streamSource === 'camera' && devices.length > 0 && (
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-white/5 max-w-[180px] sm:max-w-xs">
              <span className="text-[8px] font-mono font-bold text-[#00ffea] uppercase whitespace-nowrap">Source :</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDeviceId(val);
                  try {
                    localStorage.setItem('preferredWebcamId', val);
                  } catch {}
                }}
                className="bg-transparent text-[9px] font-mono text-white border-0 focus:ring-0 p-0 cursor-pointer max-w-[120px] sm:max-w-[180px] outline-none truncate"
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-slate-950 text-white">
                    {device.label || `Caméra ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanlines toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowOverlayInstructions(!showOverlayInstructions)}
              className={`text-[9px] font-mono font-bold px-2.5 py-1.5 rounded-lg border duration-150 flex items-center gap-1 uppercase cursor-pointer ${
                showOverlayInstructions 
                  ? 'bg-slate-800 border-white/10 text-[#00E5FF]' 
                  : 'bg-emerald-950/80 border-emerald-500/25 text-brand-green'
              }`}
              title={showOverlayInstructions ? "Masquer le panneau d'aide d'OBS pour libérer la caméra en transparence" : "Afficher l'aide de configuration d'OBS"}
            >
              Aide OBS: {showOverlayInstructions ? 'AFFICHE' : 'MASQUE'}
            </button>

            <button
              onClick={() => setUseScanlines(!useScanlines)}
              className={`text-[9px] font-mono font-bold px-2.5 py-1.5 rounded-lg border duration-150 flex items-center gap-1 uppercase cursor-pointer ${
                useScanlines 
                  ? 'bg-slate-800 border-white/10 text-brand-blue' 
                  : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              CRT: {useScanlines ? 'ON' : 'OFF'}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
