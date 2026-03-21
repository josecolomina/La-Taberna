// src/App.jsx
// App shell — initialises the card database on mount, shows a loading screen
// while fetch is in flight, and renders PuzzleBoard once ready.

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PuzzleBoard   from './components/Board/PuzzleBoard';
import { useGameStore } from './store/useGameStore';

// ── Animated loading screen ──────────────────────────────────────────────
function LoadingScreen({ status, count, error }) {
  const isError = status === 'error';

  return (
    <motion.div
      key="loading"
      className="fixed inset-0 flex flex-col items-center justify-center z-[999]"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #271508 0%, #0f0804 70%)' }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
    >
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 tracking-[0.2em] uppercase"
        style={{
          fontFamily: 'var(--font-hs)',
          fontWeight: 900,
          fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
          color: '#d4af37',
          textShadow: '0 0 20px rgba(212,175,55,0.5), 0 4px 8px rgba(0,0,0,0.8)',
          letterSpacing: '0.25em',
        }}
      >
        ⚡ Hearthstone Trainer ⚡
      </motion.h1>

      {isError ? (
        /* ── Error state ─────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <p style={{ color: '#f87171', fontSize: 18, fontFamily: 'var(--font-hs)' }}>
            ⚠ Failed to load card database
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 360, textAlign: 'center' }}>
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => useGameStore.getState().initDatabase()}
            style={{
              marginTop: 8,
              padding: '10px 28px',
              background: 'rgba(40,30,10,0.8)',
              border: '2px solid rgba(212,175,55,0.6)',
              borderRadius: 8,
              color: '#d4af37',
              fontFamily: 'var(--font-hs)',
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            ↺ Retry
          </motion.button>
        </motion.div>
      ) : (
        /* ── Loading state ───────────────────────────────────── */
        <motion.div className="flex flex-col items-center gap-6">
          {/* Spinning rune */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: 52, lineHeight: 1 }}
          >
            ✦
          </motion.div>

          {/* Status text */}
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{
              color: '#d4af37',
              fontFamily: 'var(--font-hs)',
              fontSize: 15,
              letterSpacing: '0.15em',
              textShadow: '0 0 12px rgba(212,175,55,0.4)',
            }}
          >
            Loading card database…
          </motion.p>

          {/* Sub-status */}
          <p style={{ color: '#64748b', fontSize: 12, letterSpacing: '0.1em' }}>
            Fetching Standard cards from HearthstoneJSON
          </p>

          {/* Progress bar – fills as count grows */}
          <motion.div
            style={{
              width: 260,
              height: 4,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #d4af37, #fbbf24)',
                borderRadius: 4,
              }}
              animate={{ scaleX: [0, 0.4, 0.7, 0.85, 0.95] }}
              transition={{ duration: 5, ease: 'easeOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { initDatabase, dbStatus, dbCount, dbError } = useGameStore(s => ({
    initDatabase: s.initDatabase,
    dbStatus:     s.dbStatus,
    dbCount:      s.dbCount,
    dbError:      s.dbError,
  }));

  // Kick off the DB fetch once on mount
  useEffect(() => {
    initDatabase();
  }, []);

  const isReady = dbStatus === 'ready';

  return (
    <div
      className="min-h-screen flex flex-col items-center py-6 px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #271508 0%, #0f0804 70%)' }}
    >
      <AnimatePresence mode="wait">
        {!isReady ? (
          <LoadingScreen
            key="loading"
            status={dbStatus}
            count={dbCount}
            error={dbError}
          />
        ) : (
          <motion.div
            key="board"
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Title */}
            <h1
              className="mb-4 tracking-[0.2em] uppercase"
              style={{
                fontFamily: 'var(--font-hs)',
                fontWeight: 900,
                fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
                color: '#d4af37',
                textShadow: '0 0 20px rgba(212,175,55,0.5), 0 4px 8px rgba(0,0,0,0.8)',
                letterSpacing: '0.25em',
              }}
            >
              ⚡ Hearthstone Trainer ⚡
            </h1>

            {/* DB badge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ delay: 0.4 }}
              style={{ color: '#64748b', fontSize: 11, letterSpacing: '0.1em', marginBottom: 12 }}
            >
              ✦ {dbCount.toLocaleString()} Standard cards loaded ✦
            </motion.p>

            <PuzzleBoard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
