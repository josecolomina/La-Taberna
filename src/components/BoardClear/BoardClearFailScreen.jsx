// src/components/BoardClear/BoardClearFailScreen.jsx
// Shown when the player gives up (clicks "Give Up" / "End Turn").
// Minimal vignette + retry button — no harsh animation.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BoardClearFailScreen({ isVisible, onReset, onMenu }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="bc-fail"
          className="absolute inset-0 z-[200] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ fontSize: 52 }}
            >
              💀
            </motion.div>

            {/* Title */}
            <h2 style={{
              fontFamily: 'var(--font-hs)', fontWeight: 900,
              fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
              color: '#f87171', letterSpacing: '0.1em',
              textShadow: '0 0 20px rgba(248,113,113,0.4)',
              textAlign: 'center',
            }}>
              BOARD SURVIVES
            </h2>

            {/* Subtitle */}
            <p style={{
              color: '#94a3b8', fontSize: 14, lineHeight: 1.6,
              textAlign: 'center', maxWidth: 320,
              fontStyle: 'italic',
            }}>
              "The board lives on.<br />Study the threats and try again."
            </p>

            {/* Divider */}
            <div style={{
              height: 2, width: 220,
              background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)',
              borderRadius: 2,
            }} />

            {/* Buttons */}
            <div className="flex gap-3 mt-2">
              <motion.button
                whileHover={{ scale: 1.07, boxShadow: '0 0 20px rgba(248,113,113,0.4)' }}
                whileTap={{ scale: 0.94 }}
                onClick={onReset}
                style={{
                  padding: '11px 32px',
                  background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
                  border: '2px solid rgba(248,113,113,0.7)',
                  borderRadius: 10, color: '#fef2f2',
                  fontFamily: 'var(--font-hs)', fontWeight: 900,
                  fontSize: 12, letterSpacing: '0.18em',
                  cursor: 'pointer',
                }}
              >
                ↺ TRY AGAIN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                onClick={onMenu}
                style={{
                  padding: '11px 18px',
                  background: 'rgba(20,14,6,0.7)',
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
