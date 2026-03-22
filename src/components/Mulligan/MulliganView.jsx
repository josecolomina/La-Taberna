// src/components/Mulligan/MulliganView.jsx
// Main container for the Mulligan Simulator module.
// Renders matchup header, card hand, confirm button.
// Switches to MulliganResult after confirming.

import React, { useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useMulliganStore } from '../../store/useMulliganStore';
import { useAppStore }      from '../../store/useAppStore';
import { useSound }         from '../../hooks/useSound';
import { getClassTheme }    from '../../utils/classThemes';
import MulliganCard   from './MulliganCard';
import MulliganResult from './MulliganResult';

const CLASS_ICONS = {
  MAGE:        '🔥', PALADIN:  '⚜', WARRIOR:  '⚔',
  HUNTER:      '🏹', DRUID:    '🌿', ROGUE:    '🗡',
  SHAMAN:      '⚡', WARLOCK:  '💀', PRIEST:   '✝',
  DEMONHUNTER: '👁', DEATHKNIGHT: '❄',
};

export default function MulliganView() {
  const {
    currentScenario, hand, keptIds, phase,
    loadScenario, toggleKeep, confirmMulligan,
    scenarios, scenarioIndex,
  } = useMulliganStore();
  const goTo   = useAppStore(s => s.goTo);
  const { play } = useSound();

  // Load first scenario on mount – wait for store to have it
  useEffect(() => {
    if (!currentScenario) loadScenario(scenarios[scenarioIndex]?.id);
  }, []);

  if (!currentScenario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: '#64748b', fontFamily: 'var(--font-hs)' }}>Loading scenario…</p>
      </div>
    );
  }

  const { playerClass, opponentClass, hasCoin, description } = currentScenario;
  const playerIcon   = CLASS_ICONS[playerClass]   ?? '?';
  const opponentIcon = CLASS_ICONS[opponentClass] ?? '?';
  const theme        = getClassTheme(playerClass);

  const keptCount    = keptIds.size;
  const discardCount = hand.length - keptCount;

  const handleConfirm = () => {
    play('confirm');
    confirmMulligan();
  };

  return (
    <motion.div
      className="flex flex-col items-center w-full min-h-screen py-8 px-4"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between w-full max-w-3xl mb-8 px-4 py-3"
        style={{
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          background: theme.bg,
          boxShadow: `0 0 20px ${theme.glow}`,
        }}
      >
        {/* Back button */}
        <motion.button
          whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
          onClick={() => { play('click'); goTo('menu'); }}
          style={{
            background: 'rgba(20,15,8,0.7)',
            border: '1px solid rgba(100,80,40,0.4)',
            borderRadius: 8, padding: '7px 14px',
            color: '#94a3b8',
            fontFamily: 'var(--font-hs)', fontSize: 11,
            cursor: 'pointer', letterSpacing: '0.1em',
          }}
        >
          ← Menu
        </motion.button>

        {/* Matchup display */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 28 }}>{playerIcon}</span>
              <span style={{ fontSize: 10, color: '#d4af37', fontFamily: 'var(--font-hs)', letterSpacing: '0.1em' }}>
                {playerClass}
              </span>
            </div>
            <span style={{ color: '#475569', fontWeight: 900, fontSize: 20 }}>vs</span>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 28 }}>{opponentIcon}</span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-hs)', letterSpacing: '0.1em' }}>
                {opponentClass}
              </span>
            </div>
          </div>

          {/* Coin badge */}
          {hasCoin && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
              style={{
                background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                border: '1px solid rgba(251,191,36,0.7)',
                borderRadius: 20, padding: '2px 10px',
                fontSize: 9, fontWeight: 800,
                color: '#1c1008', fontFamily: 'var(--font-hs)',
                letterSpacing: '0.15em',
              }}
            >
              🪙 YOU HAVE THE COIN
            </motion.div>
          )}
        </div>

        {/* Scenario badge */}
        <div style={{
          background: 'rgba(40,30,10,0.5)',
          border: '1px solid rgba(100,80,40,0.35)',
          borderRadius: 8, padding: '7px 12px',
          color: '#475569', fontSize: 10,
          fontFamily: 'var(--font-hs)', letterSpacing: '0.08em',
        }}>
          {scenarioIndex + 1} / {scenarios.length}
        </div>
      </div>

      {/* ── Scenario description ─────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 text-center max-w-lg"
        style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}
      >
        {description}
      </motion.p>

      {/* ── Phase: MULLIGAN ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === 'mulligan' && (
          <motion.div
            key="mulligan-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-col items-center gap-10 w-full"
          >
            {/* Instruction */}
            <p style={{ color: '#64748b', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Click cards to toggle Keep / Discard
            </p>

            {/* ── Card hand ─────────────────────────────────────────── */}
            <LayoutGroup>
              <div className="flex items-end justify-center gap-6 flex-wrap">
                <AnimatePresence mode="popLayout">
                  {hand.map(card => (
                    <MulliganCard
                      key={card._handId}
                      card={card}
                      isKept={keptIds.has(card._handId)}
                      onToggle={toggleKeep}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </LayoutGroup>

            {/* ── Stats row ─────────────────────────────────────────── */}
            <div className="flex gap-8">
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-hs)' }}>
                  {keptCount}
                </span>
                <span style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em' }}>KEEPING</span>
              </div>
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 22, fontWeight: 900, color: '#f87171', fontFamily: 'var(--font-hs)' }}>
                  {discardCount}
                </span>
                <span style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em' }}>DISCARDING</span>
              </div>
            </div>

            {/* ── Confirm button ────────────────────────────────────── */}
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleConfirm}
              style={{
                padding: '14px 48px',
                background: `linear-gradient(135deg, ${theme.bg ?? '#7f1d1d'}, ${theme.border ?? '#b91c1c'})`,
                border: `2px solid ${theme.border}`,
                borderRadius: 12,
                color: '#fef2f2',
                fontFamily: 'var(--font-hs)',
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: '0.2em',
                cursor: 'pointer',
                boxShadow: `0 0 30px ${theme.glow}, 0 6px 20px rgba(0,0,0,0.6)`,
              }}
            >
              ⚔ CONFIRM MULLIGAN
            </motion.button>
          </motion.div>
        )}

        {/* ── Phase: RESULT ────────────────────────────────────────── */}
        {phase === 'result' && (
          <motion.div
            key="result-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <MulliganResult />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
