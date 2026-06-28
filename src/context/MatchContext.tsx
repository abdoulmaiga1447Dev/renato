/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { MatchState, MatchEvent, TeamInfo, MatchStats, UpcomingMatch, Ad, Lineup, Player, EventType } from '../types';
import { fetchMatchStats, fetchMatchLineups, fetchLiveMatches, fetchMatchDetails } from '../services';

// initial mock teams
const portugalTeam: TeamInfo = {
  name: "Portugal",
  code: "POR",
  shortName: "Portugal",
  logoUrl: "🇵🇹",
  color: "#DC2626", // Red primary
  textColor: "#FCD34D", // Gold text
  xg: 0.5
};

const rdCongoTeam: TeamInfo = {
  name: "RD Congo",
  code: "COD",
  shortName: "RD Congo",
  logoUrl: "🇨🇩",
  color: "#2563EB", // Blue primary
  textColor: "#FCD34D", // Gold stars/text
  xg: 0.1
};

const emptyHomeTeam: TeamInfo = {
  name: "En attente",
  code: "DOM",
  shortName: "Domicile",
  logoUrl: "⚽",
  color: "#1E293B",
  textColor: "#94A3B8",
  xg: 0.0
};

const emptyAwayTeam: TeamInfo = {
  name: "du signal",
  code: "EXT",
  shortName: "Extérieur",
  logoUrl: "⚽",
  color: "#334155",
  textColor: "#94A3B8",
  xg: 0.0
};



// Advertisements mock data
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
    accentColor: "#EAB308", // Yellow
    bgColor: "from-emerald-800 to-green-950"
  },
  {
    id: "ad-2",
    title: "VOTRE MAILLOT PRÉFÉRÉ",
    subtitle: "-30% SUR TOUTE LA COLLECTION SPORT",
    highlightText: "CODE: SPORT30",
    sponsorName: "LIVE STORE",
    ctaText: "ACHETER DIRECT",
    accentColor: "#2563EB", // Blue
    bgColor: "from-blue-900 to-slate-950"
  }
];

// Portgual & RD Congo lineups
const lineupsData: Record<string, Lineup> = {
  home: {
    formation: "4-3-3",
    players: [
      { id: "p1", name: "D. COSTA", number: 1, position: "GK", x: 50, y: 90 },
      { id: "p2", name: "R. VEIGA", number: 4, position: "DEF", x: 35, y: 72 },
      { id: "p3", name: "T. ARAÚJO", number: 3, position: "DEF", x: 65, y: 72 },
      { id: "p4", name: "N. MENDES", number: 19, position: "DEF", x: 15, y: 65 },
      { id: "p5", name: "J. CANCELO", number: 20, position: "DEF", x: 85, y: 65 },
      { id: "p6", name: "VITINHA", number: 23, position: "MID", x: 32, y: 46 },
      { id: "p7", name: "J. NEVES", number: 6, position: "MID", x: 68, y: 46 },
      { id: "p8", name: "B. FERNANDES", number: 8, position: "MID", x: 50, y: 32 },
      { id: "p9", name: "P. NETO", number: 18, position: "ATT", x: 20, y: 18 },
      { id: "p10", name: "B. SILVA", number: 10, position: "ATT", x: 80, y: 18 },
      { id: "p11", name: "RONALDO", number: 7, position: "ATT", x: 50, y: 10 }
    ]
  },
  away: {
    formation: "4-2-3-1",
    players: [
      { id: "c1", name: "D. BERTAUD", number: 1, position: "GK", x: 50, y: 90 },
      { id: "c2", name: "C. MBEMBA", number: 22, position: "DEF", x: 35, y: 74 },
      { id: "c3", name: "H. INONGA", number: 2, position: "DEF", x: 65, y: 74 },
      { id: "c4", name: "A. MASUAKU", number: 26, position: "DEF", x: 15, y: 66 },
      { id: "c5", name: "G. KALULU", number: 24, position: "DEF", x: 85, y: 66 },
      { id: "c6", name: "S. MOUTOUSSAMY", number: 8, position: "MID", x: 35, y: 48 },
      { id: "c7", name: "C. PICKEL", number: 18, position: "MID", x: 65, y: 48 },
      { id: "c8", name: "M. ELIA", number: 13, position: "MID", x: 20, y: 30 },
      { id: "c9", name: "G. KAKUTA", number: 14, position: "MID", x: 50, y: 30 },
      { id: "c10", name: "Y. WISSA", number: 20, position: "MID", x: 80, y: 30 },
      { id: "c11", name: "S. BANZA", number: 19, position: "ATT", x: 50, y: 12 }
    ]
  }
};

