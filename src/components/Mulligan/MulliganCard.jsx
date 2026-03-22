// src/components/Mulligan/MulliganCard.jsx
// Individual card in the Mulligan simulator.
// Click-to-toggle Keep / Discard with distinct visual states.
// Uses layoutId for Framer Motion layout animations (magic replacement).

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MulliganCard({ card, isKept, onToggle, disabled = false }) {
  const handleClick = () => {
    if (!disabled) onToggle(card._handId);
  };

  return (
    <motion.div
      layoutId={card._handId}
      layout
      key={card._handId}
      initial={{ opacity: 0, y: 40, rotate: -3 }}
      animate={{
        opacity: 1, y: 0, rotate: 0,
        scale: isKept ? 1.06 : 1,
      }}
      exit={{ opacity: 0, y: -80, rotate: 8, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      whileHover={disabled ? {} : { y: -12, scale: isKept ? 1.10 : 1.05 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={handleClick}
      className="relative select-none"
      style={{ cursor: disabled ? 'default' : 'pointer', width: 148 }}
    >
      {/* ── Card frame ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          height: 220,
          borderRadius: 14,
          border: '3px solid',
          borderColor: isKept
            ? 'rgba(251,191,36,0.95)'
            : 'rgba(100,80,40,0.5)',
          background: 'linear-gradient(180deg, #1c1608 0%, #1e1a10 100%)',
          boxShadow: isKept
            ? '0 0 28px rgba(251,191,36,0.55), 0 0 8px rgba(251,191,36,0.3), 0 8px 24px rgba(0,0,0,0.8)'
            : '0 8px 24px rgba(0,0,0,0.7)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Art */}
        <div className="relative overflow-hidden" style={{ height: '54%', flexShrink: 0 }}>
          <img
            src={card.image}
            alt={card.name}
            className="w-full h-full object-cover"
            style={{
              filter: isKept ? 'brightness(1)' : 'brightness(0.92)',
              transition: 'filter 0.2s',
            }}
          />
          {/* Discard overlay */}
          <AnimatePresence>
            {!isKept && (
              <motion.div
                key="discard-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Name bar */}
        <div
          className="flex items-center justify-center px-1 py-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(180,140,60,0.25) 50%, transparent)',
            borderTop: '1px solid rgba(180,140,60,0.3)',
          }}
        >
          <span style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: isKept ? '#fde68a' : '#94a3b8',
            fontFamily: 'var(--font-hs)',
            textAlign: 'center',
            lineHeight: 1.3,
            transition: 'color 0.2s',
          }}>
            {card.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex justify-between px-2 pt-1 pb-0">
          {card.type === 'minion' && (
            <>
              <span className="font-black" style={{ fontSize: 13, color: '#fde68a' }}>
                {card.attack}
              </span>
              <span className="font-black" style={{ fontSize: 13, color: '#fca5a5' }}>
                {card.health}
              </span>
            </>
          )}
          {card.type === 'spell' && (
            <span className="w-full text-center font-bold italic" style={{ fontSize: 9, color: '#c4b5fd' }}>
              Spell
            </span>
          )}
        </div>

        {/* Card text snippet */}
        {card.text && (
          <p className="px-2 text-center" style={{
            fontSize: 7.5, color: '#d1d5db', lineHeight: 1.35, marginTop: 2, flex: 1,
            overflow: 'hidden',
          }}>
            {card.text.replace(/<[^>]+>/g, '').slice(0, 55)}
          </p>
        )}

        {/* Mana gem */}
        <div
          className="absolute flex items-center justify-center font-black text-white"
          style={{
            top: -8, left: -8,
            width: 30, height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 30%, #7dd3fc, #0ea5e9 60%, #0369a1)',
            border: '2px solid #0c4a6e',
            fontSize: 13,
            boxShadow: '0 0 10px rgba(14,165,233,0.8)',
            zIndex: 20,
          }}
        >
          {card.cost}
        </div>

        {/* Keep glow ring */}
        <AnimatePresence>
          {isKept && (
            <motion.div
              key="keep-ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: 11,
                boxShadow: 'inset 0 0 20px rgba(251,191,36,0.25)',
                border: '1px solid rgba(251,191,36,0.4)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── STATUS BADGE (above the card) ─────────────────────────── */}
      <AnimatePresence mode="wait">
        {isKept ? (
          <motion.div
            key="keep-badge"
            initial={{ scale: 0, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute flex items-center justify-center"
            style={{
              top: -18, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #d97706, #fbbf24)',
              border: '2px solid rgba(251,191,36,0.8)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 900,
              color: '#1c1008',
              fontFamily: 'var(--font-hs)',
              letterSpacing: '0.15em',
              boxShadow: '0 0 14px rgba(251,191,36,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            ✓ KEEP
          </motion.div>
        ) : (
          <motion.div
            key="discard-badge"
            initial={{ scale: 0, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute flex items-center justify-center"
            style={{
              top: -18, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(60,10,10,0.9)',
              border: '2px solid rgba(220,38,38,0.6)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 900,
              color: '#fca5a5',
              fontFamily: 'var(--font-hs)',
              letterSpacing: '0.15em',
              whiteSpace: 'nowrap',
            }}
          >
            ✕ DISCARD
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
