// src/components/Board/Hero.jsx
// Hearthstone-faithful hero unit:
//   – Oval portrait clipped to rounded corners
//   – HP gem badge bottom-right of the portrait
//   – Hero Power slot GLUED immediately to the right of the portrait (no gap)
//   – Armor badge top-right
//   – Target-lock red glow ring via useInteraction
//   – Impact shake animation (Framer Motion)

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteraction, INTERACTION_STATE } from '../../hooks/useInteraction';
import HeroPower from './HeroPower';

const PORTRAITS = {
  enemy:  'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/HERO_01.png', // Garrosh
  player: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/HERO_08.png', // Jaina
};

const HERO_NAMES = { enemy: 'Garrosh', player: 'Jaina' };

export default function Hero({ type, state: heroState, onLockTarget }) {
  const ref        = useRef(null);
  const interaction = useInteraction();
  const isEnemy    = type === 'enemy';

  const isArrowActive =
    interaction.state === INTERACTION_STATE.TARGETING_SPELL ||
    interaction.state === INTERACTION_STATE.ATTACKING;
  const isValidTarget = isArrowActive && isEnemy;
  const isLocked      = interaction.lockedTarget?.id === `${type}_hero`;

  const handleMouseEnter = () => {
    if (isValidTarget) {
      if (onLockTarget) onLockTarget(`${type}_hero`, 'hero');
      else interaction.lockTarget(`${type}_hero`, 'hero');
    }
  };
  const handleMouseLeave = () => { if (isValidTarget) interaction.clearTarget(); };

  const handleMouseDown = (e) => {
    if (!isEnemy && interaction.state === INTERACTION_STATE.IDLE && heroState.weapon) {
      e.preventDefault();
      const rect = ref.current.getBoundingClientRect();
      const pos  = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      interaction.startAttacking({ id: 'player_hero', attack: heroState.weapon.attack }, pos);
    }
  };

  return (
    // Outer row: portrait + glued hero power side by side
    <div className="flex items-end gap-0 select-none">

      {/* ── PORTRAIT CLUSTER ────────────────────────────────────── */}
      <motion.div
        ref={ref}
        className="relative"
        animate={heroState?.isImpacting ? {
          x: [-8, 8, -8, 8, 0],
          filter: [
            'brightness(1)',
            'brightness(2.4) sepia(1) saturate(8) hue-rotate(-15deg)',
            'brightness(1)',
          ],
        } : {}}
        transition={{ duration: 0.38 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
      >
        {/* Target-lock red ring */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              key="lock"
              className="absolute inset-0 rounded-full pointer-events-none z-30"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1.08 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                boxShadow: '0 0 32px 12px rgba(255,40,0,0.95), inset 0 0 16px rgba(255,80,0,0.4)',
                border: '4px solid rgba(255, 80, 0, 1)',
                borderRadius: '50%',
              }}
            />
          )}
        </AnimatePresence>

        {/* Portrait oval */}
        <div
          className={`relative overflow-hidden bg-stone-900 shadow-2xl
            ${isValidTarget ? 'cursor-crosshair' : ''}
          `}
          style={{
            width: 104, height: 120,
            borderRadius: '50% 50% 45% 45%',
            border: '4px solid',
            borderColor: isLocked
              ? 'rgba(255,80,0,0.9)'
              : 'rgba(180,140,60,0.9)', // gold frame
            boxShadow: '0 0 20px rgba(0,0,0,0.7), inset 0 0 8px rgba(0,0,0,0.5)',
          }}
        >
          <img
            src={PORTRAITS[type]}
            alt={HERO_NAMES[type]}
            className="absolute top-0 left-0 w-full h-full object-cover scale-[1.3] translate-y-2"
          />
          {/* Dark vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
          {/* Frozen tint */}
          {heroState?.frozen && (
            <div className="absolute inset-0 bg-blue-400/30 pointer-events-none" />
          )}
        </div>

        {/* HP gem badge – bottom-right corner of portrait */}
        <div
          className="absolute z-20 flex items-center justify-center font-black text-white"
          style={{
            bottom: -6, right: -10,
            width: 44, height: 44,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 32%, #fca5a5, #dc2626 65%, #7f1d1d)',
            border: '3px solid #111',
            fontSize: '1.15rem',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            boxShadow: '0 0 12px rgba(220,38,38,0.7), 0 3px 6px rgba(0,0,0,0.8)',
          }}
        >
          {heroState?.hp ?? 0}
        </div>

        {/* Armor badge – top-right */}
        {heroState?.armor > 0 && (
          <div
            className="absolute z-20 flex items-center justify-center font-black text-white"
            style={{
              top: 4, right: -10,
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 32%, #d1d5db, #6b7280 65%, #374151)',
              border: '2px solid #111',
              fontSize: '0.85rem',
              boxShadow: '0 0 8px rgba(107,114,128,0.6)',
            }}
          >
            {heroState.armor}
          </div>
        )}
      </motion.div>

      {/* ── GLUED HERO POWER (immediately adjacent, NO gap) ─────── */}
      <div className="mb-0 -ml-1 self-center">
        <HeroPower
          power={heroState?.heroPower}
          isUsed={heroState?.heroPowerUsed ?? true}
          playerRef={ref}
        />
      </div>
    </div>
  );
}
