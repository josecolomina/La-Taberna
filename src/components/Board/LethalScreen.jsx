// src/components/Board/LethalScreen.jsx
// Epic full-screen lethal overlay.
// Sequence:
//   1. Enemy hero shakes violently + white flash (handled via enemyState.isLethal flag)
//   2. Dark overlay fades in
//   3. "LETHAL FOUND" text bounces in from scale 0 with spring
//   4. Particle-like gold "sparks" (CSS divs with random positions)

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

// Generate random sparkle positions once
const SPARKS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left:  `${10 + Math.random() * 80}%`,
  top:   `${10 + Math.random() * 80}%`,
  size:  4 + Math.random() * 8,
  delay: Math.random() * 0.6,
  dur:   0.6 + Math.random() * 0.8,
}));

export default function LethalScreen({ isVisible }) {
  const resetPuzzle = useGameStore(s => s.resetPuzzle);
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setShowReplay(true), 1800);
      return () => clearTimeout(t);
    } else {
      setShowReplay(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="lethal-screen"
          className="absolute inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
        >
          {/* ── Sparkles ─────────────────────────────────────────── */}
          {SPARKS.map(s => (
            <motion.div
              key={s.id}
              className="absolute rounded-full"
              style={{
                left: s.left, top: s.top,
                width: s.size, height: s.size,
                background: 'radial-gradient(circle, #fde68a, #f59e0b)',
                boxShadow: `0 0 ${s.size * 2}px rgba(245,158,11,0.9)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{ delay: s.delay, duration: s.dur, ease: 'easeInOut' }}
            />
          ))}

          {/* ── "LETHAL FOUND" text ──────────────────────────────── */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 18 }}
          >
            {/* Top subtitle */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{
                fontSize: 16,
                letterSpacing: '0.4em',
                color: 'rgba(245,218,80,0.8)',
                fontFamily: 'var(--font-hs)',
                textTransform: 'uppercase',
                textShadow: '0 0 14px rgba(245,158,11,0.6)',
              }}
            >
              ✦ Puzzle Solved ✦
            </motion.p>

            {/* Main title */}
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 30px rgba(245,158,11,0.7), 0 0 60px rgba(245,158,11,0.4)',
                  '0 0 80px rgba(245,158,11,1), 0 0 140px rgba(245,158,11,0.6)',
                  '0 0 30px rgba(245,158,11,0.7), 0 0 60px rgba(245,158,11,0.4)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{
                fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                fontFamily: 'var(--font-hs)',
                fontWeight: 900,
                color: '#fbbf24',
                letterSpacing: '0.12em',
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              LETHAL FOUND
            </motion.h1>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                height: 3,
                width: 320,
                background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                borderRadius: 2,
              }}
            />
          </motion.div>

          {/* ── Replay button (appears after 1.8 s) ─────────────── */}
          <AnimatePresence>
            {showReplay && (
              <motion.button
                key="replay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.07, boxShadow: '0 0 24px rgba(212,175,55,0.7)' }}
                whileTap={{ scale: 0.94 }}
                onClick={resetPuzzle}
                style={{
                  marginTop: 36,
                  padding: '12px 36px',
                  background: 'radial-gradient(ellipse at 50% 30%, #3a3528, #1e1c16)',
                  border: '3px solid rgba(212,175,55,0.8)',
                  borderRadius: 10,
                  color: '#d4af37',
                  fontSize: 14,
                  fontFamily: 'var(--font-hs)',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  textShadow: '0 0 8px rgba(212,175,55,0.5)',
                }}
              >
                ↺ PLAY AGAIN
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
