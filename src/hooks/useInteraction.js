// src/hooks/useInteraction.js
// Unified Interaction State Machine — extended with:
//   - mana denial shake signal
//   - taunt enforcement (blocks targeting invalid entities when taunt is present)

import { create } from 'zustand';

export const INTERACTION_STATE = {
  IDLE: 'IDLE',
  DRAGGING_MINION: 'DRAGGING_MINION',
  TARGETING_SPELL: 'TARGETING_SPELL',
  ATTACKING: 'ATTACKING',
  RESOLVING: 'RESOLVING',
};

export const useInteraction = create((set, get) => ({
  state: INTERACTION_STATE.IDLE,
  source: null,
  lockedTarget: null,
  arrowStart: { x: 0, y: 0 },
  arrowEnd:   { x: 0, y: 0 },
  damageNumbers: [],

  // ── NEW: signals Card.jsx to shake on mana denial ─────────────────
  deniedCardId: null,

  // ────────────────────────────────────────────────────────────────────
  // Transitions
  // ────────────────────────────────────────────────────────────────────

  startDraggingMinion: (cardData, startPos) =>
    set({
      state: INTERACTION_STATE.DRAGGING_MINION,
      source: { type: 'minion_hand', card: cardData },
      arrowStart: startPos,
      arrowEnd: startPos,
      lockedTarget: null,
    }),

  startTargetingSpell: (cardData, startPos) =>
    set({
      state: INTERACTION_STATE.TARGETING_SPELL,
      source: { type: 'spell', card: cardData },
      arrowStart: startPos,
      arrowEnd: startPos,
      lockedTarget: null,
    }),

  startAttacking: (minionData, startPos) =>
    set({
      state: INTERACTION_STATE.ATTACKING,
      source: { type: 'minion_board', minion: minionData },
      arrowStart: startPos,
      arrowEnd: startPos,
      lockedTarget: null,
    }),

  updateArrow: (mousePos) => set({ arrowEnd: mousePos }),

  // ── Taunt-aware target lock ──────────────────────────────────────────
  // `enemyBoard` is passed from PuzzleBoard so we can check taunt presence
  lockTarget: (targetId, targetType, { enemyBoard = [] } = {}) => {
    const hasTaunt = enemyBoard.some(m => m.taunt);

    // If enemy has taunt, only allow locking taunt minions (not hero or non-taunt minions)
    if (hasTaunt) {
      const targetIsTaunt = enemyBoard.find(m => m.id === targetId && m.taunt);
      if (!targetIsTaunt) {
        // Invalid target — don't lock
        return;
      }
    }

    set({ lockedTarget: { id: targetId, type: targetType } });
  },

  clearTarget: () => set({ lockedTarget: null }),

  cancel: () =>
    set({ state: INTERACTION_STATE.IDLE, source: null, lockedTarget: null }),

  resolve: () =>
    set({ state: INTERACTION_STATE.RESOLVING, lockedTarget: null }),

  backToIdle: () =>
    set({ state: INTERACTION_STATE.IDLE, source: null, lockedTarget: null }),

  // ── Mana denial: set denied card id, auto-clear after animation ─────
  denyCard: (cardId) => {
    set({ deniedCardId: cardId });
    setTimeout(() => set({ deniedCardId: null }), 700);
  },

  // ── Damage Numbers ───────────────────────────────────────────────────
  spawnDamageNumber: (amount, x, y) => {
    const id = `dmg-${Date.now()}-${Math.random()}`;
    set(s => ({ damageNumbers: [...s.damageNumbers, { id, amount, x, y }] }));
    setTimeout(() => {
      set(s => ({ damageNumbers: s.damageNumbers.filter(d => d.id !== id) }));
    }, 900);
  },

  // ── Battlecry / Hero Power target resolution ─────────────────────────
  // Called from PuzzleBoard mouseup when lockedTarget is set AND
  // pendingBattlecry is non-null in useGameStore (instead of the usual performAction path).
  // Lazy import breaks the circular reference: useInteraction → useGameStore.
  resolveBattlecry: (targetId) => {
    // Dynamic import avoids circular dependency at module load time
    import('../store/useGameStore').then(({ useGameStore }) => {
      useGameStore.getState().resolveBattlecry(targetId);
    });
    set({ state: INTERACTION_STATE.IDLE, source: null, lockedTarget: null });
  },
}));
