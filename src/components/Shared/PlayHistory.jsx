// src/components/Shared/PlayHistory.jsx
// Left sidebar showing a log of every valid action taken this puzzle.
// Each entry shows: action icon + card name + target.
// Appears as a slim, dark translucent panel with a Hearthstone aesthetic.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

const ACTION_ICONS = {
  play_spell: '🔮',
  play_minion: '⚔️',
  attack: '💥',
};

const TARGET_LABELS = {
  enemy_hero: 'Enemy Hero',
  player_hero: 'Player Hero',
  player_board: 'Board',
};

function getTargetLabel(targetId) {
  return TARGET_LABELS[targetId] || `Minion (${targetId?.slice(0, 6)})`;
}

export default function PlayHistory() {
  const history = useGameStore(s => s.playHistory);

  return (
    <div
      className="flex flex-col gap-1 select-none"
      style={{
        width: 160,
        maxHeight: 760,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-xl text-center font-bold tracking-widest"
        style={{
          background: 'linear-gradient(180deg, #2a1e0a, #1a1200)',
          border: '2px solid rgba(180,140,60,0.5)',
          borderBottom: 'none',
          color: '#d4af37',
          fontSize: 11,
          fontFamily: 'var(--font-hs)',
          textShadow: '0 0 8px rgba(212,175,55,0.5)',
          letterSpacing: '0.15em',
        }}
      >
        PLAY LOG
      </div>

      <div
        className="flex-1 rounded-b-xl flex flex-col gap-1 p-2"
        style={{
          background: 'rgba(10,8,4,0.82)',
          border: '2px solid rgba(180,140,60,0.3)',
          borderTop: 'none',
          backdropFilter: 'blur(4px)',
          minHeight: 80,
        }}
      >
        <AnimatePresence initial={false}>
          {history.length === 0 && (
            <p
              className="text-center italic"
              style={{ fontSize: 10, color: 'rgba(180,160,120,0.4)', marginTop: 8 }}
            >
              No moves yet
            </p>
          )}
          {history.map((entry, i) => (
            <motion.div
              key={entry.timestamp + '-' + i}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg"
              style={{
                background: 'rgba(40,30,10,0.7)',
                border: '1px solid rgba(180,140,60,0.18)',
              }}
            >
              {/* Step number */}
              <span
                style={{
                  fontSize: 9,
                  color: '#d4af37',
                  fontWeight: 900,
                  minWidth: 14,
                  fontFamily: 'var(--font-hs)',
                }}
              >
                {i + 1}.
              </span>

              {/* Icon */}
              <span style={{ fontSize: 12, lineHeight: 1.2 }}>
                {ACTION_ICONS[entry.action] ?? '•'}
              </span>

              {/* Text */}
              <div className="flex flex-col" style={{ minWidth: 0 }}>
                <span
                  className="truncate"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#f0d060',
                    fontFamily: 'var(--font-hs)',
                    lineHeight: 1.3,
                  }}
                >
                  {entry.card?.name ?? (entry.sourceId?.slice(0, 10) ?? '—')}
                </span>
                <span
                  className="truncate"
                  style={{ fontSize: 8, color: 'rgba(200,180,140,0.6)', lineHeight: 1.3 }}
                >
                  → {getTargetLabel(entry.targetId)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
