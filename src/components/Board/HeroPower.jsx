// src/components/Board/HeroPower.jsx
// Ornate Hero Power button — fully wired to the game engine.
// If isUsed or no power: disabled.
// TARGETED powers (Mage, Priest): opens SVG targeting arrow.
// All others: fires use_hero_power directly.

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore }   from '../../store/useGameStore';
import { useInteraction, INTERACTION_STATE } from '../../hooks/useInteraction';

export default function HeroPower({ power, isUsed, playerRef }) {
  const useHeroPower = useGameStore(s => s.useHeroPower);
  const interaction  = useInteraction();

  const cost     = power?.cost ?? 2;
  const canUse   = !isUsed && !!power;
  const isIdle   = interaction.state === INTERACTION_STATE.IDLE;

  const handleClick = () => {
    if (!canUse || !isIdle) return;
    useHeroPower();

    // For TARGETED powers, start the targeting arrow from this button's position
    if (power?.type === 'TARGETED' && playerRef?.current) {
      const rect = playerRef.current.getBoundingClientRect();
      const pos  = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      // Reuse TARGETING_SPELL state — the hero power "spell" card
      interaction.startTargetingSpell(
        { id: 'hero_power', name: power.name, cost, type: 'spell', image: power.image ?? '' },
        pos,
      );
    }
  };

  return (
    <motion.div
      className={`relative flex flex-col items-center select-none
        ${canUse && isIdle ? 'cursor-pointer hero-power-ready' : 'cursor-default'}`}
      whileHover={canUse && isIdle ? { scale: 1.1 } : {}}
      whileTap={canUse && isIdle ? { scale: 0.93 } : {}}
      onClick={handleClick}
    >
      {/* Ornate circular frame */}
      <div
        className="relative flex items-center justify-center overflow-hidden transition-all"
        style={{
          width: 54, height: 54,
          borderRadius: '50%',
          border: isUsed
            ? '3px solid #374151'
            : '3px solid rgba(180,140,60,0.9)',
          background: isUsed
            ? 'radial-gradient(circle, #1f2937, #111827)'
            : 'radial-gradient(circle at 38% 30%, #3b4e6a, #1e293b 70%)',
          boxShadow: isUsed
            ? 'inset 0 2px 6px rgba(0,0,0,0.6)'
            : '0 0 14px rgba(99,179,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          filter: isUsed ? 'grayscale(0.7) brightness(0.5)' : 'none',
        }}
      >
        {power?.image ? (
          <img src={power.image} alt={power.name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-2xl">⚡</span>
        )}
      </div>

      {/* Mana cost badge */}
      {!isUsed && (
        <div
          className="absolute flex items-center justify-center font-black text-white"
          style={{
            top: -6, left: -6,
            width: 22, height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 30%, #7dd3fc, #0ea5e9, #0369a1)',
            border: '2px solid #0c4a6e',
            fontSize: '0.7rem',
            boxShadow: '0 0 8px rgba(14,165,233,0.8)',
          }}
        >
          {cost}
        </div>
      )}
    </motion.div>
  );
}
