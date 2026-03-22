// src/store/useAppStore.js
// Lightweight module router — no React Router needed for a static SPA.
// navigate() now opens DifficultyModal first; confirmModule() completes the transition.

import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  currentModule:        'menu',    // 'menu' | 'puzzle' | 'mulligan'
  pendingModule:        null,      // set when user picks a mode, awaiting difficulty choice
  showDifficultyModal:  false,
  difficulty:           'normal',  // 'easy' | 'normal' | 'hard'

  /** Start navigation — opens the difficulty modal first */
  navigate: (module) => set({ pendingModule: module, showDifficultyModal: true }),

  /** User confirmed difficulty → switch to the pending module */
  confirmModule: () => set(s => ({
    currentModule:       s.pendingModule,
    pendingModule:       null,
    showDifficultyModal: false,
  })),

  /** User hit ← Back in the modal */
  cancelNavigation: () => set({ pendingModule: null, showDifficultyModal: false }),

  setDifficulty: (d) => set({ difficulty: d }),

  /** Direct navigation (Back buttons, no modal) */
  goTo: (module) => set({ currentModule: module }),
}));
