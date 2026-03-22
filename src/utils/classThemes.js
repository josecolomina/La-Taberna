// src/utils/classThemes.js
// Per-class colour tokens used by MulliganView, PuzzleBoard, and MainMenu.
// Each theme: accent (text/icon), glow (box-shadow), border (border-color).

export const CLASS_THEMES = {
  MAGE:        { accent: '#60a5fa', glow: 'rgba(96,165,250,0.38)',   border: 'rgba(96,165,250,0.65)',  bg: 'rgba(30,58,138,0.25)' },
  WARRIOR:     { accent: '#f87171', glow: 'rgba(248,113,113,0.38)',  border: 'rgba(248,113,113,0.65)', bg: 'rgba(127,29,29,0.25)' },
  PALADIN:     { accent: '#fbbf24', glow: 'rgba(251,191,36,0.38)',   border: 'rgba(251,191,36,0.65)',  bg: 'rgba(120,53,15,0.25)' },
  HUNTER:      { accent: '#4ade80', glow: 'rgba(74,222,128,0.38)',   border: 'rgba(74,222,128,0.65)',  bg: 'rgba(20,83,45,0.25)'  },
  DRUID:       { accent: '#fb923c', glow: 'rgba(251,146,60,0.38)',   border: 'rgba(251,146,60,0.65)',  bg: 'rgba(124,45,18,0.25)' },
  ROGUE:       { accent: '#a78bfa', glow: 'rgba(167,139,250,0.38)',  border: 'rgba(167,139,250,0.65)', bg: 'rgba(46,16,101,0.25)' },
  SHAMAN:      { accent: '#38bdf8', glow: 'rgba(56,189,248,0.38)',   border: 'rgba(56,189,248,0.65)',  bg: 'rgba(8,51,68,0.25)'   },
  WARLOCK:     { accent: '#c084fc', glow: 'rgba(192,132,252,0.38)',  border: 'rgba(192,132,252,0.65)', bg: 'rgba(59,7,100,0.25)'  },
  PRIEST:      { accent: '#e2e8f0', glow: 'rgba(226,232,240,0.28)',  border: 'rgba(226,232,240,0.45)', bg: 'rgba(30,41,59,0.25)'  },
  DEMONHUNTER: { accent: '#4ade80', glow: 'rgba(74,222,128,0.38)',   border: 'rgba(74,222,128,0.65)',  bg: 'rgba(20,83,45,0.25)'  },
  DEATHKNIGHT: { accent: '#94a3b8', glow: 'rgba(148,163,184,0.38)', border: 'rgba(148,163,184,0.55)', bg: 'rgba(15,23,42,0.35)'  },
  NEUTRAL:     { accent: '#d4af37', glow: 'rgba(212,175,55,0.35)',   border: 'rgba(212,175,55,0.50)',  bg: 'rgba(40,30,10,0.20)'  },
};

/** Returns the theme for a class, falling back to NEUTRAL. */
export function getClassTheme(heroClass) {
  return CLASS_THEMES[heroClass?.toUpperCase()] ?? CLASS_THEMES.NEUTRAL;
}
