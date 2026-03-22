// src/components/Menu/MainMenu.jsx
// Tavern-themed main menu. Entry point after DB finishes loading.
// Two mode cards: Find the Lethal (Puzzles) and Mulligan Simulator.

import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useGameStore } from '../../store/useGameStore';

const HS_GOLD = '#d4af37';

const MODULES = [
  {
    id:      'puzzle',
    icon:    '⚔',
    title:   'Find the Lethal',
    subtitle: 'Puzzle Mode',
    desc:    'Calculate combat math and spell combinations to deal the exact killing blow.',
    badge:   'TRAIN YOUR FINISHING INSTINCT',
    color:   '#7f1d1d',
    glow:    'rgba(220,38,38,0.35)',
    border:  'rgba(220,100,60,0.6)',
  },
  {
    id:      'board_clear',
    icon:    '🧹',
    title:   'Board Clear Challenge',
    subtitle: 'Efficiency & Order',
    desc:    'Use your resources optimally to wipe out the enemy board. +15 XP per victory.',
    badge:   'MASTER BOARD CONTROL',
    color:   '#14532d',
    glow:    'rgba(34,197,94,0.35)',
    border:  'rgba(74,222,128,0.6)',
  },
  {
    id:      'mulligan',
    icon:    '🃏',
    title:   'Mulligan Simulator',
    subtitle: 'Opening Hand Training',
    desc:    'Practice your mulligan decisions across different matchups with real winrate data.',
    badge:   'MASTER YOUR OPENING HAND',
    color:   '#1e3a5f',
    glow:    'rgba(59,130,246,0.35)',
    border:  'rgba(99,179,237,0.6)',
  },
];

export default function MainMenu() {
  const navigate = useAppStore(s => s.navigate);
  const dbCount  = useGameStore(s => s.dbCount);

  return (
    <motion.div
      className="flex flex-col items-center w-full min-h-screen py-10 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col items-center mb-12"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1
          className="tracking-[0.25em] uppercase mb-2"
          style={{
            fontFamily: 'var(--font-hs)',
            fontWeight: 900,
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            color: HS_GOLD,
            textShadow: '0 0 30px rgba(212,175,55,0.5), 0 4px 12px rgba(0,0,0,0.9)',
          }}
        >
          ⚡ Hearthstone Trainer ⚡
        </h1>
        <p style={{ color: '#475569', fontSize: 12, letterSpacing: '0.15em' }}>
          ✦ {dbCount.toLocaleString()} Standard cards ready ✦
        </p>
      </motion.div>

      {/* ── Decorative separator ──────────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-4 mb-12 w-full max-w-xl"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4))' }} />
        <span style={{ color: HS_GOLD, fontSize: 18, opacity: 0.6 }}>✦</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.4), transparent)' }} />
      </motion.div>

      {/* ── Mode cards ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch gap-6 w-full max-w-3xl">
        {MODULES.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 260, damping: 22 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="flex-1 flex flex-col cursor-pointer select-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${mod.color}80 0%, #0f0a06 80%)`,
              border: `2px solid ${mod.border}`,
              borderRadius: 20,
              padding: '32px 28px 28px',
              boxShadow: `0 0 40px ${mod.glow}, 0 8px 32px rgba(0,0,0,0.7)`,
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={() => navigate(mod.id)}
          >
            {/* Background texture glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${mod.glow} 0%, transparent 60%)`,
              }}
            />

            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, -3, 3, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
              style={{ fontSize: 52, lineHeight: 1, marginBottom: 16, position: 'relative', zIndex: 1 }}
            >
              {mod.icon}
            </motion.div>

            {/* Badge */}
            <span
              className="mb-3 inline-block tracking-widest uppercase"
              style={{
                fontSize: 9,
                color: HS_GOLD,
                opacity: 0.6,
                letterSpacing: '0.2em',
                fontFamily: 'var(--font-hs)',
              }}
            >
              {mod.badge}
            </span>

            {/* Title */}
            <h2
              className="mb-1"
              style={{
                fontFamily: 'var(--font-hs)',
                fontWeight: 900,
                fontSize: 'clamp(1.3rem, 3vw, 1.7rem)',
                color: '#f0e6c8',
                lineHeight: 1.1,
              }}
            >
              {mod.title}
            </h2>
            <p style={{ color: HS_GOLD, fontSize: 11, opacity: 0.7, marginBottom: 12, letterSpacing: '0.1em' }}>
              {mod.subtitle}
            </p>

            {/* Description */}
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, flex: 1 }}>
              {mod.desc}
            </p>

            {/* CTA button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="mt-6 w-full py-3 font-black tracking-widest uppercase relative z-10"
              style={{
                background: `linear-gradient(135deg, ${mod.color}, ${mod.color}cc)`,
                border: `2px solid ${mod.border}`,
                borderRadius: 10,
                color: '#f0e6c8',
                fontFamily: 'var(--font-hs)',
                fontSize: 13,
                letterSpacing: '0.2em',
                cursor: 'pointer',
                boxShadow: `0 0 20px ${mod.glow}`,
              }}
              onClick={(e) => { e.stopPropagation(); navigate(mod.id); }}
            >
              ▶ PLAY
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* ── Footer quote ──────────────────────────────────────────────── */}
      <motion.p
        className="mt-14 text-center italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        style={{ color: '#94a3b8', fontSize: 12, maxWidth: 320, lineHeight: 1.7 }}
      >
        "The wisest plays are rarely flashy — they are precise."
      </motion.p>
    </motion.div>
  );
}