export function generateLineupForTeam(teamName: string, color: string, isHome: boolean): Lineup {
  const normName = teamName.toLowerCase().trim();
  
  // Real roster dictionary for popular teams
  if (normName.includes('real madrid')) {
    return {
      formation: "4-3-3",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "T. COURTOIS", number: 1, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "EDER MILITÃO", number: 3, position: "DEF", x: 35, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "A. RÜDIGER", number: 22, position: "DEF", x: 65, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "F. MENDY", number: 23, position: "DEF", x: 15, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "D. CARVAJAL", number: 2, position: "DEF", x: 85, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "F. VALVERDE", number: 8, position: "MID", x: 32, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "A. TCHOUAMÉNI", number: 14, position: "MID", x: 50, y: 32 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "J. BELLINGHAM", number: 5, position: "MID", x: 68, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "RODRYGO", number: 11, position: "ATT", x: 20, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "VINICIUS JR", number: 7, position: "ATT", x: 80, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "K. MBAPPÉ", number: 9, position: "ATT", x: 50, y: 10 }
      ]
    };
  }

  if (normName.includes('barcelona') || normName.includes('barcelone')) {
    return {
      formation: "4-3-3",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "M. TER STEGEN", number: 1, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "P. CUBARSÍ", number: 2, position: "DEF", x: 35, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "I. MARTÍNEZ", number: 5, position: "DEF", x: 65, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "A. BALDE", number: 3, position: "DEF", x: 15, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "J. KOUNDÉ", number: 23, position: "DEF", x: 85, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "PEDRI", number: 8, position: "MID", x: 32, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "D. OLMO", number: 20, position: "MID", x: 50, y: 32 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "M. CASADÓ", number: 17, position: "MID", x: 68, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "RAPHINHA", number: 11, position: "ATT", x: 20, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "L. YAMAL", number: 19, position: "ATT", x: 80, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "R. LEWANDOWSKI", number: 9, position: "ATT", x: 50, y: 10 }
      ]
    };
  }

  if (normName.includes('manchester city') || normName.includes('man. city') || normName.includes('mancity')) {
    return {
      formation: "4-2-3-1",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "EDERSON", number: 31, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "RÚBEN DIAS", number: 3, position: "DEF", x: 35, y: 74 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "M. AKANJI", number: 25, position: "DEF", x: 65, y: 74 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "J. GVARDIOL", number: 24, position: "DEF", x: 15, y: 66 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "K. WALKER", number: 2, position: "DEF", x: 85, y: 66 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "RODRI", number: 16, position: "MID", x: 35, y: 48 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "I. GÜNDOGAN", number: 19, position: "MID", x: 65, y: 48 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "J. DOKU", number: 11, position: "MID", x: 20, y: 30 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "K. DE BRUYNE", number: 17, position: "MID", x: 50, y: 30 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "PHIL FODEN", number: 47, position: "MID", x: 80, y: 30 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "E. HAALAND", number: 9, position: "ATT", x: 50, y: 12 }
      ]
    };
  }

  if (normName.includes('chelsea')) {
    return {
      formation: "4-2-3-1",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "R. SÁNCHEZ", number: 1, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "L. COLWILL", number: 6, position: "DEF", x: 35, y: 74 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "W. FOFANA", number: 29, position: "DEF", x: 65, y: 74 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "M. CUCURELLA", number: 3, position: "DEF", x: 15, y: 66 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "MALO GUSTO", number: 27, position: "DEF", x: 85, y: 66 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "E. ENZO", number: 8, position: "MID", x: 35, y: 48 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "M. CAICEDO", number: 25, position: "MID", x: 65, y: 48 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "N. MADUEKE", number: 11, position: "MID", x: 20, y: 30 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "COLE PALMER", number: 20, position: "MID", x: 50, y: 30 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "R. NETO", number: 7, position: "MID", x: 80, y: 30 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "N. JACKSON", number: 15, position: "ATT", x: 50, y: 12 }
      ]
    };
  }

  if (normName.includes('arsenal')) {
    return {
      formation: "4-3-3",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "DAVID RAYA", number: 22, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "W. SALIBA", number: 2, position: "DEF", x: 35, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "GABRIEL M.", number: 6, position: "DEF", x: 65, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "J. TIMBER", number: 12, position: "DEF", x: 15, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "BEN WHITE", number: 4, position: "DEF", x: 85, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "M. ØDEGAARD", number: 8, position: "MID", x: 32, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "THOMAS PARTEY", number: 5, position: "MID", x: 50, y: 32 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "DECLAN RICE", number: 41, position: "MID", x: 68, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "G. MARTINELLI", number: 11, position: "ATT", x: 20, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "BUKAYO SAKA", number: 7, position: "ATT", x: 80, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "KAI HAVERTZ", number: 29, position: "ATT", x: 50, y: 10 }
      ]
    };
  }

  if (normName.includes('psg') || normName.includes('paris sg') || normName.includes('paris saint-germain') || normName.includes('paris s.g.')) {
    return {
      formation: "4-3-3",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "DONNARUMMA", number: 1, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "MARQUINHOS", number: 5, position: "DEF", x: 35, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "WILLIAN PACHO", number: 51, position: "DEF", x: 65, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "NUNO MENDES", number: 25, position: "DEF", x: 15, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "A. HAKIMI", number: 2, position: "DEF", x: 85, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "J. NEVES", number: 87, position: "MID", x: 32, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "VITINHA", number: 17, position: "MID", x: 50, y: 32 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "FABIAN RUIZ", number: 8, position: "MID", x: 68, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "B. BARCOLA", number: 29, position: "ATT", x: 20, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "O. DEMBÉLÉ", number: 10, position: "ATT", x: 80, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "R. KOLO MUANI", number: 23, position: "ATT", x: 50, y: 10 }
      ]
    };
  }

  if (normName.includes('france')) {
    return {
      formation: "4-3-3",
      players: [
        { id: `${isHome ? 'h' : 'a'}-p1`, name: "M. MAIGNAN", number: 16, position: "GK", x: 50, y: 90 },
        { id: `${isHome ? 'h' : 'a'}-p2`, name: "W. SALIBA", number: 4, position: "DEF", x: 35, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p3`, name: "D. UPAMECANO", number: 15, position: "DEF", x: 65, y: 72 },
        { id: `${isHome ? 'h' : 'a'}-p4`, name: "T. HERNANDEZ", number: 22, position: "DEF", x: 15, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p5`, name: "J. KOUNDÉ", number: 5, position: "DEF", x: 85, y: 65 },
        { id: `${isHome ? 'h' : 'a'}-p6`, name: "E. CAMAVINGA", number: 6, position: "MID", x: 32, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p7`, name: "N. KANTÉ", number: 13, position: "MID", x: 50, y: 32 },
        { id: `${isHome ? 'h' : 'a'}-p8`, name: "W. ZAÏRE-EMERY", number: 18, position: "MID", x: 68, y: 46 },
        { id: `${isHome ? 'h' : 'a'}-p9`, name: "B. BARCOLA", number: 20, position: "ATT", x: 20, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p10`, name: "O. DEMBÉLÉ", number: 11, position: "ATT", x: 80, y: 18 },
        { id: `${isHome ? 'h' : 'a'}-p11`, name: "K. MBAPPÉ", number: 10, position: "ATT", x: 50, y: 10 }
      ]
    };
  }

  // Fallback procedural builder (completely disjoint pools for home vs away to ensure 100% unique names)
  const poolHome = [
    "SILVA", "MENDES", "GOMES", "COSTA", "SANTOS", "RODRIGUES", "MARTINS", "PEREIRA", 
    "LIMA", "ALMEIDA", "FERREIRA", "SOUSA", "PINTO", "CARVALHO", "TEIXEIRA", "NGUYEN",
    "MBEMBA", "MUKOKO", "TSHIMANGA", "MUTEBA", "MUTOMBO", "MBOYO", "NGANDU", "BOLA",
    "KASONGO", "ILUNGA", "KALALA", "MULUMBA", "KABORE", "DIALLO", "TRAORE", "COULIBALY",
    "SOW", "KEITA", "KONATE", "CAMARA", "FADIGA", "SYLLA", "VALLEJO", "MUNIZ", "PEREZ", 
    "GARCIA", "FERNANDEZ", "MARTINEZ", "RODRIGUEZ", "GOMEZ", "LOPEZ", "HERNANDEZ", "ALVAREZ"
  ];

  const poolAway = [
    "HANSEN", "OLSEN", "JOHANSEN", "PEDERSEN", "LARSEN", "NILSEN", "KRISTIANSEN", "BERG", 
    "HAUGEN", "ERIKSEN", "SANDBERG", "HOLM", "SMITH", "JONES", "TAYLOR", "BROWN", "GREEN", 
    "WALKER", "WRIGHT", "CARTER", "EVANS", "ROBERTS", "WILSON", "DAVIS", "MILLER", "ROSSI", 
    "BIANCHI", "FERRARI", "RUSSO", "MORETTI", "CLARK", "ROBINSON", "HUDSON", "SIMPSON", "BEKER",
    "SCHMIDT", "MÜLLER", "WEBER", "KRAUSE", "SCHULZ", "FISCHER", "MAYER", "HERRMANN", "WAGNER"
  ];

  let pool = isHome ? poolHome : poolAway;

  if (normName.includes('fc') || normName.includes('sporting') || normName.includes('united') || normName.includes('athletic')) {
    pool = isHome 
      ? ["SMITH", "JONES", "TAYLOR", "BROWN", "WALKER", "WRIGHT", "CRISTO", "EVANS", "ALVES", "DIAS"]
      : ["CLARK", "ROBINSON", "HEALY", "WAGNER", "HARRIS", "LEWIS", "SCOTT", "YOUNG", "ADAMS", "MORRIS"];
  } else if (normName.match(/(no|se|dk|fi|oslo|grorud|junkeren|tromso|bod)/i)) {
    pool = isHome
      ? ["HANSEN", "OLSEN", "JOHANSEN", "PEDERSEN", "LARSEN", "NILSEN", "SANDBERG"]
      : ["KRISTIANSEN", "BERG", "HAUGEN", "ERIKSEN", "HOLM", "BAKKE", "STROM"];
  } else if (normName.match(/(fr|it|es|pt|madrid|barca|psg)/i)) {
    pool = isHome
      ? ["VALLEJO", "MUNIZ", "LIMA", "PEREZ", "GARCIA", "FERNANDEZ", "ROCHA"]
      : ["MARTINEZ", "RODRIGUEZ", "GOMEZ", "LOPEZ", "HERNANDEZ", "ALVAREZ", "RAMIREZ"];
  }

  const cleanSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
  };
  
  const seedString = teamName + (isHome ? " - Domicile" : " - Extérieur");
  const seedVal = cleanSeed(seedString);
  const shuffled = [...pool].sort((a, b) => {
    const scoreA = cleanSeed(a + seedVal);
    const scoreB = cleanSeed(b + seedVal);
    return scoreA - scoreB;
  });

  const getPlayerName = (idx: number) => {
    const rawName = shuffled[idx % shuffled.length];
    const initials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const initial = initials[(seedVal + idx) % initials.length];
    return `${initial}. ${rawName}`;
  };

  return {
    formation: isHome ? "4-3-3" : "4-4-2",
    players: [
      { id: `${isHome ? 'h' : 'a'}-f1`, name: getPlayerName(0), number: 1, position: "GK", x: 50, y: 90 },
      { id: `${isHome ? 'h' : 'a'}-f2`, name: getPlayerName(1), number: isHome ? 4 : 2, position: "DEF", x: 30, y: 72 },
      { id: `${isHome ? 'h' : 'a'}-f3`, name: getPlayerName(2), number: isHome ? 5 : 4, position: "DEF", x: 70, y: 72 },
      { id: `${isHome ? 'h' : 'a'}-f4`, name: getPlayerName(3), number: isHome ? 2 : 3, position: "DEF", x: 10, y: 65 },
      { id: `${isHome ? 'h' : 'a'}-f5`, name: getPlayerName(4), number: isHome ? 3 : 5, position: "DEF", x: 90, y: 65 },
      { id: `${isHome ? 'h' : 'a'}-f6`, name: getPlayerName(5), number: isHome ? 6 : 8, position: "MID", x: isHome ? 30 : 20, y: isHome ? 46 : 48 },
      { id: `${isHome ? 'h' : 'a'}-f7`, name: getPlayerName(6), number: isHome ? 8 : 6, position: "MID", x: isHome ? 70 : 40, y: isHome ? 46 : 48 },
      { id: `${isHome ? 'h' : 'a'}-f8`, name: getPlayerName(7), number: isHome ? 10 : 10, position: "MID", x: isHome ? 50 : 60, y: isHome ? 32 : 48 },
      { id: `${isHome ? 'h' : 'a'}-f9`, name: getPlayerName(8), number: isHome ? 7 : 11, position: "MID", x: isHome ? 20 : 80, y: isHome ? 18 : 48 },
      { id: `${isHome ? 'h' : 'a'}-f10`, name: getPlayerName(9), number: isHome ? 11 : 7, position: "ATT", x: isHome ? 80 : 35, y: isHome ? 18 : 15 },
      { id: `${isHome ? 'h' : 'a'}-f11`, name: getPlayerName(10), number: 9, position: "ATT", x: 50, y: 10 }
    ]
  };
}

interface MatchContextType {
  state: MatchState;
  upcomingMatches: UpcomingMatch[];
  ads: Ad[];
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  currentAdIndex: number;
  selectedLineupTeam: 'home' | 'away';
  activeLineup: Lineup;
  isPlayingSim: boolean;
  
  // Real External API integrations
  apiMatches: any[];
  allSelectableMatches: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  apiSource: string;
  isLoadingApi: boolean;
  apiError: string | null;
  apiDiagnostic: any | null;
  loadApiMatches: (date?: string) => Promise<void>;
  selectApiMatch: (matchId: string) => void;
  selectedApiMatchId: string;
  setSelectedApiMatchId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isAutoSyncActive: boolean;
  setIsAutoSyncActive: (active: boolean) => void;
  isAutoRefreshListActive: boolean;
  setIsAutoRefreshListActive: (active: boolean) => void;
  
  // Custom pinning & static token saving mode
  pinnedMatchIds: string[];
  setPinnedMatchIds: (ids: string[]) => void;
  pinnedLimit: number;
  setPinnedLimit: (limit: number) => void;
  isTokenSavingMode: boolean;
  setIsTokenSavingMode: (active: boolean) => void;
  
  // Mutations & Actions
  updateScore: (team: 'home' | 'away', change: number) => void;
  updateTimer: (minute: number, seconds: number) => void;
  togglePlay: () => void;
  triggerGoal: (team: 'home' | 'away', scorerName?: string) => void;
  triggerEvent: (type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'shot' | 'corner' | 'freekick' | 'offside', team: 'home' | 'away', player?: string, desc?: string) => void;
  setLineupTeam: (team: 'home' | 'away') => void;
  resetSimulation: () => void;
  setStreamSource: (source: 'camera' | 'greenscreen' | 'phone') => void;
  streamSource: 'camera' | 'greenscreen' | 'phone';
  phoneCamStreamId: string;
  triggerCustomAction: (title: string, description: string) => void;
  setTeamProperty: (team: 'home' | 'away', field: keyof TeamInfo, value: any) => void;
  showOverlayInstructions: boolean;
  setShowOverlayInstructions: (show: boolean) => void;
  competitionImage: string | null;
  setCompetitionImage: (image: string | null) => void;
  streamerLogo: string | null;
  setStreamerLogo: (logo: string | null) => void;
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
}



