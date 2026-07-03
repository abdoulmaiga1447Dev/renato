/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMatchData } from '../context/MatchContext';
import { Shield, Settings, Check, Palette } from 'lucide-react';

interface TeamCardProps {
  teamKey: 'home' | 'away';
}

export default function TeamCard({ teamKey }: TeamCardProps) {
  const { homeTeam, awayTeam, setTeamProperty } = useMatchData();
  const team = teamKey === 'home' ? homeTeam : awayTeam;
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(team.name);
  const [tempColor, setTempColor] = useState(team.color);

  const handleSave = () => {
    setTeamProperty(teamKey, 'name', tempName);
    setTeamProperty(teamKey, 'color', tempColor);
    setIsEditing(false);
  };

  return (
    <div 
      className="bg-[#131A2D] border border-white/5 rounded-2xl p-4 transition-all hover:bg-opacity-95"
      id={`team-card-${teamKey}`}
    >
      <div className="flex items-center justify-between border-b border-[#1C263F] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-blue" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
            SQUAD {teamKey === 'home' ? 'HOME' : 'AWAY'}
          </span>
        </div>

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-[#1C263F]"
          title="Modifier l'équipe"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block mb-1">Nom équipe</label>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-[#1C263F] border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue font-sans"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block mb-1">Couleur Maillot</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={tempColor}
                onChange={(e) => setTempColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{tempColor}</span>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-brand-blue text-white text-xs font-bold py-1.5 rounded-lg hover:bg-brand-blue/80 active:scale-95 duration-100 flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" /> Sauvegarder
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="text-3xl p-1.5 rounded-xl flex items-center justify-center border border-white/5 shadow-inner w-12 h-12"
              style={{ backgroundColor: `${team.color}15` }}
            >
              {team.logoUrl && (team.logoUrl.startsWith("http") || team.logoUrl.startsWith("data:")) ? (
                <img src={team.logoUrl} className="w-8 h-8 object-contain rounded-lg" referrerPolicy="no-referrer" alt={team.name} />
              ) : (
                team.logoUrl
              )}
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white tracking-wide uppercase">
                {team.name}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: team.color }} />
                Code: {team.code}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Formation</span>
            <span className="font-mono text-xs font-bold text-white mt-0.5 inline-block bg-[#1C263F] px-2 py-0.5 rounded-md">
              {teamKey === 'home' ? '4-3-3' : '4-2-3-1'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
