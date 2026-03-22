// src/store/useUserStore.js
// User progression — XP, level, stats, audio pref.
// Persisted to localStorage via Zustand persist middleware.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// XP needed to complete a level (flat 100 XP per level)
const XP_PER_LEVEL = 100;

function computeLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
function computeXpInLevel(xp) {
  return xp % XP_PER_LEVEL;
}

export const useUserStore = create(
  persist(
    (set, get) => ({
      // ── Progression ───────────────────────────────────────────────────────
      xp:              0,
      level:           1,
      xpInLevel:       0,    // 0–99 within the current level
      puzzlesSolved:   0,
      boardsCleared:   0,
      mulliganCorrect: 0,    // total correct mulligan card decisions

      // ── Audio ─────────────────────────────────────────────────────────────
      muted: false,

      // ── Last XP gain (for toast animation) ───────────────────────────────
      lastXpGain:   0,
      lastXpReason: '',

      // ─────────────────────────────────────────────────────────────────────
      // ACTIONS
      // ─────────────────────────────────────────────────────────────────────
      addXP: (amount, reason = '') => {
        const newXp = get().xp + amount;
        set({
          xp:          newXp,
          level:       computeLevel(newXp),
          xpInLevel:   computeXpInLevel(newXp),
          lastXpGain:  amount,
          lastXpReason: reason,
        });
        // Clear the toast signal after 2.5 s so it can re-trigger next time
        setTimeout(() => set({ lastXpGain: 0, lastXpReason: '' }), 2500);
      },

      recordPuzzleSolved: (rating) => {
        let xp = 10;
        let suffix = '';
        if (rating === 'BEST') { xp = 15; suffix = ' (Best!)'; }
        else if (rating === 'GOOD') { xp = 10; suffix = ' (Good)'; }
        else if (rating === 'BAD') { xp = 5; suffix = ' (Bad)'; }
        set(s => ({ puzzlesSolved: s.puzzlesSolved + 1 }));
        get().addXP(xp, `Lethal Found!${suffix}`);
      },

      recordBoardCleared: (rating) => {
        let xp = 15;
        let suffix = '';
        if (rating === 'BEST') { xp = 15; suffix = ' (Best!)'; }
        else if (rating === 'GOOD') { xp = 10; suffix = ' (Good)'; }
        else if (rating === 'BAD') { xp = 5; suffix = ' (Bad)'; }
        set(s => ({ boardsCleared: s.boardsCleared + 1 }));
        get().addXP(xp, `Board Cleared!${suffix}`);
      },

      recordMulliganDecision: (correctCount) => {
        if (correctCount <= 0) return;
        set(s => ({ mulliganCorrect: s.mulliganCorrect + correctCount }));
        get().addXP(correctCount * 5, `${correctCount} correct picks`);
      },

      toggleMute: () => set(s => ({ muted: !s.muted })),
    }),
    {
      name:    'hs-trainer-user',
      storage: createJSONStorage(() => localStorage),
      // Only persist relevant keys — exclude ephemeral toast signals
      partialize: (s) => ({
        xp:              s.xp,
        level:           s.level,
        xpInLevel:       s.xpInLevel,
        puzzlesSolved:   s.puzzlesSolved,
        boardsCleared:   s.boardsCleared,
        mulliganCorrect: s.mulliganCorrect,
        muted:           s.muted,
      }),
    }
  )
);