const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  function portlandCopy<T>(val: T): T {
    return JSON.parse(JSON.stringify(val));
  }

  // Try to safely deep copy initial configurations
  const getInitialMatchState = (): MatchState => ({
    homeTeam: portlandCopy(emptyHomeTeam),
    awayTeam: portlandCopy(emptyAwayTeam),
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    seconds: 0,
    isPlaying: false,
    status: 'UPCOMING',
    shortStatus: '1H',
    hasRealStats: false,
    hasRealLineups: false,
    competition: "SANS SIGNAL DIRECT",
    events: [],
    stats: {
      possession: 50,
      tirsTotal: [0, 0],
      tirsCadres: [0, 0],
      fautes: [0, 0],
      corners: [0, 0],
      cartonsJaunes: [0, 0],
      cartonsRouges: [0, 0],
      attaques: [0, 0],
      attaquesDangereuses: [0, 0]
    },
    currentEvent: undefined,
    isGoalNotificationActive: false,
    goalNotificationTeam: undefined,
    goalScorerName: undefined,
    lastEventDescription: "Sourcing direct actif. Choisissez un match en direct dans la régie.",
    ballPosition: { x: 50, y: 50 },
    activeAttacker: 'none',
    xgHome: 0.0,
    xgAway: 0.0,
    viewers: 0,
    likes: 0
  });

  // Define base state matching static starting layout (waiting for direct API signal)
  const [matchState, setMatchState] = useState<MatchState>(() => {
    try {
      const saved = localStorage.getItem('matchState');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load matchState from localStorage", e);
    }
    return getInitialMatchState();
  });

  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const [ads, setAds] = useState<Ad[]>(() => {
    try {
      const saved = localStorage.getItem('broadcastAds');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load advertisements state", e);
    }
    return initialAds;
  });

  useEffect(() => {
    localStorage.setItem('broadcastAds', JSON.stringify(ads));
  }, [ads]);

  const [selectedLineupTeam, setSelectedLineupTeam] = useState<'home' | 'away'>(() => {
    try {
      const saved = localStorage.getItem('selectedLineupTeam');
      if (saved === 'home' || saved === 'away') {
        return saved;
      }
    } catch {}
    return 'home';
  });

  const [streamSource, setStreamSource] = useState<'camera' | 'greenscreen' | 'phone'>(() => {
    try {
      const saved = localStorage.getItem('streamSource');
      if (saved === 'camera' || saved === 'greenscreen' || saved === 'phone') {
        return saved as any;
      }
    } catch {}
    return 'greenscreen';
  });

  const [phoneCamStreamId, setPhoneCamStreamId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('phoneCamStreamId');
      if (saved) return saved;
      const generated = 'regie-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('phoneCamStreamId', generated);
      return generated;
    } catch {
      return 'regie-' + Math.random().toString(36).substring(2, 9);
    }
  });

  const [isPlayingSim, setIsPlayingSim] = useState(() => {
    try {
      const saved = localStorage.getItem('isPlayingSim');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Real External API integrations
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('selectedDate');
      return saved || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });

  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(true);
  const [isAutoRefreshListActive, setIsAutoRefreshListActive] = useState<boolean>(true);

  const [showOverlayInstructions, setShowOverlayInstructions] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('showOverlayInstructions');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [competitionImage, setCompetitionImageState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('competitionImage') || null;
    } catch {
      return null;
    }
  });

  const setCompetitionImage = (image: string | null) => {
    setCompetitionImageState(image);
    try {
      if (image) {
        localStorage.setItem('competitionImage', image);
      } else {
        localStorage.removeItem('competitionImage');
      }
    } catch (e) {
      console.error("Failed to save competitionImage to localStorage", e);
    }
    
    // Non-blocking background sync of the heavy asset to the server
    const isOverlay = typeof window !== 'undefined' && 
      (window.location.search.includes('overlay') || window.location.hash.includes('overlay'));
    if (!isOverlay) {
      fetch('/api/sync/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionImage: image })
      }).catch(err => console.error("Failed to sync competitionImage:", err));
    }
  };

  const [streamerLogo, setStreamerLogoState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('streamerLogo') || null;
    } catch {
      return null;
    }
  });

  const setStreamerLogo = (logo: string | null) => {
    setStreamerLogoState(logo);
    try {
      if (logo) {
        localStorage.setItem('streamerLogo', logo);
      } else {
        localStorage.removeItem('streamerLogo');
      }
    } catch (e) {
      console.error("Failed to save streamerLogo to localStorage", e);
    }
    
    // Non-blocking background sync of the heavy asset to the server
    const isOverlay = typeof window !== 'undefined' && 
      (window.location.search.includes('overlay') || window.location.hash.includes('overlay'));
    if (!isOverlay) {
      fetch('/api/sync/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamerLogo: logo })
      }).catch(err => console.error("Failed to sync streamerLogo:", err));
    }
  };

  const [backgroundImage, setBackgroundImageState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('backgroundImage') || null;
    } catch {
      return null;
    }
  });

  const setBackgroundImage = (image: string | null) => {
    setBackgroundImageState(image);
    try {
      if (image) {
        localStorage.setItem('backgroundImage', image);
      } else {
        localStorage.removeItem('backgroundImage');
      }
    } catch (e) {
      console.error("Failed to save backgroundImage to localStorage", e);
    }
    
    // Non-blocking background sync of the heavy asset to the server
    const isOverlay = typeof window !== 'undefined' && 
      (window.location.search.includes('overlay') || window.location.hash.includes('overlay'));
    if (!isOverlay) {
      fetch('/api/sync/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundImage: image })
      }).catch(err => console.error("Failed to sync backgroundImage:", err));
    }
  };

  useEffect(() => {
    localStorage.setItem('showOverlayInstructions', String(showOverlayInstructions));
  }, [showOverlayInstructions]);

  // Load initially pinned matches state
  const [pinnedMatchIds, setPinnedMatchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pinnedMatchIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pinnedLimit, setPinnedLimit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pinnedLimit');
      return saved ? parseInt(saved) : 5;
    } catch {
      return 5;
    }
  });

  const [isTokenSavingMode, setIsTokenSavingMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isTokenSavingMode');
      return saved ? JSON.parse(saved) === true : true;
    } catch {
      return true;
    }
  });

  // Persists states when they transform locally
  useEffect(() => {
    localStorage.setItem('matchState', JSON.stringify(matchState));
  }, [matchState]);

  useEffect(() => {
    localStorage.setItem('selectedLineupTeam', selectedLineupTeam);
  }, [selectedLineupTeam]);

  useEffect(() => {
    localStorage.setItem('streamSource', streamSource);
  }, [streamSource]);

  useEffect(() => {
    localStorage.setItem('isPlayingSim', String(isPlayingSim));
  }, [isPlayingSim]);

  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem('pinnedMatchIds', JSON.stringify(pinnedMatchIds));
  }, [pinnedMatchIds]);

  useEffect(() => {
    localStorage.setItem('pinnedLimit', String(pinnedLimit));
  }, [pinnedLimit]);

  useEffect(() => {
    localStorage.setItem('isTokenSavingMode', JSON.stringify(isTokenSavingMode));
  }, [isTokenSavingMode]);

  const [apiMatches, setApiMatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [fetchedStats, setFetchedStats] = useState<any>(null);
  const [fetchedLineups, setFetchedLineups] = useState<any>(null);
  const [fetchedDetails, setFetchedDetails] = useState<any>(null);
  const [isFetchingStats, setIsFetchingStats] = useState<boolean>(false);
  const [isFetchingLineups, setIsFetchingLineups] = useState<boolean>(false);

  const allSelectableMatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return [...apiMatches];
    }
    const query = searchQuery.toLowerCase().trim();
    return apiMatches.filter(m => 
      m.homeTeam.name.toLowerCase().includes(query) ||
      m.awayTeam.name.toLowerCase().includes(query) ||
      m.competition.toLowerCase().includes(query)
    );
  }, [apiMatches, searchQuery]);

  const [apiSource, setApiSource] = useState<string>('mock');
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiDiagnostic, setApiDiagnostic] = useState<any | null>(null);
  const [selectedApiMatchId, setSelectedApiMatchId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('selectedApiMatchId');
      return saved || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    localStorage.setItem('selectedApiMatchId', selectedApiMatchId);
  }, [selectedApiMatchId]);

  // Real-time Storage Sync to coordinate between controller/Régie and OBS overlay windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'matchState' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setMatchState((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(parsed)) {
              return prev;
            }
            return parsed;
          });
        } catch {}
      }
      if (e.key === 'selectedApiMatchId' && e.newValue !== null) {
        hasAutoSelectedRef.current = true;
        const val = e.newValue;
        setSelectedApiMatchId((prev) => prev === val ? prev : val);
      }
      if (e.key === 'selectedDate' && e.newValue !== null) {
        const val = e.newValue;
        setSelectedDate((prev) => prev === val ? prev : val);
      }
      if (e.key === 'pinnedMatchIds' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPinnedMatchIds((prev) => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        } catch {}
      }
      if (e.key === 'pinnedLimit' && e.newValue) {
        const val = parseInt(e.newValue) || 2;
        setPinnedLimit((prev) => prev === val ? prev : val);
      }
      if (e.key === 'isTokenSavingMode' && e.newValue) {
        const val = e.newValue === 'true';
        setIsTokenSavingMode((prev) => prev === val ? prev : val);
      }
      if (e.key === 'streamSource' && e.newValue) {
        if (e.newValue === 'camera' || e.newValue === 'greenscreen' || e.newValue === 'phone') {
          const val = e.newValue;
          setStreamSource((prev) => prev === val ? prev : val);
        }
      }
      if (e.key === 'selectedLineupTeam' && e.newValue) {
        if (e.newValue === 'home' || e.newValue === 'away') {
          const val = e.newValue;
          setSelectedLineupTeam((prev) => prev === val ? prev : val);
        }
      }
      if (e.key === 'isPlayingSim' && e.newValue) {
        const val = e.newValue === 'true';
        setIsPlayingSim((prev) => prev === val ? prev : val);
      }
      if (e.key === 'showOverlayInstructions' && e.newValue !== null) {
        const val = e.newValue === 'true';
        setShowOverlayInstructions((prev) => prev === val ? prev : val);
      }
      if (e.key === 'streamerLogo') {
        setStreamerLogoState(e.newValue || null);
      }
      if (e.key === 'competitionImage') {
        setCompetitionImageState(e.newValue || null);
      }
      if (e.key === 'backgroundImage') {
        setBackgroundImageState(e.newValue || null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isOverlayMode = typeof window !== 'undefined' && 
    (window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true') ||
     window.location.search.includes('studio=true') || window.location.hash.includes('studio=true'));

  // Track the synchronized version of media assets to trigger low-frequency fetches
  const assetsVersionRef = useRef<number>(-999);
  const hasAutoSelectedRef = useRef<boolean>(false);
  const lastPinnedChangeRef = useRef<number>(0);

  // 1. Controller Mode: Push lightweight real-time state updates to server
  useEffect(() => {
    if (isOverlayMode) return;

  const payload = {
    selectedApiMatchId,
    streamSource,
    selectedLineupTeam,
    selectedDate,
    isTokenSavingMode,
    isPlayingSim,
    pinnedMatchIds,
    matchState,
    phoneCamStreamId,
    ads          // ← AJOUTER cette ligne
  };

    const timer = setTimeout(() => {
      fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Failed to push state sync:", err));
    }, 250);

    return () => clearTimeout(timer);
  }, [
    isOverlayMode,
    selectedApiMatchId,
    streamSource,
    selectedLineupTeam,
    selectedDate,
    isTokenSavingMode,
    isPlayingSim,
    pinnedMatchIds,
    matchState,
    phoneCamStreamId
  ]);

  // Push local storage assets (backgroundImage, competitionImage, streamerLogo) once on startup
  useEffect(() => {
    if (isOverlayMode) return;
    
    const syncInitialAssets = async () => {
      try {
        const bg = localStorage.getItem('backgroundImage');
        const comp = localStorage.getItem('competitionImage');
        const logo = localStorage.getItem('streamerLogo');
        
        if (bg || comp || logo) {
          await fetch('/api/sync/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              backgroundImage: bg,
              competitionImage: comp,
              streamerLogo: logo
            })
          });
          console.log("Successfully synced initial assets to server.");
        }
      } catch (err) {
        console.error("Failed to sync initial assets to server:", err);
      }
    };

    const timer = setTimeout(syncInitialAssets, 1500);
    return () => clearTimeout(timer);
  }, [isOverlayMode]);

  // 2. Overlay Mode: Pull updates from server periodically
  useEffect(() => {
    if (!isOverlayMode) return;

    let isMounted = true;
    const fetchSharedState = async () => {
      try {
        const res = await fetch('/api/sync/state');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data) return;

        if (data.selectedApiMatchId !== undefined && data.selectedApiMatchId !== selectedApiMatchId) {
          setSelectedApiMatchId(data.selectedApiMatchId);
        }
        if (data.streamSource !== undefined && data.streamSource !== streamSource) {
          setStreamSource(data.streamSource);
        }
        if (data.selectedLineupTeam !== undefined && data.selectedLineupTeam !== selectedLineupTeam) {
          setSelectedLineupTeam(data.selectedLineupTeam);
        }
        if (data.selectedDate !== undefined && data.selectedDate !== selectedDate) {
          setSelectedDate(data.selectedDate);
        }
        if (data.isTokenSavingMode !== undefined && data.isTokenSavingMode !== isTokenSavingMode) {
          setIsTokenSavingMode(data.isTokenSavingMode);
        }
        if (data.isPlayingSim !== undefined && data.isPlayingSim !== isPlayingSim) {
          setIsPlayingSim(data.isPlayingSim);
        }
        if (data.phoneCamStreamId !== undefined && data.phoneCamStreamId !== phoneCamStreamId) {
          setPhoneCamStreamId(data.phoneCamStreamId);
        }
        if (data.pinnedMatchIds !== undefined && 
          JSON.stringify(data.pinnedMatchIds) !== JSON.stringify(pinnedMatchIds) &&
          Date.now() - lastPinnedChangeRef.current > 2000) {  // ← attendre 2s après un changement local
          setPinnedMatchIds(data.pinnedMatchIds);
        }
        if (data.matchState) {
          setMatchState(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.matchState)) {
              return prev;
            }
            return data.matchState;
          });
        }
        if (data.ads && Array.isArray(data.ads)) {
          setAds(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.ads)) return prev;
            return data.ads;
          });
        }
        // Fetch assets on first load OR when assetsVersion increments on the server
        const isFirstPoll = assetsVersionRef.current === -999;
        if (isFirstPoll || (data.assetsVersion !== undefined && data.assetsVersion !== assetsVersionRef.current)) {
          assetsVersionRef.current = data.assetsVersion ?? assetsVersionRef.current;
          
          const assetsRes = await fetch('/api/sync/assets');
          if (assetsRes.ok) {
            const assetsData = await assetsRes.json();
            if (isMounted && assetsData) {
              if (assetsData.backgroundImage !== undefined) {
                setBackgroundImageState(assetsData.backgroundImage);
              }
              if (assetsData.competitionImage !== undefined) {
                setCompetitionImageState(assetsData.competitionImage);
              }
              if (assetsData.streamerLogo !== undefined) {
                setStreamerLogoState(assetsData.streamerLogo);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch shared state sync:", err);
      }
    };

    fetchSharedState();
    const interval = setInterval(fetchSharedState, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [
    isOverlayMode,
    selectedApiMatchId,
    streamSource,
    selectedLineupTeam,
    selectedDate,
    isTokenSavingMode,
    isPlayingSim,
    pinnedMatchIds,
    phoneCamStreamId
  ]);

  const loadApiMatches = async (dateParam?: string) => {
    setIsLoadingApi(true);
    setApiError(null);
    setApiDiagnostic(null);
    const dateToFetch = dateParam || selectedDate;
    try {
      const data = await fetchLiveMatches(dateToFetch);
      setApiSource(data.source || 'mock');
      
      if (data.error || data.message) {
        setApiError(data.message || data.error || "Connexion API indisponible");
        if (data.diagnostic) {
          setApiDiagnostic(data.diagnostic);
        }
      }
      
      if (data.matches) {
        setApiMatches(data.matches);
      } else if (!data.error && !data.message) {
        throw new Error("L'API n'a pas retourné de liste de matchs valide.");
      }
    } catch (err: any) {
      console.error("loadApiMatches failed:", err);
      setApiError("Connexion API indisponible. Vérifiez votre fichier d'environnement.");
    } finally {
      setIsLoadingApi(false);
    }
  };

  const selectApiMatch = (matchId: string) => {
    hasAutoSelectedRef.current = true;
    setSelectedApiMatchId(matchId);
    setIsPlayingSim(false);
    setFetchedStats(null);
    setFetchedLineups(null);
    setFetchedDetails(null);
    const selected = apiMatches.find(m => String(m.id) === String(matchId));
    if (selected) {
      setMatchState(prev => ({
        ...prev,
        status: selected.status || 'IN_PLAY',
        shortStatus: selected.shortStatus || '',
        extraTime: selected.extraTime || undefined,
        date: selected.date,
        hasRealStats: selected.hasRealStats ?? false,
        hasRealLineups: selected.hasRealLineups ?? false,
        homeTeam: {
          ...prev.homeTeam,
          name: selected.homeTeam.name,
          code: selected.homeTeam.code,
          shortName: selected.homeTeam.shortName || selected.homeTeam.name,
          logoUrl: selected.homeTeam.logoUrl || "⚽",
          color: selected.homeTeam.color || "#EF4444",
          textColor: selected.homeTeam.textColor || "#FFFFFF",
          apiTeamId: selected.homeTeam.apiTeamId
        },
        awayTeam: {
          ...prev.awayTeam,
          name: selected.awayTeam.name,
          code: selected.awayTeam.code,
          shortName: selected.awayTeam.shortName || selected.awayTeam.name,
          logoUrl: selected.awayTeam.logoUrl || "⚽",
          color: selected.awayTeam.color || "#2563EB",
          textColor: selected.awayTeam.textColor || "#FFFFFF",
          apiTeamId: selected.awayTeam.apiTeamId
        },
        homeScore: selected.homeScore,
        awayScore: selected.awayScore,
        minute: selected.minute,
        seconds: 0,
        competition: selected.competition,
        stats: {
          ...prev.stats,
          ...selected.stats
        },
        events: selected.events || [],
        isGoalNotificationActive: false
      }));
    }
  };

  // Continuous background auto synchronizer for the currently selected API match
  useEffect(() => {
    if (isOverlayMode) return; // Prevent local auto sync in OBS overlay
    if (!isAutoSyncActive) return;
    if (selectedApiMatchId && apiMatches.length > 0) {
      const selectedFromList = apiMatches.find(m => String(m.id) === String(selectedApiMatchId));
      if (selectedFromList) {
        // Use full rich details containing events if we successfully fetched them and the ID matches
        const selected = (fetchedDetails && String(fetchedDetails.id) === String(selectedApiMatchId)) ? fetchedDetails : selectedFromList;
        setMatchState(prev => {
          // Detect real-time goal scored to trigger live tv overlays
          let triggerGoalHome = false;
          let triggerGoalAway = false;
          let scorerName = undefined;

          if (selected.homeScore > prev.homeScore) {
            triggerGoalHome = true;
            const goalEvent = (selected.events || []).find((e: any) => e.type?.toLowerCase() === 'goal' && e.team?.toLowerCase() === 'home');
            scorerName = goalEvent?.player || "Buteur";
          } else if (selected.awayScore > prev.awayScore) {
            triggerGoalAway = true;
            const goalEvent = (selected.events || []).find((e: any) => e.type?.toLowerCase() === 'goal' && e.team?.toLowerCase() === 'away');
            scorerName = goalEvent?.player || "Buteur";
          }

          return {
            ...prev,
            status: selected.status || 'IN_PLAY',
            shortStatus: selected.shortStatus || '',
            extraTime: selected.extraTime || undefined,
            date: selected.date,
            hasRealStats: selected.hasRealStats ?? false,
            hasRealLineups: selected.hasRealLineups ?? false,
            homeTeam: {
              ...prev.homeTeam,
              name: selected.homeTeam.name,
              code: selected.homeTeam.code,
              shortName: selected.homeTeam.shortName || selected.homeTeam.name,
              logoUrl: selected.homeTeam.logoUrl || "⚽",
              color: selected.homeTeam.color || prev.homeTeam.color,
              textColor: selected.homeTeam.textColor || prev.homeTeam.textColor,
              apiTeamId: selected.homeTeam.apiTeamId
            },
            awayTeam: {
              ...prev.awayTeam,
              name: selected.awayTeam.name,
              code: selected.awayTeam.code,
              shortName: selected.awayTeam.shortName || selected.awayTeam.name,
              logoUrl: selected.awayTeam.logoUrl || "⚽",
              color: selected.awayTeam.color || prev.awayTeam.color,
              textColor: selected.awayTeam.textColor || prev.awayTeam.textColor,
              apiTeamId: selected.awayTeam.apiTeamId
            },
            homeScore: selected.homeScore,
            awayScore: selected.awayScore,
            minute: selected.minute,
            seconds: selected.status === 'FINISHED' ? 0 : prev.seconds,
            competition: selected.competition,
            stats: {
              ...prev.stats,
              ...selected.stats
            },
            events: selected.events || [],
            isGoalNotificationActive: triggerGoalHome || triggerGoalAway ? true : prev.isGoalNotificationActive,
            goalNotificationTeam: triggerGoalHome ? 'home' : (triggerGoalAway ? 'away' : prev.goalNotificationTeam),
            goalScorerName: scorerName || prev.goalScorerName,
            lastEventDescription: selected.events?.[0]?.description || prev.lastEventDescription
          };
        });
      }
    }
  }, [allSelectableMatches, selectedApiMatchId, fetchedDetails, isOverlayMode]);

  // Synchronize starting real api matches so we don't display Portugal vs Congo if we have real data!
  useEffect(() => {
    if (isOverlayMode) return; // Prevent autoselect overwriting when in OBS overlay mode!
    if (isPlayingSim) return; // Do not overwrite if currently in a simulation!
    if (hasAutoSelectedRef.current) return; // Only auto-select once on initial load

    if (apiMatches.length > 0) {
      const alreadySelectedExists = apiMatches.some(m => String(m.id) === String(selectedApiMatchId));
      if (!selectedApiMatchId){
        // PRIORITIZE LIVE MATCHES, THEN HALF_TIME, THEN FINISHED, THEN UPCOMING
        const bestMatch = apiMatches.find(m => m.status === 'IN_PLAY') ||
                          apiMatches.find(m => m.status === 'HALF_TIME') ||
                          apiMatches.find(m => m.status === 'FINISHED') ||
                          apiMatches[0];
        if (bestMatch) {
          hasAutoSelectedRef.current = true;
          selectApiMatch(bestMatch.id);
        }
      } else {
        // If we already have a selected match that exists in the list, count it as auto-selected
        hasAutoSelectedRef.current = true;
      }
    }
  }, [apiMatches, selectedApiMatchId, isOverlayMode, isPlayingSim]);

  // Fetch real statistics and layouts for the active direct match
  useEffect(() => {
    if (!selectedApiMatchId) {
      setFetchedStats(null);
      setFetchedLineups(null);
      setFetchedDetails(null);
      return;
    }

    let active = true;

    async function loadStatsAndLineups() {
      setIsFetchingStats(true);
      setIsFetchingLineups(true);

      // Instantly clear old statistics, details, and lineups on selection to prevent stale layouts
      setFetchedStats(null);
      setFetchedLineups(null);
      setFetchedDetails(null);

      try {
        const detailsRes = await fetchMatchDetails(selectedApiMatchId);
        if (active && detailsRes && detailsRes.success) {
          setFetchedDetails(detailsRes.match);
        }
      } catch (err) {
        console.warn("Error fetching real match details:", err);
      }

      try {
        const statsRes = await fetchMatchStats(selectedApiMatchId);
        if (active && statsRes && statsRes.success) {
          setFetchedStats(statsRes.response);
        }
      } catch (err) {
        console.warn("Error fetching real stats:", err);
      } finally {
        if (active) setIsFetchingStats(false);
      }

      try {
        const lineupsRes = await fetchMatchLineups(selectedApiMatchId);
        if (active && lineupsRes && lineupsRes.success) {
          setFetchedLineups(lineupsRes);
        }
      } catch (err) {
        console.warn("Error fetching real lineups:", err);
      } finally {
        if (active) setIsFetchingLineups(false);
      }
    }

    loadStatsAndLineups();

    // Auto Refresh stats & lineups along with match live polling
    const detailInterval = setInterval(() => {
      if (!isTokenSavingMode) {
        loadStatsAndLineups();
      }
    }, 30000); // 30 seconds polling matching guideline

    return () => {
      active = false;
      clearInterval(detailInterval);
    };
  }, [selectedApiMatchId, isTokenSavingMode]);

  // Real active match clock second-by-second updates
  useEffect(() => {
    if (isOverlayMode) return; // Prevent local second clock in OBS overlay (synchronized directly from controller!)
    if (!selectedApiMatchId) return;

    const activeMatch = apiMatches.find(m => String(m.id) === String(selectedApiMatchId));
    if (!activeMatch || activeMatch.status !== 'IN_PLAY') return;

    const interval = setInterval(() => {
      setMatchState(prev => {
        if (prev.status === 'HALF_TIME' || prev.status === 'FINISHED' || prev.status === 'UPCOMING') {
          return prev;
        }
        let nSecs = prev.seconds + 1;
        let nMin = prev.minute;
        if (nSecs >= 60) {
          nSecs = 0;
          nMin += 1;
        }

        // Smoothly fluctuate the radar ball position and active attacker based on real API possession stats
        let currentBallX = prev.ballPosition.x;
        let currentBallY = prev.ballPosition.y;
        let activeAtt = prev.activeAttacker;

        if (nSecs % 3 === 0) {
          const actionSeed = Math.random() * 100;
          const homePoss = prev.stats.possession || 50;
          
          if (actionSeed < homePoss - 8) {
            // Home attacks left to right (X goes up towards away goal)
            activeAtt = 'home';
            // Scale X higher for more dangerous threat if home shot total/on target is high
            const homeThreat = (prev.stats.tirsCadres[0] > prev.stats.tirsCadres[1]) ? 10 : 0;
            currentBallX = 52 + homeThreat + Math.floor(Math.random() * 22);
            currentBallY = 18 + Math.floor(Math.random() * 64);
          } else if (actionSeed > homePoss + 8) {
            // Away attacks right to left (X goes down towards home goal)
            activeAtt = 'away';
            // Scale X lower for more dangerous threat if away shot total/on target is high
            const awayThreat = (prev.stats.tirsCadres[1] > prev.stats.tirsCadres[0]) ? 10 : 0;
            currentBallX = 26 - awayThreat + Math.floor(Math.random() * 22);
            currentBallY = 18 + Math.floor(Math.random() * 64);
          } else {
            // Midfield fight
            activeAtt = 'none';
            currentBallX = 38 + Math.floor(Math.random() * 24);
            currentBallY = 12 + Math.floor(Math.random() * 76);
          }
        }

        return {
          ...prev,
          minute: nMin,
          seconds: nSecs,
          ballPosition: { x: currentBallX, y: currentBallY },
          activeAttacker: activeAtt
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedApiMatchId, apiMatches, isOverlayMode]);

  // Reset auto-select block when selectedDate changes so the best match of the new date can be auto-selected
  // Reset auto-select ONLY si aucun match n'est déjà sélectionné
  useEffect(() => {
    if (!selectedApiMatchId) {
      hasAutoSelectedRef.current = false;
    }
  }, [selectedDate]);

  useEffect(() => {
    loadApiMatches(selectedDate);
    // Auto refresh API match status list every 25 seconds for ultra-reactive live experience
    const interval = setInterval(() => {
      if (isAutoRefreshListActive && !isTokenSavingMode) {
        loadApiMatches(selectedDate);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [selectedDate, isAutoRefreshListActive, isTokenSavingMode]);

  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle auto ad rotation every 20 seconds
  useEffect(() => {
    adTimerRef.current = setInterval(() => {
      setCurrentAdIndex((prev) => {
        const len = ads.length;
        if (len <= 1) return 0;
        return (prev + 1) % len;
      });
    }, 15000); // 15 seconds rotation is dynamically responsive

    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [ads.length]);

  // Handle auto line-up composition rotation every 30 seconds (restarts whenever active team changes)
  useEffect(() => {
    if (isOverlayMode) return;

    const timer = setInterval(() => {
      setSelectedLineupTeam((prev) => (prev === 'home' ? 'away' : 'home'));
    }, 30000);

    return () => {
      clearInterval(timer);
    };
  }, [isOverlayMode]);

  // Live match simulator timer & behavior fluctuations
  useEffect(() => {
    // If a real API match is selected/active, completely disable local mock simulation!
    if (!isPlayingSim || selectedApiMatchId) return;

    simTimerRef.current = setInterval(() => {
      setMatchState((prev) => {
        if (prev.status === 'FINISHED' || prev.status === 'UPCOMING') {
          return prev;
        }

        if (prev.status === 'HALF_TIME') {
          const ticks = prev.halftimeTicks || 0;
          if (ticks >= 15) {
            return {
              ...prev,
              status: 'IN_PLAY',
              shortStatus: '2H',
              minute: 46,
              seconds: 0,
              halftimeTicks: 0,
              extraTime: undefined,
              lastEventDescription: "Début de la seconde période ! Les équipes reviennent sur le terrain."
            };
          }
          return {
            ...prev,
            halftimeTicks: ticks + 1
          };
        }

        let nSecs = prev.seconds + 1;
        let nMin = prev.minute;
        if (nSecs >= 60) {
          nSecs = 0;
          nMin += 1;
        }

        // Determine if we should set/maintain extra time in simulation
        let simExtraTime = prev.extraTime;
        const currentShortStatus = prev.shortStatus || '1H';

        if (currentShortStatus === '1H') {
          if (nMin >= 45) {
            simExtraTime = 3; // +3 minutes for 1st half extra time
          }
        } else if (currentShortStatus === '2H') {
          if (nMin >= 90) {
            simExtraTime = 5; // +5 minutes for 2nd half extra time
          }
        }

        // 1st Half check: at 48:00 (which is 45 + 3) under 1H, trigger halftime
        if (currentShortStatus === '1H' && nMin === 48 && nSecs === 0 && prev.status === 'IN_PLAY') {
          return {
            ...prev,
            status: 'HALF_TIME',
            shortStatus: 'HT',
            minute: 45,
            seconds: 0,
            halftimeTicks: 1,
            extraTime: undefined,
            lastEventDescription: "C'est la mi-temps ! L'arbitre siffle la fin de la première période."
          };
        }

        // 2nd Half check: at 95:00 (which is 90 + 5) under 2H, trigger finished
        if (currentShortStatus === '2H' && nMin === 95 && nSecs === 0) {
          return {
            ...prev,
            status: 'FINISHED',
            shortStatus: 'FT',
            minute: 90,
            seconds: 0,
            extraTime: undefined,
            lastEventDescription: "Fin du match ! Coup de sifflet final de l'arbitre."
          };
        }

        // Periodic event generator every ~30 to 45 seconds
        let updatedStats = { ...prev.stats };
        let updatedEvents = [...prev.events];
        let triggeredNotification = prev.isGoalNotificationActive;
        let notificationTeam = prev.goalNotificationTeam;
        let scorer = prev.goalScorerName;
        let nXgHome = prev.xgHome;
        let nXgAway = prev.xgAway;
        let actEvent = prev.currentEvent;
        let activeAtt = prev.activeAttacker;
        let lastDesc = prev.lastEventDescription;

        // Fluctuating BALL position and attacking state on radar
        let currentBallX = prev.ballPosition.x;
        let currentBallY = prev.ballPosition.y;

        // Smooth movement on real tactical radar pitch
        if (nSecs % 3 === 0) {
          const actionSeed = Math.random();
          if (actionSeed > 0.65) {
            // Hot action Home
            activeAtt = 'home';
            currentBallX = 25 + Math.floor(Math.random() * 20); // Portuguese attack zone
            currentBallY = 30 + Math.floor(Math.random() * 40);
          } else if (actionSeed < 0.35) {
            // Hot action Away
            activeAtt = 'away';
            currentBallX = 65 + Math.floor(Math.random() * 15); // RD Congo attack zone
            currentBallY = 30 + Math.floor(Math.random() * 40);
          } else {
            activeAtt = 'none';
            currentBallX = 40 + Math.floor(Math.random() * 20); // Midfield brawl
            currentBallY = 20 + Math.floor(Math.random() * 60);
          }
        }

        // Minor stats fluctuate + user viewer counts
        const nViewers = prev.viewers + (Math.random() > 0.5 ? Math.floor(Math.random() * 4) : -Math.floor(Math.random() * 3));
        const nLikes = prev.likes + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0);

        // Every 35 seconds, simulate minor match statistics increments
        if (nSecs === 12 || nSecs === 42) {
          const randSeed = Math.random();
          // Adjust possession within realistic limits 72% to 80%
          const possessionFluct = Math.random() > 0.5 ? 1 : -1;
          const targetPos = prev.stats.possession + possessionFluct;
          updatedStats.possession = Math.min(84, Math.max(70, targetPos));

          if (randSeed > 0.8) {
            // Attack!
            const attacker = randSeed > 0.9 ? 'home' : 'away';
            if (attacker === 'home') {
              updatedStats.tirsTotal[0] += 1;
              nXgHome = parseFloat((nXgHome + 0.12).toFixed(2));
              activeAtt = 'home';
              currentBallX = 18;
              currentBallY = 50;
              
              const cadrSeed = Math.random();
              if (cadrSeed > 0.5) {
                updatedStats.tirsCadres[0] += 1;
                // Add event live feed
                const names = ["Ronaldo", "B. Silva", "B. Fernandes", "P. Neto"];
                const shooter = names[Math.floor(Math.random() * names.length)];
                
                const newEv: MatchEvent = {
                  id: "ev-" + Date.now(),
                  type: "shot",
                  minute: nMin,
                  second: nSecs,
                  team: "home",
                  player: shooter,
                  description: `Grosse occasion pour le Portugal ! Frappe de ${shooter} stoppée par le gardien.`
                };
                updatedEvents.unshift(newEv);
                if (updatedEvents.length > 50) updatedEvents.length = 50;
                actEvent = newEv;
                lastDesc = newEv.description;
              }
            } else {
              updatedStats.tirsTotal[1] += 1;
              nXgAway = parseFloat((nXgAway + 0.08).toFixed(2));
              activeAtt = 'away';
              currentBallX = 82;
              currentBallY = 48;

              const cadrSeed = Math.random();
              if (cadrSeed > 0.6) {
                updatedStats.tirsCadres[1] += 1;
                const names = ["S. Banza", "Y. Wissa", "G. Kakuta"];
                const shooter = names[Math.floor(Math.random() * names.length)];
                
                const newEv: MatchEvent = {
                  id: "ev-" + Date.now(),
                  type: "shot",
                  minute: nMin,
                  second: nSecs,
                  team: "away",
                  player: shooter,
                  description: `Contre-attaque éclair de la RD Congo. Tir cadré de ${shooter} bien capté par Costa.`
                };
                updatedEvents.unshift(newEv);
                if (updatedEvents.length > 50) updatedEvents.length = 50;
                actEvent = newEv;
                lastDesc = newEv.description;
              }
            }
          } else if (randSeed > 0.65) {
            // Foul or corner
            const isCorner = Math.random() > 0.5;
            const eventTeam = Math.random() > 0.4 ? 'home' : 'away';
            const teamIdx = eventTeam === 'home' ? 0 : 1;
            
            if (isCorner) {
              updatedStats.corners[teamIdx] += 1;
              const newEv: MatchEvent = {
                id: "ev-" + Date.now(),
                type: "corner",
                minute: nMin,
                second: nSecs,
                team: eventTeam,
                player: eventTeam === 'home' ? "B. Fernandes" : "M. Elia",
                description: `Corner obtenu pour ${eventTeam === 'home' ? 'le Portugal' : 'la RD Congo'}.`
              };
              updatedEvents.unshift(newEv);
              if (updatedEvents.length > 50) updatedEvents.length = 50;
              actEvent = newEv;
              lastDesc = newEv.description;
            } else {
              updatedStats.fautes[teamIdx] += 1;
              const newEv: MatchEvent = {
                id: "ev-" + Date.now(),
                type: "foul",
                minute: nMin,
                second: nSecs,
                team: eventTeam === 'home' ? 'away' : 'home', // fouled on
                player: "Arbitre",
                description: `Faute signalée contre ${eventTeam === 'home' ? 'le Portugal' : 'la RD Congo'}.`
              };
              updatedEvents.unshift(newEv);
              if (updatedEvents.length > 50) updatedEvents.length = 50;
              actEvent = {
                id: "ev-curr-" + Date.now(),
                type: "freekick",
                minute: nMin,
                second: nSecs,
                team: eventTeam === 'home' ? 'away' : 'home',
                player: "Coup franc",
                description: `Coup franc ${nMin}'`
              };
              lastDesc = newEv.description;
            }
          }
        }

        return {
          ...prev,
          minute: nMin,
          seconds: nSecs,
          extraTime: simExtraTime,
          stats: updatedStats,
          events: updatedEvents,
          viewers: nViewers,
          likes: nLikes,
          activeAttacker: activeAtt,
          ballPosition: { x: currentBallX, y: currentBallY },
          xgHome: nXgHome,
          xgAway: nXgAway,
          currentEvent: actEvent,
          lastEventDescription: lastDesc
        };
      });
    }, 1000);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isPlayingSim]);

  // Goal notification clear timer (auto hide after 6 seconds)
  useEffect(() => {
    if (matchState.isGoalNotificationActive) {
      const gTimer = setTimeout(() => {
        setMatchState((prev) => ({
          ...prev,
          isGoalNotificationActive: false,
          goalNotificationTeam: undefined,
          goalScorerName: undefined
        }));
      }, 6500);
      return () => clearTimeout(gTimer);
    }
  }, [matchState.isGoalNotificationActive]);

  // Mutation Actions
  const updateScore = (team: 'home' | 'away', change: number) => {
    setMatchState((prev) => {
      const isHome = team === 'home';
      const currentScore = isHome ? prev.homeScore : prev.awayScore;
      const newScore = Math.max(0, currentScore + change);

      return {
        ...prev,
        homeScore: isHome ? newScore : prev.homeScore,
        awayScore: isHome ? prev.awayScore : newScore
      };
    });
  };

  const updateTimer = (minute: number, seconds: number) => {
    setMatchState((prev) => ({
      ...prev,
      minute,
      seconds: Math.min(59, Math.max(0, seconds))
    }));
  };

  const togglePlay = () => {
    setIsPlayingSim(!isPlayingSim);
  };

  const triggerGoal = (team: 'home' | 'away', scorerName?: string) => {
    setMatchState((prev) => {
      const isHome = team === 'home';
      const actualScorer = scorerName || (isHome 
        ? ["RONALDO", "B. FERNANDES", "B. SILVA", "J. NEVES"][Math.floor(Math.random() * 4)] 
        : ["S. BANZA", "Y. WISSA", "G. KAKUTA", "M. ELIA"][Math.floor(Math.random() * 4)]
      );

      const nextHomeScore = isHome ? prev.homeScore + 1 : prev.homeScore;
      const nextAwayScore = isHome ? prev.awayScore : prev.awayScore + 1;

      // Add actual goal event
      const newGoalEvent: MatchEvent = {
        id: "ev-goal-" + Date.now(),
        type: "goal",
        minute: prev.minute,
        second: prev.seconds,
        team,
        player: actualScorer,
        description: `⚽ BUUUUUUT POUR ${team === 'home' ? prev.homeTeam.name.toUpperCase() : prev.awayTeam.name.toUpperCase()} MAILLOT ${actualScorer} !`
      };

      const updatedEvents = [newGoalEvent, ...prev.events].slice(0, 50);
      
      // Update stats: tirs, tirsCadrés, and xG
      const updatedStats = { ...prev.stats };
      if (isHome) {
        updatedStats.tirsTotal[0] += 1;
        updatedStats.tirsCadres[0] += 1;
      } else {
        updatedStats.tirsTotal[1] += 1;
        updatedStats.tirsCadres[1] += 1;
      }

      return {
        ...prev,
        homeScore: nextHomeScore,
        awayScore: nextAwayScore,
        events: updatedEvents,
        isGoalNotificationActive: true,
        goalNotificationTeam: team,
        goalScorerName: actualScorer,
        xgHome: isHome ? parseFloat((prev.xgHome + 0.75).toFixed(2)) : prev.xgHome,
        xgAway: !isHome ? parseFloat((prev.xgAway + 0.75).toFixed(2)) : prev.xgAway,
        stats: updatedStats,
        currentEvent: newGoalEvent,
        ballPosition: isHome ? { x: 5, y: 50 } : { x: 95, y: 50 }, // Inside goal
        lastEventDescription: `But fantastique inscrit par ${actualScorer} !`
      };
    });
  };

  const triggerEvent = (
    type: EventType,
    team: 'home' | 'away',
    player?: string,
    desc?: string
  ) => {
    setMatchState((prev) => {
      const isHome = team === 'home';
      const genericPlayer = player || (isHome 
        ? ["RONALDO", "B. FERNANDES", "VITINHA", "J. CANCELO"][Math.floor(Math.random() * 4)]
        : ["C. MBEMBA", "Y. WISSA", "A. MASUAKU", "S. MOUTOUSSAMY"][Math.floor(Math.random() * 4)]
      );

      const generatedDesc = desc || (
        type === 'yellow_card' ? `Carton jaune pour ${genericPlayer} pour tacle appuyé.` :
        type === 'red_card' ? `Carton rouge direct pour ${genericPlayer} après un vilain geste !` :
        type === 'foul' ? `Faute de ${genericPlayer} au milieu du terrain.` :
        type === 'shot' ? `Frappe puissante de ${genericPlayer} !` :
        type === 'corner' ? `Corner provoqué par ${genericPlayer}.` :
        type === 'freekick' ? `Coup franc obtenu par ${genericPlayer} sur l'aile.` :
        type === 'offside' ? `Position de hors-jeu signalée pour ${genericPlayer}.` :
        `Événement de match concernant ${genericPlayer}`
      );

      const newEv: MatchEvent = {
        id: "ev-" + Date.now(),
        type,
        minute: prev.minute,
        second: prev.seconds,
        team,
        player: genericPlayer,
        description: generatedDesc
      };

      const updatedEvents = [newEv, ...prev.events].slice(0, 50);
      const statsCopy = { ...prev.stats };
      let nXgHome = prev.xgHome;
      let nXgAway = prev.xgAway;

      if (type === 'yellow_card') {
        if (isHome) statsCopy.cartonsJaunes[0] += 1;
        else statsCopy.cartonsJaunes[1] += 1;
      } else if (type === 'red_card') {
        if (isHome) statsCopy.cartonsRouges[0] += 1;
        else statsCopy.cartonsRouges[1] += 1;
      } else if (type === 'corner') {
        if (isHome) statsCopy.corners[0] += 1;
        else statsCopy.corners[1] += 1;
      } else if (type === 'foul') {
        if (isHome) statsCopy.fautes[0] += 1;
        else statsCopy.fautes[1] += 1;
      } else if (type === 'shot') {
        if (isHome) {
          statsCopy.tirsTotal[0] += 1;
          if (Math.random() > 0.4) statsCopy.tirsCadres[0] += 1;
          nXgHome = parseFloat((nXgHome + 0.15).toFixed(2));
        } else {
          statsCopy.tirsTotal[1] += 1;
          if (Math.random() > 0.4) statsCopy.tirsCadres[1] += 1;
          nXgAway = parseFloat((nXgAway + 0.15).toFixed(2));
        }
      }

      return {
        ...prev,
        events: updatedEvents,
        stats: statsCopy,
        currentEvent: type === 'freekick' || type === 'corner' ? {
          id: "ev-curr-" + Date.now(),
          type,
          minute: prev.minute,
          second: prev.seconds,
          team,
          player: type === 'freekick' ? "Coup franc" : "Corner",
          description: generatedDesc
        } : prev.currentEvent,
        xgHome: nXgHome,
        xgAway: nXgAway,
        lastEventDescription: generatedDesc
      };
    });
  };

  const triggerCustomAction = (title: string, description: string) => {
    setMatchState((prev) => {
      const customEv: MatchEvent = {
        id: "ev-custom-" + Date.now(),
        type: 'freekick',
        minute: prev.minute,
        second: prev.seconds,
        team: 'home',
        player: title,
        description: description
      };
      return {
        ...prev,
        currentEvent: customEv,
        lastEventDescription: description,
        events: [customEv, ...prev.events]
      };
    });
  };

  const setTeamProperty = (team: 'home' | 'away', field: keyof TeamInfo, value: any) => {
    setMatchState((prev) => {
      if (team === 'home') {
        return {
          ...prev,
          homeTeam: { ...prev.homeTeam, [field]: value }
        };
      } else {
        return {
          ...prev,
          awayTeam: { ...prev.awayTeam, [field]: value }
        };
      }
    });
  };

  const setLineupTeam = (team: 'home' | 'away') => {
    setSelectedLineupTeam(team);
  };

  const resetSimulation = () => {
    setSelectedApiMatchId("");
    setMatchState({
      homeTeam: portlandCopy(emptyHomeTeam),
      awayTeam: portlandCopy(emptyAwayTeam),
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      seconds: 0,
      isPlaying: false,
      status: 'UPCOMING',
      shortStatus: '1H',
      hasRealStats: false,
      hasRealLineups: false,
      competition: "SANS SIGNAL DIRECT",
      events: [],
      stats: {
        possession: 50,
        tirsTotal: [0, 0],
        tirsCadres: [0, 0],
        fautes: [0, 0],
        corners: [0, 0],
        cartonsJaunes: [0, 0],
        cartonsRouges: [0, 0],
        attaques: [0, 0],
        attaquesDangereuses: [0, 0]
      },
      currentEvent: undefined,
      isGoalNotificationActive: false,
      goalNotificationTeam: undefined,
      goalScorerName: undefined,
      lastEventDescription: "Sourcing direct actif. Choisissez un match en direct dans la régie.",
      ballPosition: { x: 50, y: 50 },
      activeAttacker: 'none',
      xgHome: 0.0,
      xgAway: 0.0,
      viewers: 0,
      likes: 0
    });
  };

  const parsedStats: MatchStats = useMemo(() => {
    const defaultStats = matchState.stats;
    const statsSource = (fetchedStats && Array.isArray(fetchedStats) && fetchedStats.length > 0)
      ? fetchedStats
      : (fetchedDetails?.stats && Array.isArray(fetchedDetails.stats) && fetchedDetails.stats.length > 0)
        ? fetchedDetails.stats
        : null;

    if (!statsSource) {
      return defaultStats;
    }

    let statsObj: MatchStats = {
      possession: 50,
      tirsTotal: [0, 0] as [number, number],
      tirsCadres: [0, 0] as [number, number],
      fautes: [0, 0] as [number, number],
      corners: [0, 0] as [number, number],
      cartonsJaunes: [0, 0] as [number, number],
      cartonsRouges: [0, 0] as [number, number],
      attaques: [0, 0] as [number, number],
      attaquesDangereuses: [0, 0] as [number, number]
    };

    const getMetric = (teamStats: any[], typeName: string): any => {
      if (!teamStats || !Array.isArray(teamStats)) return null;
      const item = teamStats.find((s: any) => s.type?.toLowerCase() === typeName.toLowerCase());
      return item ? item.value : null;
    };

    const parseVal = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'string') {
        const parsed = parseInt(val.replace(/[^0-9]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      }
      return typeof val === 'number' ? val : 0;
    };

    const findTeamStats = (teamInfo: any, fallbackIndex: number) => {
      if (!statsSource || !Array.isArray(statsSource)) return null;

      // 1. Direct ID check (Most robust and reliable!)
      if (teamInfo?.apiTeamId) {
        const found = statsSource.find((item: any) => item?.team?.id === teamInfo.apiTeamId);
        if (found) return found;
      }

      // 2. Cleaned name check
      const clean = (name: string) => name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") || "";
      const teamCleaned = clean(teamInfo?.name || "");
      
      const matchByName = statsSource.find((item: any) => {
        const itemCleaned = clean(item?.team?.name || "");
        return itemCleaned === teamCleaned || 
               itemCleaned.includes(teamCleaned) || 
               teamCleaned.includes(itemCleaned);
      });
      if (matchByName) return matchByName;

      // 3. Fallback to indexing
      return statsSource[fallbackIndex] || null;
    };

    const homeStatData = findTeamStats(matchState.homeTeam, 0);
    const awayStatData = findTeamStats(matchState.awayTeam, 1);

    if (homeStatData && homeStatData.statistics) {
      const hPossRaw = getMetric(homeStatData.statistics, "Ball Possession");
      if (hPossRaw !== null && hPossRaw !== undefined) {
        statsObj.possession = parseVal(hPossRaw);
      }
      statsObj.tirsTotal[0] = parseVal(getMetric(homeStatData.statistics, "Total Shots"));
      statsObj.tirsCadres[0] = parseVal(getMetric(homeStatData.statistics, "Shots on Goal"));
      statsObj.fautes[0] = parseVal(getMetric(homeStatData.statistics, "Fouls"));
      statsObj.corners[0] = parseVal(getMetric(homeStatData.statistics, "Corner Kicks"));
      statsObj.cartonsJaunes[0] = parseVal(getMetric(homeStatData.statistics, "Yellow Cards"));
      statsObj.cartonsRouges[0] = parseVal(getMetric(homeStatData.statistics, "Red Cards"));
      if (statsObj.attaques) {
        statsObj.attaques[0] = parseVal(getMetric(homeStatData.statistics, "Attacks") || getMetric(homeStatData.statistics, "Attaques"));
      }
      if (statsObj.attaquesDangereuses) {
        statsObj.attaquesDangereuses[0] = parseVal(getMetric(homeStatData.statistics, "Dangerous Attacks") || getMetric(homeStatData.statistics, "Attaques dangereuses"));
      }
    }

    if (awayStatData && awayStatData.statistics) {
      statsObj.tirsTotal[1] = parseVal(getMetric(awayStatData.statistics, "Total Shots"));
      statsObj.tirsCadres[1] = parseVal(getMetric(awayStatData.statistics, "Shots on Goal"));
      statsObj.fautes[1] = parseVal(getMetric(awayStatData.statistics, "Fouls"));
      statsObj.corners[1] = parseVal(getMetric(awayStatData.statistics, "Corner Kicks"));
      statsObj.cartonsJaunes[1] = parseVal(getMetric(awayStatData.statistics, "Yellow Cards"));
      statsObj.cartonsRouges[1] = parseVal(getMetric(awayStatData.statistics, "Red Cards"));
      if (statsObj.attaques) {
        statsObj.attaques[1] = parseVal(getMetric(awayStatData.statistics, "Attacks") || getMetric(awayStatData.statistics, "Attaques"));
      }
      if (statsObj.attaquesDangereuses) {
        statsObj.attaquesDangereuses[1] = parseVal(getMetric(awayStatData.statistics, "Dangerous Attacks") || getMetric(awayStatData.statistics, "Attaques dangereuses"));
      }
      
      const hPossRaw = homeStatData ? getMetric(homeStatData.statistics, "Ball Possession") : null;
      if (hPossRaw === null || hPossRaw === undefined) {
        const aPossRaw = getMetric(awayStatData.statistics, "Ball Possession");
        if (aPossRaw !== null && aPossRaw !== undefined) {
          statsObj.possession = 100 - parseVal(aPossRaw);
        }
      }
    }

    return statsObj;
  }, [fetchedStats, matchState.stats, matchState.homeTeam.name, matchState.awayTeam.name]);

  const activeLineup = useMemo(() => {
    // If a real API match is selected and actual lineups were fetched/parsed from the API, use them!
    if (selectedApiMatchId && fetchedLineups) {
      // Protection to check if home and away have identically named players due to API or mapping errors
      const hNames = fetchedLineups.home?.players?.map((p: any) => p.name).join(',') || '';
      const aNames = fetchedLineups.away?.players?.map((p: any) => p.name).join(',') || '';
      const isDuplicated = hNames && aNames && hNames === aNames;

      if (!isDuplicated) {
        const isHome = selectedLineupTeam === 'home';
        const lineupTeamData = isHome ? fetchedLineups.home : fetchedLineups.away;
        if (lineupTeamData && Array.isArray(lineupTeamData.players) && lineupTeamData.players.length > 0) {
          return lineupTeamData as Lineup;
        }
      }
    }
    // Else, fall back to roster based on team names
    if (selectedApiMatchId) {
      const activeTeamObj = selectedLineupTeam === 'home' ? matchState.homeTeam : matchState.awayTeam;
      return generateLineupForTeam(activeTeamObj.name || "", activeTeamObj.color || (selectedLineupTeam === 'home' ? "#EF4444" : "#2563EB"), selectedLineupTeam === 'home');
    }
    // Fallback to standard lineupsData
    return lineupsData[selectedLineupTeam];
  }, [selectedApiMatchId, fetchedLineups, matchState.homeTeam.name, matchState.awayTeam.name, selectedLineupTeam]);

  const upcomingMatches = useMemo(() => {
    let list = [];
    if (pinnedMatchIds.length > 0) {
      list = apiMatches.filter(m => pinnedMatchIds.includes(String(m.id)));
    } else {
      // The admin themselves must explicitly choose which matches they want to display
      list = [];
    }
    return list.slice(0, pinnedLimit).map((m) => {
      let statusLabel = 'À venir';
      const hasStarted = ['IN_PLAY', 'LIVE', 'IN_PLAY_MOCK', '1H', '2H', 'HT', 'ET', 'P', 'BT', 'FINISHED', 'FT', 'AET', 'PEN'].includes(m.status);
      
      if (hasStarted) {
        statusLabel = `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`;
      } else if (m.date) {
        try {
          const d = new Date(m.date);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            statusLabel = `${day}/${month} ${hours}:${minutes}`;
          }
        } catch (e) {
          statusLabel = 'À venir';
        }
      }
      return {
        id: m.id,
        date: statusLabel,
        time: m.minute ? `${Math.floor(m.minute / 60)}h${m.minute % 60}` : "Direct",
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeTeamFlag: m.homeTeam.logoUrl || "⚽",
        awayTeamFlag: m.awayTeam.logoUrl || "⚽",
        competition: m.competition,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      };
    });
  }, [apiMatches, pinnedMatchIds, pinnedLimit]);

  return (
    <MatchContext.Provider
      value={{
        state: {
          ...matchState,
          stats: parsedStats
        },
        upcomingMatches,
        ads,
        setAds,
        currentAdIndex,
        selectedLineupTeam,
        activeLineup,
        isPlayingSim,
        
        // Pinned & Static Mode Customizations
        pinnedMatchIds,
        setPinnedMatchIds,
        pinnedLimit,
        setPinnedLimit,
        isTokenSavingMode,
        setIsTokenSavingMode,
        
        // API state & actions
        apiMatches,
        allSelectableMatches,
        searchQuery,
        setSearchQuery,
        apiSource,
        isLoadingApi,
        apiError,
        apiDiagnostic,
        loadApiMatches,
        selectApiMatch,
        selectedApiMatchId,
        setSelectedApiMatchId,
        selectedDate,
        setSelectedDate,
        isAutoSyncActive,
        setIsAutoSyncActive,
        isAutoRefreshListActive,
        setIsAutoRefreshListActive,
        
        updateScore,
        updateTimer,
        togglePlay,
        triggerGoal,
        triggerEvent,
        setLineupTeam,
        resetSimulation,
        setStreamSource,
        streamSource,
        phoneCamStreamId,
        triggerCustomAction,
        setTeamProperty,
        showOverlayInstructions,
        setShowOverlayInstructions,
        competitionImage,
        setCompetitionImage,
        streamerLogo,
        setStreamerLogo,
        backgroundImage,
        setBackgroundImage
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatchContext = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
};

// Required hooks mapping
export const useMatchData = () => {
  const { 
    state, 
    updateScore, 
    updateTimer, 
    triggerGoal, 
    isPlayingSim, 
    togglePlay, 
    resetSimulation, 
    streamSource, 
    setStreamSource, 
    setTeamProperty,
    apiMatches,
    allSelectableMatches,
    searchQuery,
    setSearchQuery,
    apiSource,
    isLoadingApi,
    apiError,
    loadApiMatches,
    selectApiMatch,
    selectedApiMatchId,
    setSelectedApiMatchId,
    selectedDate,
    setSelectedDate,
    isAutoSyncActive,
    setIsAutoSyncActive,
    isAutoRefreshListActive,
    setIsAutoRefreshListActive,
    pinnedMatchIds,
    setPinnedMatchIds,
    pinnedLimit,
    setPinnedLimit,
    isTokenSavingMode,
    setIsTokenSavingMode,
    phoneCamStreamId,
    showOverlayInstructions,
    setShowOverlayInstructions,
    competitionImage,
    setCompetitionImage,
    streamerLogo,
    setStreamerLogo,
    backgroundImage,
    setBackgroundImage
  } = useMatchContext();
  
  return {
    match: state,
    homeTeam: state.homeTeam,
    awayTeam: state.awayTeam,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    minute: state.minute,
    seconds: state.seconds,
    competition: state.competition,
    viewers: state.viewers,
    likes: state.likes,
    isPlayingSim,
    streamSource,
    setStreamSource,
    phoneCamStreamId,
    togglePlay,
    updateScore,
    updateTimer,
    triggerGoal,
    resetSimulation,
    setTeamProperty,
    // API
    apiMatches,
    allSelectableMatches,
    searchQuery,
    setSearchQuery,
    apiSource,
    isLoadingApi,
    apiError,
    loadApiMatches,
    selectApiMatch,
    selectedApiMatchId,
    setSelectedApiMatchId,
    selectedDate,
    setSelectedDate,
    isAutoSyncActive,
    setIsAutoSyncActive,
    isAutoRefreshListActive,
    setIsAutoRefreshListActive,
    pinnedMatchIds,
    setPinnedMatchIds,
    pinnedLimit,
    setPinnedLimit,
    isTokenSavingMode,
    setIsTokenSavingMode,
    showOverlayInstructions,
    setShowOverlayInstructions,
    competitionImage,
    setCompetitionImage,
    streamerLogo,
    setStreamerLogo,
    backgroundImage,
    setBackgroundImage
  };
};

export const useStats = () => {
  const { state, triggerEvent } = useMatchContext();
  return {
    stats: state.stats,
    possession: state.stats.possession,
    xgHome: state.xgHome,
    xgAway: state.xgAway,
    triggerEvent
  };
};

export const useLineup = () => {
  const { selectedLineupTeam, activeLineup, setLineupTeam } = useMatchContext();
  return {
    selectedTeamRef: selectedLineupTeam,
    lineup: activeLineup,
    setLineupTeam
  };
};

export const useAds = () => {
  const { ads, setAds, currentAdIndex } = useMatchContext();
  return {
    ads,
    setAds,
    currentAd: ads[currentAdIndex] || null,
    currentAdIndex
  };
};
