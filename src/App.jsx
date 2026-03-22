// src/App.jsx
// App shell — initialises the card database on mount, shows a loading screen
// while fetch is in flight, then renders the current module via useAppStore.
// Modules: 'menu' → MainMenu, 'puzzle' → PuzzleBoard, 'mulligan' → MulliganView

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore }     from './store/useGameStore';
import { useAppStore }      from './store/useAppStore';
import PuzzleBoard          from './components/Board/PuzzleBoard';
import MainMenu             from './components/Menu/MainMenu';
import MulliganView         from './components/Mulligan/MulliganView';
import BoardClearView       from './components/BoardClear/BoardClearView';
import MuteButton           from './components/Shared/MuteButton';
import DifficultyModal      from './components/Menu/DifficultyModal';

// ── Animated loading screen ─────────────────────────────────────────────────
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
              marginTop: 8, padding: '10px 28px',
              background: 'rgba(40,30,10,0.8)',
              border: '2px solid rgba(212,175,55,0.6)',
              borderRadius: 8, color: '#d4af37',
              fontFamily: 'var(--font-hs)', fontSize: 13,
              cursor: 'pointer', letterSpacing: '0.1em',
            }}
          >
            ↺ Retry
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="flex flex-col items-center gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: 52, lineHeight: 1 }}
          >
            ✦
          </motion.div>
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{
              color: '#d4af37', fontFamily: 'var(--font-hs)',
              fontSize: 15, letterSpacing: '0.15em',
              textShadow: '0 0 12px rgba(212,175,55,0.4)',
            }}
          >
            Loading card database…
          </motion.p>
          <p style={{ color: '#64748b', fontSize: 12, letterSpacing: '0.1em' }}>
            Fetching Standard cards from HearthstoneJSON
          </p>
          <motion.div style={{ width: 260, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #d4af37, #fbbf24)', borderRadius: 4 }}
              animate={{ scaleX: [0, 0.4, 0.7, 0.85, 0.95] }}
              transition={{ duration: 5, ease: 'easeOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const initDatabase = useGameStore(s => s.initDatabase);
  const dbStatus     = useGameStore(s => s.dbStatus);
  const dbCount      = useGameStore(s => s.dbCount);
  const dbError      = useGameStore(s => s.dbError);
  const { currentModule } = useAppStore();

  useEffect(() => { initDatabase(); }, []);

  const isReady = dbStatus === 'ready';

  return (
    <div
      className="h-screen w-screen overflow-hidden overscroll-none touch-none"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #271508 0%, #0f0804 70%)' }}
    >
      {/* ── Global overlays (always rendered) ────────────────────── */}
      <MuteButton />
      <DifficultyModal />
      <AnimatePresence mode="wait">
        {!isReady ? (
          <LoadingScreen
            key="loading"
            status={dbStatus}
            count={dbCount}
            error={dbError}
          />
        ) : (
          // ── Module Router ────────────────────────────────────────────
          <AnimatePresence mode="wait" key="app-ready">
            {currentModule === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35 }}
              >
                <MainMenu />
              </motion.div>
            )}

            {currentModule === 'puzzle' && (
              <motion.div
                key="puzzle"
                className="flex flex-col items-center py-6 px-4"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <PuzzleBoard />
              </motion.div>
            )}

            {currentModule === 'mulligan' && (
              <motion.div
                key="mulligan"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <MulliganView />
              </motion.div>
            )}

            {currentModule === 'board_clear' && (
              <motion.div
                key="board_clear"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center justify-center w-full"
              >
                <BoardClearView />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </AnimatePresence>
    </div>
  );
}
