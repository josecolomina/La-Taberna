// src/components/Card/Card.jsx
// Ornate Hearthstone-faithful card for the hand.
// Features:
//   – 3-D tilt via Framer Motion useSpring
//   – Fan layout driven by handIndex / totalInHand
//   – Playable green halo glow
//   – Detailed frame: golden art border, mana gem, name plate, description, stats
//   – On mousedown: starts TARGETING_SPELL (spell) or DRAGGING_MINION (minion)

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useInteraction, INTERACTION_STATE } from '../../hooks/useInteraction';
import { useGameStore } from '../../store/useGameStore';

export default function Card({ card, handIndex = 0, totalInHand = 1 }) {
  const ref        = useRef(null);
  const [hovered, setHovered] = useState(false);
  const interaction   = useInteraction();
  const playerMana    = useGameStore(s => s.playerState?.mana?.current ?? 0);

  const canAfford = playerMana >= card.cost;
  const isSpell   = card.type === 'spell';

  // ── Fan math ──────────────────────────────────────────────────────────
  const span   = totalInHand > 1 ? Math.min(36, totalInHand * 7) : 0;
  const step   = totalInHand > 1 ? span / (totalInHand - 1) : 0;
  const rotate = totalInHand > 1 ? -span / 2 + step * handIndex : 0;
  const yArc   = Math.abs(handIndex - (totalInHand - 1) / 2) * 5;

  // ── 3-D tilt ──────────────────────────────────────────────────────────
  const rotX = useSpring(useMotionValue(0), { stiffness: 320, damping: 22 });
  const rotY = useSpring(useMotionValue(0), { stiffness: 320, damping: 22 });

  const onMouseMove = (e) => {
    if (!ref.current) return;
    const r  = ref.current.getBoundingClientRect();
    const mx = (e.clientX - r.left)  / r.width  - 0.5;
    const my = (e.clientY - r.top)   / r.height - 0.5;
    rotX.set(-my * 16);
    rotY.set( mx * 16);
  };
  const onMouseLeave = () => { rotX.set(0); rotY.set(0); setHovered(false); };

  // ── Interaction start ─────────────────────────────────────────────────
  const onMouseDown = (e) => {
    // ── MANA DENIAL: shake and block if can't afford ──────────────────
    if (!canAfford) {
      e.preventDefault();
      interaction.denyCard(card.id);
      return;
    }
    e.preventDefault();
    const pos = { x: e.clientX, y: e.clientY };
    if (isSpell) interaction.startTargetingSpell(card, pos);
    else         interaction.startDraggingMinion(card, pos);
  };

  // ── Is this card currently being denied (shake animation)? ───────────
  const isDenied = interaction.deniedCardId === card.id;

  return (
    <motion.div
      ref={ref}
      className="relative"
      style={{
        zIndex: hovered ? 200 : handIndex,
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: 'preserve-3d',
        width: 112,
      }}
      initial={{ y: yArc, rotate }}
      animate={
        isDenied
          ? {
              // Rapid left-right shake — card snaps back to fan position after
              x: [0, -10, 10, -10, 10, -6, 6, 0],
              y: yArc,
              rotate,
              scale: 1,
              filter: 'brightness(0.5) saturate(0) sepia(1) hue-rotate(300deg)',
            }
          : {
              x: 0,
              y:      hovered ? yArc - 50 : yArc,
              rotate: hovered ? 0 : rotate,
              scale:  hovered ? 1.4 : 1,
              filter: 'brightness(1)',
            }
      }
      transition={
        isDenied
          ? { duration: 0.5, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 340, damping: 26 }
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
    >
      {/* ── PLAYABLE GLOW ──────────────────────────────────────── */}
      {canAfford && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{
            boxShadow: hovered
              ? '0 0 22px 6px rgba(90,255,60,0.95), 0 0 50px 12px rgba(90,255,60,0.4)'
              : '0 0 10px 3px rgba(90,255,60,0.55)',
            borderRadius: 12,
          }}
        />
      )}

      {/* ── CARD BODY ───────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden shadow-2xl ${!canAfford ? 'brightness-50 saturate-50' : ''}`}
        style={{
          width: 112, height: 160,
          borderRadius: 12,
          border: '3px solid',
          borderColor: canAfford ? 'rgba(212,175,55,0.85)' : '#374151',
          background: 'linear-gradient(180deg, #1c1608 0%, #1e1a10 100%)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.8), inset 0 0 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Art area */}
        <div className="relative overflow-hidden" style={{ height: '52%' }}>
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
          {/* Art border overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)',
              background: 'linear-gradient(180deg, transparent 60%, rgba(28,22,8,0.85) 100%)',
            }}
          />
        </div>

        {/* Name band */}
        <div
          className="flex items-center justify-center px-1 py-[3px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(180,140,60,0.25) 40%, rgba(180,140,60,0.25) 60%, transparent)',
            borderTop:  '1px solid rgba(180,140,60,0.4)',
            borderBottom: '1px solid rgba(180,140,60,0.25)',
          }}
        >
          <span
            className="text-center font-bold tracking-wide truncate"
            style={{ fontSize: 9, color: '#f0d060', fontFamily: 'var(--font-hs)', lineHeight: 1.2 }}
          >
            {card.name}
          </span>
        </div>

        {/* Description / stats */}
        <div className="flex flex-col items-center px-1 pt-1" style={{ flex: 1 }}>
          {card.type === 'spell' && card.damage && (
            <p className="text-center italic" style={{ fontSize: 9, color: '#d1d5db', lineHeight: 1.3 }}>
              Deal <span style={{ color: '#fbbf24', fontWeight: 800 }}>{card.damage}</span> damage.
            </p>
          )}
          {card.type === 'minion' && (
            <div className="flex justify-between w-full px-1 mt-1">
              <span style={{ color: '#fde68a', fontWeight: 900, fontSize: 12 }}>{card.attack}</span>
              <span style={{ color: '#fca5a5', fontWeight: 900, fontSize: 12 }}>{card.health}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── MANA GEM (top-left, outside frame) ─────────────────── */}
      <div
        className="absolute flex items-center justify-center font-black text-white"
        style={{
          top: -8, left: -8,
          width: 30, height: 30,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 30%, #7dd3fc, #0ea5e9 60%, #0369a1)',
          border: '2px solid #0c4a6e',
          fontSize: 13,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          boxShadow: '0 0 10px rgba(14,165,233,0.8), 0 2px 4px rgba(0,0,0,0.8)',
          zIndex: 30,
        }}
      >
        {card.cost}
      </div>
    </motion.div>
  );
}
