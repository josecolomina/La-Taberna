// src/components/Mulligan/MulliganResult.jsx
// "Professor Feedback" panel — shown after confirming the mulligan.
// Displays per-card color-coded verdict, winrates, and professor notes.

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMulliganStore } from '../../store/useMulliganStore';
import { useAppStore }      from '../../store/useAppStore';
import { useUserStore }     from '../../store/useUserStore';
import { buildMulliganShareText, copyToClipboard } from '../../utils/shareState';

const HS_GOLD = '#d4af37';

export default function MulliganResult() {
  const { feedback, score, replacedHand, nextScenario, restart, currentScenario } = useMulliganStore();
  const goTo   = useAppStore(s => s.goTo);
  const recordMulliganDecision = useUserStore(s => s.recordMulliganDecision);
  const [copied, setCopied] = useState(false);
  const grantedRef = useRef(false);

  // Grant XP once when result mounts
  useEffect(() => {
    if (!grantedRef.current && score > 0) {
      grantedRef.current = true;
      recordMulliganDecision(score);
    }
  }, []);

  const handleShare = async () => {
    const text = buildMulliganShareText(currentScenario, feedback, score);
    const ok   = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const total       = feedback.length;
  const isPerfect   = score === total;
  const scoreLabel  = isPerfect
    ? `✦ PERFECT MULLIGAN! ${score}/${total}`
    : `${score}/${total} Correct`;
  const scoreColor  = isPerfect ? HS_GOLD : score >= total / 2 ? '#4ade80' : '#f87171';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center w-full gap-6"
    >
      {/* ── Score header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 20 }}
        className="flex flex-col items-center gap-1"
      >
        <h2 style={{
          fontFamily: 'var(--font-hs)',
          fontSize: 'clamp(1.3rem, 4vw, 2rem)',
          fontWeight: 900,
          color: scoreColor,
          textShadow: `0 0 20px ${scoreColor}55`,
          letterSpacing: '0.1em',
        }}>
          {scoreLabel}
        </h2>
        <p style={{ color: '#64748b', fontSize: 12, letterSpacing: '0.08em' }}>
          {isPerfect ? 'Your instincts are perfect for this matchup.' : 'Review the professor notes below.'}
        </p>
      </motion.div>

      {/* ── Per-card feedback grid ────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-center gap-4 w-full max-w-3xl">
        {feedback.map((card, i) => {
          const isCorrect = card.isCorrect;
          const optimal   = card.optimal;
          const kept      = card.playerKept;

          const borderColor = isCorrect ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.7)';
          const glowColor   = isCorrect ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)';
          const labelColor  = isCorrect ? '#4ade80' : '#f87171';

          return (
            <motion.div
              key={card._handId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 260, damping: 24 }}
              style={{
                width: 160,
                background: 'linear-gradient(180deg, #1c1608, #110f08)',
                border: `2px solid ${borderColor}`,
                borderRadius: 14,
                padding: '12px 12px 14px',
                boxShadow: `0 0 20px ${glowColor}, 0 6px 20px rgba(0,0,0,0.7)`,
              }}
            >
              {/* Card art thumbnail */}
              <div className="relative overflow-hidden mb-2" style={{ borderRadius: 8, height: 80 }}>
                <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{
                  background: `linear-gradient(180deg, transparent 50%, ${isCorrect ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'})`,
                }} />
              </div>

              {/* Name + verdict */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#f0e6c8', fontFamily: 'var(--font-hs)', marginBottom: 4 }}>
                {card.name}
              </p>
              <p style={{ fontSize: 10, fontWeight: 800, color: labelColor, marginBottom: 6, letterSpacing: '0.05em' }}>
                {isCorrect
                  ? (kept ? '✓ Kept correctly' : '✓ Discarded correctly')
                  : (kept ? '✕ Should have discarded' : '✕ Should have kept')}
              </p>

              {/* Winrate bar */}
              <div className="flex flex-col gap-1 mb-3">
                <div className="flex justify-between" style={{ fontSize: 8.5, color: '#64748b' }}>
                  <span>Win rate when kept</span>
                  <span style={{ color: HS_GOLD, fontWeight: 700 }}>{card.mulliganWinrate}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: card.mulliganWinrate / 100 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: card.mulliganWinrate >= 50
                        ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                        : 'linear-gradient(90deg, #f87171, #ef4444)',
                      transformOrigin: 'left',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div className="flex justify-between" style={{ fontSize: 8, color: '#475569' }}>
                  <span>Pro keep rate</span>
                  <span>{card.keepRate}%</span>
                </div>
              </div>

              {/* Professor note */}
              <p style={{ fontSize: 8.5, color: '#94a3b8', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{card.note}"
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ── New hand preview ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <p style={{ color: '#475569', fontSize: 11, letterSpacing: '0.1em' }}>
          YOUR FINAL HAND
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          {replacedHand.map((card, i) => (
            <motion.div
              key={card._handId}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
              className="relative overflow-hidden"
              style={{
                width: 54, height: 76,
                borderRadius: 7,
                border: '2px solid rgba(180,140,60,0.4)',
                background: '#1c1608',
                boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
              }}
            >
              <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
              {/* Cost gem */}
              <div className="absolute flex items-center justify-center font-black text-white"
                style={{
                  top: -4, left: -4, width: 18, height: 18, borderRadius: '50%', zIndex: 10,
                  background: 'radial-gradient(circle, #7dd3fc, #0ea5e9)',
                  border: '1px solid #0c4a6e', fontSize: 9,
                }}
              >
                {card.cost}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="flex gap-4 mt-2 flex-wrap justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={restart}
          style={{
            padding: '10px 24px',
            background: 'rgba(40,30,10,0.7)',
            border: `2px solid rgba(180,140,60,0.5)`,
            borderRadius: 10, color: '#d4af37',
            fontFamily: 'var(--font-hs)', fontSize: 12,
            letterSpacing: '0.12em', cursor: 'pointer',
          }}
        >
          ↺ TRY AGAIN
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={nextScenario}
          style={{
            padding: '10px 28px',
            background: 'linear-gradient(135deg, #1e3a5f, #1e4080)',
            border: `2px solid rgba(99,179,237,0.6)`,
            borderRadius: 10, color: '#bfdbfe',
            fontFamily: 'var(--font-hs)', fontSize: 12,
            letterSpacing: '0.12em', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(59,130,246,0.25)',
          }}
        >
          NEXT SCENARIO →
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          style={{
            padding: '10px 18px',
            background: 'rgba(20,14,6,0.7)',
            border: '1px solid rgba(80,60,20,0.4)',
            borderRadius: 10, color: copied ? '#4ade80' : '#94a3b8',
            fontFamily: 'var(--font-hs)', fontSize: 11,
            letterSpacing: '0.1em', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Share Result'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => goTo('menu')}
          style={{
            padding: '10px 20px',
            background: 'rgba(20,15,8,0.8)',
            border: `1px solid rgba(100,80,40,0.4)`,
            borderRadius: 10, color: '#64748b',
            fontFamily: 'var(--font-hs)', fontSize: 11,
            letterSpacing: '0.1em', cursor: 'pointer',
          }}
        >
          ← Menu
        </motion.button>
      </div>
    </motion.div>
  );
}
