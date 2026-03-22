// src/components/BoardClear/BoardClearScreen.jsx
// Victory overlay for Board Clear mode.
// Signature effect: a fast horizontal white sweep flies across the board,
// then the "BOARD CLEARED" title bounces in, +15 XP is granted and shown.

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore }  from '../../store/useGameStore';
import { useUserStore }  from '../../store/useUserStore';
import { useSound }      from '../../hooks/useSound';
import { buildPuzzleShareText, copyToClipboard } from '../../utils/shareState';

const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left:  `${10 + Math.random() * 80}%`,
  top:   `${10 + Math.random() * 80}%`,
  size:  4 + Math.random() * 7,
  delay: Math.random() * 0.5,
  dur:   0.5 + Math.random() * 0.7,
}));

export default function BoardClearScreen({ isVisible, onReset, onMenu, onNext }) {
  const puzzleId = useGameStore(s => s.puzzleId);
  const title = useGameStore(s => s.title);
  const playerState = useGameStore(s => s.playerState);
  const playHistory = useGameStore(s => s.playHistory);
  const completedSolution = useGameStore(s => s.completedSolution);
  const recordBoardCleared = useUserStore(s => s.recordBoardCleared);
  const { play }    = useSound();
  const grantedRef  = useRef(false);
  const [phase, setPhase]   = useState('idle'); // 'idle' | 'sweep' | 'show'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (!grantedRef.current) {
        grantedRef.current = true;
        play('victory');
        recordBoardCleared(completedSolution?.rating || 'BEST');
      }
      setPhase('sweep');
      const t = setTimeout(() => setPhase('show'), 500);
      return () => clearTimeout(t);
    } else {
      setPhase('idle');
      grantedRef.current = false;
    }
  }, [isVisible]);

  const handleShare = async () => {
    const text = buildPuzzleShareText(puzzleId, title, playerState?.heroClass, playHistory);
    const ok   = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="bc-screen"
          className="absolute inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        >
          {/* ── Sparkles ────────────────────────────────────────────── */}
          {SPARKS.map(s => (
            <motion.div
              key={s.id}
              className="absolute rounded-full"
              style={{
                left: s.left, top: s.top,
                width: s.size, height: s.size,
                background: 'radial-gradient(circle, #86efac, #22c55e)',
                boxShadow: `0 0 ${s.size * 2}px rgba(34,197,94,0.9)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{ delay: 0.35 + s.delay, duration: s.dur, ease: 'easeInOut' }}
            />
          ))}

          {/* ── SWEEP: horizontal white beam ────────────────────────── */}
          <AnimatePresence>
            {(phase === 'sweep') && (
              <motion.div
                key="sweep"
                className="absolute inset-0 pointer-events-none"
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  initial={{ x: '-110%' }}
                  animate={{ x: '110%' }}
                  transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute top-0 bottom-0"
                  style={{
                    width: '60%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.82), transparent)',
                    boxShadow: '0 0 60px rgba(255,255,255,0.4)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Content (after sweep) ───────────────────────────────── */}
          <AnimatePresence>
            {phase === 'show' && (
              <motion.div
                key="bc-title"
                className="flex flex-col items-center gap-5"
                initial={{ scale: 0.6, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              >
                {/* Sub-label */}
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    fontSize: 15, letterSpacing: '0.35em',
                    color: 'rgba(134,239,172,0.85)',
                    fontFamily: 'var(--font-hs)', textTransform: 'uppercase',
                    textShadow: '0 0 14px rgba(34,197,94,0.6)',
                  }}
                >
                  ✦ Mission Complete ✦
                </motion.p>

                {/* Main title */}
                <motion.h1
                  animate={{
                    textShadow: [
                      '0 0 30px rgba(34,197,94,0.7), 0 0 60px rgba(34,197,94,0.4)',
                      '0 0 80px rgba(34,197,94,1), 0 0 140px rgba(34,197,94,0.6)',
                      '0 0 30px rgba(34,197,94,0.7), 0 0 60px rgba(34,197,94,0.4)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  style={{
                    fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                    fontFamily: 'var(--font-hs)', fontWeight: 900,
                    color: '#4ade80', letterSpacing: '0.1em',
                    lineHeight: 1.1, textAlign: 'center',
                  }}
                >
                  BOARD CLEARED
                </motion.h1>

                {/* Rating & Feedback */}
                {completedSolution && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{
                      color: completedSolution.rating === 'BEST' ? '#fbbf24' : completedSolution.rating === 'GOOD' ? '#e2e8f0' : '#b45309',
                      textAlign: 'center',
                      maxWidth: '400px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: `1px solid ${completedSolution.rating === 'BEST' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.2)'}`,
                      marginTop: '4px'
                    }}
                  >
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '6px', fontFamily: 'var(--font-hs)', letterSpacing: '0.05em' }}>
                      {completedSolution.rating === 'BEST' ? '🥇 BEST SOLUTION' : completedSolution.rating === 'GOOD' ? '🥈 GOOD SOLUTION' : '🥉 BAD SOLUTION'}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.4 }}>{completedSolution.feedback}</p>
                  </motion.div>
                )}

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  style={{
                    height: 3, width: 300,
                    background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                    borderRadius: 2,
                  }}
                />

                {/* Buttons */}
                <div className="flex gap-3 mt-4 flex-wrap justify-center">
                  {onNext && (
                    <motion.button
                      whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
                      onClick={onNext}
                      style={{
                        padding: '11px 28px',
                        background: 'linear-gradient(135deg, #14532d, #16a34a)',
                        border: '2px solid rgba(74,222,128,0.7)',
                        borderRadius: 10, color: '#dcfce7',
                        fontFamily: 'var(--font-hs)', fontWeight: 900,
                        fontSize: 12, letterSpacing: '0.15em',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(34,197,94,0.3)',
                      }}
                    >
                      NEXT PUZZLE →
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.07, boxShadow: '0 0 24px rgba(212,175,55,0.7)' }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onReset}
                    style={{
                      padding: '11px 28px',
                      background: 'radial-gradient(ellipse at 50% 30%, #3a3528, #1e1c16)',
                      border: '2px solid rgba(212,175,55,0.8)',
                      borderRadius: 10, color: '#d4af37',
                      fontFamily: 'var(--font-hs)', fontWeight: 700,
                      fontSize: 12, letterSpacing: '0.12em',
                      cursor: 'pointer',
                    }}
                  >
                    ↺ PLAY AGAIN
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={handleShare}
                    style={{
                      padding: '11px 16px',
                      background: 'rgba(20,14,6,0.8)',
                      border: '1px solid rgba(80,60,20,0.5)',
                      borderRadius: 10, color: copied ? '#4ade80' : '#94a3b8',
                      fontFamily: 'var(--font-hs)', fontSize: 11,
                      cursor: 'pointer', letterSpacing: '0.1em',
                      transition: 'color 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied!' : '📋 Share'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                    onClick={onMenu}
                    style={{
                      padding: '11px 16px',
                      background: 'rgba(20,14,6,0.6)',
                      border: '1px solid rgba(60,40,10,0.4)',
                      borderRadius: 10, color: '#64748b',
                      fontFamily: 'var(--font-hs)', fontSize: 11,
                      cursor: 'pointer', letterSpacing: '0.1em',
                    }}
                  >
                    ← Menu
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
