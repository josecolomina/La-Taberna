// src/components/Shared/DiscoverModal.jsx
// Overlay that shows 3 card options when a Discover effect triggers.
// Reads discoverOptions from store; calls resolveDiscover on click.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export default function DiscoverModal() {
  const options        = useGameStore(s => s.discoverOptions);
  const resolveDiscover = useGameStore(s => s.resolveDiscover);

  return (
    <AnimatePresence>
      {options && (
        <motion.div
          key="discover"
          className="absolute inset-0 z-[190] flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <motion.p
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-hs)',
              fontSize: 18,
              fontWeight: 700,
              color: '#d4af37',
              letterSpacing: '0.2em',
              marginBottom: 28,
              textShadow: '0 0 12px rgba(212,175,55,0.5)',
            }}
          >
            ✦ DISCOVER ✦
          </motion.p>

          {/* 3 card options */}
          <div className="flex items-center gap-6">
            {options.map((card, i) => (
              <motion.div
                key={card.id + i}
                initial={{ scale: 0.6, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.1, type: 'spring', stiffness: 300, damping: 22 }}
                whileHover={{ scale: 1.12, y: -8, zIndex: 50 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => resolveDiscover(card.id)}
                className="relative cursor-pointer select-none"
                style={{
                  width: 130, height: 190,
                  borderRadius: 14,
                  border: '3px solid rgba(212,175,55,0.8)',
                  background: 'linear-gradient(180deg, #1c1608, #1e1a10)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.15)',
                  overflow: 'hidden',
                }}
              >
                {/* Art */}
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full object-cover"
                  style={{ height: '52%' }}
                />

                {/* Name */}
                <div
                  className="flex items-center justify-center px-1 py-1"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(180,140,60,0.3) 50%, transparent)',
                    borderTop: '1px solid rgba(180,140,60,0.4)',
                  }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: '#f0d060', fontFamily: 'var(--font-hs)',
                    textAlign: 'center', lineHeight: 1.3,
                  }}>
                    {card.name}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex justify-between px-2 pt-1 text-sm font-black" style={{ flexShrink: 0 }}>
                  <span style={{ color: '#fde68a' }}>{card.attack ?? ''}</span>
                  <span style={{ color: '#fca5a5' }}>{card.health ?? ''}</span>
                </div>

                {/* Text */}
                {card.text && (
                  <p className="px-2 text-center italic" style={{
                    fontSize: 8, color: '#d1d5db', lineHeight: 1.3, marginTop: 2,
                  }}>
                    {card.text.replace(/<[^>]+>/g, '').slice(0, 60)}
                  </p>
                )}

                {/* Mana gem */}
                <div
                  className="absolute flex items-center justify-center font-black text-white"
                  style={{
                    top: -6, left: -6,
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 38% 30%, #7dd3fc, #0ea5e9 60%, #0369a1)',
                    border: '2px solid #0c4a6e',
                    fontSize: 12,
                    boxShadow: '0 0 8px rgba(14,165,233,0.8)',
                    zIndex: 20,
                  }}
                >
                  {card.cost}
                </div>

                {/* Playable hover glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, transparent 60%, rgba(212,175,55,0.08))',
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 0.5 }}
            style={{ color: '#94a3b8', fontSize: 11, marginTop: 22, letterSpacing: '0.1em' }}
          >
            Click a card to add it to your hand
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
