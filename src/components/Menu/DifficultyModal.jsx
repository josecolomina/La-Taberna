// src/components/Menu/DifficultyModal.jsx
// Appears after selecting a module — lets user pick Easy / Normal / Hard.
// Calls useAppStore.confirmModule() to proceed to the chosen module.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useSound }   from '../../hooks/useSound';

const DIFFICULTIES = [
  {
    id:     'easy',
    label:  'Easy',
    icon:   '🌱',
    desc:   'Straightforward scenarios. Focus on learning the fundamentals.',
    color:  '#4ade80',
    glow:   'rgba(74,222,128,0.3)',
    border: 'rgba(74,222,128,0.5)',
  },
  {
    id:     'normal',
    label:  'Normal',
    icon:   '⚔',
    desc:   'Mixed matchups. A solid challenge for intermediate players.',
    color:  '#d4af37',
    glow:   'rgba(212,175,55,0.3)',
    border: 'rgba(212,175,55,0.5)',
  },
  {
    id:     'hard',
    label:  'Hard',
    icon:   '💀',
    desc:   'Complex boards and tight resource windows. Think carefully.',
    color:  '#f87171',
    glow:   'rgba(248,113,113,0.3)',
    border: 'rgba(248,113,113,0.5)',
  },
];

export default function DifficultyModal() {
  const { showDifficultyModal, difficulty, setDifficulty, confirmModule, pendingModule } = useAppStore();
  const { play } = useSound();

  const handleSelect = (d) => {
    play('click');
    setDifficulty(d);
  };

  const handleConfirm = () => {
    play('confirm');
    confirmModule();
  };

  const MODULE_LABELS = { puzzle: 'Find the Lethal', mulligan: 'Mulligan Simulator', board_clear: 'Board Clear Challenge' };

  return (
    <AnimatePresence>
      {showDifficultyModal && (
        <motion.div
          key="diff-modal"
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.88, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, #271508 0%, #0f0804 80%)',
              border: '2px solid rgba(180,140,60,0.5)',
              borderRadius: 20,
              padding: '36px 32px 28px',
              maxWidth: 480,
              width: '90%',
              boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.1)',
            }}
          >
            {/* Title */}
            <h2 style={{
              fontFamily: 'var(--font-hs)', fontWeight: 900,
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              color: '#d4af37', textAlign: 'center',
              letterSpacing: '0.15em', marginBottom: 4,
            }}>
              {MODULE_LABELS[pendingModule] ?? 'Select Mode'}
            </h2>
            <p style={{ color: '#475569', fontSize: 11, textAlign: 'center', letterSpacing: '0.1em', marginBottom: 24 }}>
              Choose your difficulty
            </p>

            {/* Difficulty cards */}
            <div className="flex flex-col gap-3 mb-6">
              {DIFFICULTIES.map(d => {
                const selected = difficulty === d.id;
                return (
                  <motion.div
                    key={d.id}
                    onClick={() => handleSelect(d.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: `2px solid ${selected ? d.border : 'rgba(80,60,20,0.4)'}`,
                      background: selected ? `rgba(${d.color.replace(/[^\d,]/g,'')},0.06)` : 'rgba(20,14,6,0.6)',
                      boxShadow: selected ? `0 0 16px ${d.glow}` : 'none',
                      transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{d.icon}</span>
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-hs)', fontWeight: 700,
                        fontSize: 13, color: selected ? d.color : '#94a3b8',
                        letterSpacing: '0.1em', marginBottom: 2,
                        transition: 'color 0.2s',
                      }}>
                        {d.label}
                      </p>
                      <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{d.desc}</p>
                    </div>
                    {selected && (
                      <div className="ml-auto" style={{ color: d.color, fontSize: 16 }}>✓</div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => { play('click'); useAppStore.getState().cancelNavigation(); }}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'rgba(20,14,6,0.8)',
                  border: '1px solid rgba(80,60,20,0.4)',
                  borderRadius: 10, color: '#6b7280',
                  fontFamily: 'var(--font-hs)', fontSize: 11,
                  cursor: 'pointer', letterSpacing: '0.1em',
                }}
              >
                ← Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
                onClick={handleConfirm}
                style={{
                  flex: 2, padding: '10px 0',
                  background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
                  border: '2px solid rgba(220,100,60,0.6)',
                  borderRadius: 10, color: '#fef2f2',
                  fontFamily: 'var(--font-hs)', fontWeight: 900,
                  fontSize: 12, letterSpacing: '0.18em',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(220,38,38,0.25)',
                }}
              >
                ▶ PLAY
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
