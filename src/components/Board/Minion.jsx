// src/components/Board/Minion.jsx
// Hearthstone-faithful board minion:
//   – Oval portrait with gold/silver border
//   – Attack gem (yellow) bottom-left, Health gem (red) bottom-right
//   – Divine Shield shimmer, Taunt heavy border, Frozen tint, Stealth icon
//   – Target-lock red glow via useInteraction
//   – Impact shake + red flash animation

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteraction, INTERACTION_STATE } from '../../hooks/useInteraction';
import Card from '../Card/Card';

export default function Minion({ minion, owner, onLockTarget }) {
  const ref        = useRef(null);
  const interaction = useInteraction();
  const isPlayer   = owner === 'player';
  const isEnemy    = owner === 'enemy';

  const arrowActive =
    interaction.state === INTERACTION_STATE.TARGETING_SPELL ||
    interaction.state === INTERACTION_STATE.ATTACKING;
  const isValidTarget = arrowActive && isEnemy;
  const canAttackNow  = isPlayer && minion.canAttack && interaction.state === INTERACTION_STATE.IDLE;

  const [isHovered, setIsHovered] = useState(false);
  const [isLeftHalf, setIsLeftHalf] = useState(true);

  // ── Event handlers ─────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (!canAttackNow) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = ref.current.getBoundingClientRect();
    const pos  = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    interaction.startAttacking(minion, pos);
  };

  const handleMouseEnter = (e) => {
    setIsLeftHalf(e.clientX < window.innerWidth / 2);
    setIsHovered(true);
    if (isValidTarget) {
      // Use taunt-aware locker if provided, else default
      if (onLockTarget) onLockTarget(minion.id, 'minion');
      else interaction.lockTarget(minion.id, 'minion');
    }
  };
  const handleMouseLeave = () => { 
    setIsHovered(false);
    if (isValidTarget) interaction.clearTarget(); 
  };

  // Border color logic
  const borderColor = isLocked
    ? 'rgba(255,70,0,1)'
    : canAttackNow
    ? 'rgba(74,222,128,1)'   // green = can attack
    : minion.taunt
    ? 'rgba(180,180,200,0.9)' // silver = taunt
    : 'rgba(180,140,60,0.85)'; // gold default

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center"
      style={{ width: 90, height: 118, zIndex: isLocked ? 10 : 'auto' }}
      animate={minion.isImpacting ? {
        x: [-6, 6, -6, 6, -3, 3, 0],
        filter: [
          'brightness(1)',
          'brightness(2.6) sepia(1) saturate(7) hue-rotate(-10deg)',
          'brightness(1)',
        ],
      } : {}}
      transition={{ duration: 0.36 }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── TARGET LOCK RING ─────────────────────────────────────── */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            key="lock"
            className="absolute inset-0 rounded-full pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: '0 0 28px 10px rgba(255,50,0,0.9), inset 0 0 12px rgba(255,100,0,0.4)',
              border: '3px solid rgba(255,90,0,1)',
              borderRadius: '50%',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── PORTRAIT OVAL ────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden ${isValidTarget ? 'cursor-crosshair' : ''}`}
        style={{
          width: 76, height: 100,
          borderRadius: '50% 50% 44% 44%',
          border: `4px solid ${borderColor}`,
          boxShadow: canAttackNow
            ? `0 0 16px rgba(74,222,128,0.7), 0 4px 10px rgba(0,0,0,0.8)`
            : `0 0 10px rgba(0,0,0,0.8), inset 0 0 6px rgba(0,0,0,0.4)`,
          background: '#1c1c1c',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <img
          src={minion.tileImage || minion.image}
          alt={minion.name}
          className="w-full h-full object-cover scale-110"
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />

        {/* Divine Shield shimmer */}
        {minion.divineShield && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, rgba(253,224,71,0.35) 0%, transparent 70%)',
              boxShadow: 'inset 0 0 20px rgba(253,224,71,0.6)',
              border: '3px solid rgba(253,224,71,0.8)',
              borderRadius: 'inherit',
            }}
          />
        )}

        {/* Frozen tint */}
        {minion.frozen && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(56,189,248,0.35)', backdropFilter: 'blur(1px)' }}
          />
        )}
      </div>

      {/* ── TAUNT thick ring around OUTSIDE ───────────────────── */}
      {minion.taunt && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: -6, left: -6, right: -6, bottom: -6,
            borderRadius: '50%',
            border: '4px solid rgba(180,180,200,0.7)',
            boxShadow: '0 0 14px rgba(200,200,220,0.4)',
          }}
        />
      )}

      {/* ── GEM BADGES ───────────────────────────────────────────── */}
      {/* Attack */}
      <div className="gem-badge gem-attack" style={{ zIndex: 15 }}>
        {minion.attack}
      </div>
      {/* Health */}
      <div className="gem-badge gem-health" style={{ zIndex: 15 }}>
        {minion.health}
      </div>

      {/* Stealth icon */}
      {minion.stealth && (
        <div className="absolute top-0 right-0 text-[11px] bg-purple-900/90
          rounded-full w-5 h-5 flex items-center justify-center z-30 shadow">
          🌑
        </div>
      )}

      {/* Windfury symbol */}
      {minion.windfury && (
        <div className="absolute top-0 left-0 text-[11px] bg-cyan-900/90
          rounded-full w-5 h-5 flex items-center justify-center z-30 shadow">
          💨
        </div>
      )}

      {/* Poisonous symbol */}
      {minion.poisonous && (
        <div className="absolute top-4 left-0 text-[11px] bg-green-900/90
          rounded-full w-5 h-5 flex items-center justify-center z-30 shadow">
          ☠
        </div>
      )}
      {/* ── CARD TOOLTIP (Full hover inspect) ────────────────────── */}
      <AnimatePresence>
        {isHovered && !arrowActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[100] top-1/2 -translate-y-1/2 pointer-events-none drop-shadow-2xl ${isLeftHalf ? 'left-[120%]' : 'right-[120%]'}`}
          >
            <div className={`w-[200px] ${isLeftHalf ? 'origin-left' : 'origin-right'} scale-125`}>
              <Card data={minion} inHand={false} overrideScale={1} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
