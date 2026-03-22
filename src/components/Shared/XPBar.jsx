// src/components/Shared/XPBar.jsx
// Reusable XP progress bar with level badge.
// Used in MainMenu header and module top bars.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';

const XP_PER_LEVEL = 100;

export default function XPBar({ compact = false }) {
  const { xp, level, xpInLevel, lastXpGain, lastXpReason } = useUserStore();
  const pct = (xpInLevel / XP_PER_LEVEL) * 100;

  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'w-full max-w-xs'}`}>
      {/* Level badge */}
      <div
        className="flex-shrink-0 flex items-center justify-center font-black"
        style={{
          width: compact ? 32 : 38, height: compact ? 32 : 38,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, #fbbf24, #d97706 60%, #92400e)',
          border: '2px solid rgba(251,191,36,0.8)',
          boxShadow: '0 0 12px rgba(251,191,36,0.4)',
          fontSize: compact ? 11 : 13,
          color: '#1c1008',
          fontFamily: 'var(--font-hs)',
        }}
      >
        {level}
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Label row */}
        {!compact && (
          <div className="flex justify-between" style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.08em' }}>
            <span style={{ fontFamily: 'var(--font-hs)' }}>LEVEL {level}</span>
            <span>{xpInLevel}/{XP_PER_LEVEL} XP</span>
          </div>
        )}

        {/* Bar */}
        <div style={{
          height: compact ? 4 : 6,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #d97706, #fbbf24)',
              transformOrigin: 'left',
              borderRadius: 4,
            }}
            animate={{ scaleX: pct / 100 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* XP gain toast */}
      <AnimatePresence>
        {lastXpGain > 0 && (
          <motion.span
            key={`xp-${xp}`}
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: compact ? 10 : 12,
              fontWeight: 900,
              color: '#fbbf24',
              whiteSpace: 'nowrap',
              textShadow: '0 0 8px rgba(251,191,36,0.6)',
              fontFamily: 'var(--font-hs)',
            }}
          >
            +{lastXpGain} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
