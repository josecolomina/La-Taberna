// src/store/useMulliganStore.js
// Zustand store for the Mulligan Simulator module.
// Completely independent of useGameStore — no shared state.

import { create } from 'zustand';
import scenarios from '../data/mulliganScenarios.json';

// Threshold: winrate >= KEEP_THRESHOLD means the "optimal" play is to keep the card
const KEEP_THRESHOLD = 50;

// ── Helper: pick N unique random values from an array ────────────────────────
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ── Store ────────────────────────────────────────────────────────────────────
export const useMulliganStore = create((set, get) => ({
  // ── Static data ───────────────────────────────────────────────────────────
  scenarios,
  scenarioIndex: 0,

  // ── Active session ────────────────────────────────────────────────────────
  currentScenario: null,      // raw scenario object from JSON
  hand: [],                   // resolved { ...cardData, mulliganWinrate, keepRate, note, _handId }
  keptIds: new Set(),         // Set of _handId strings the player wants to keep
  phase: 'mulligan',          // 'mulligan' | 'result'
  replacedHand: [],           // final hand after mulligan (kept + new draws)
  feedback: [],               // [{ ...card, optimal, playerKept, isCorrect, note }]
  score: 0,                   // number of correct choices this mulligan

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD SCENARIO
  // Resolves card IDs from useGameStore's cardDictionary, then sets hand.
  // Call this once the DB is ready.
  // ─────────────────────────────────────────────────────────────────────────
  loadScenario: (scenarioId) => {
    const { scenarios } = get();
    const scenario = scenarioId
      ? scenarios.find(s => s.id === scenarioId)
      : scenarios[get().scenarioIndex];

    if (!scenario) return;

    // Lazy-import the card dictionary from the game store to avoid circular deps
    const { useGameStore } = require('../store/useGameStore');
    const cardDictionary = useGameStore.getState().cardDictionary;

    const hand = scenario.initialHand.map((entry, idx) => {
      const base = cardDictionary[entry.cardId] ?? {
        id: entry.cardId, name: entry.cardId, cost: 0, type: 'unknown', image: '',
      };
      return {
        ...base,
        mulliganWinrate: entry.mulliganWinrate,
        keepRate:        entry.keepRate,
        note:            entry.note,
        _handId:         `${entry.cardId}_${idx}`, // unique per slot
      };
    });

    set({
      currentScenario: scenario,
      hand,
      keptIds:      new Set(),
      phase:        'mulligan',
      replacedHand: [],
      feedback:     [],
      score:        0,
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TOGGLE KEEP
  // ─────────────────────────────────────────────────────────────────────────
  toggleKeep: (_handId) => {
    set(state => {
      const next = new Set(state.keptIds);
      if (next.has(_handId)) next.delete(_handId);
      else next.add(_handId);
      return { keptIds: next };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRM MULLIGAN
  // 1. Compute per-card feedback (correct vs incorrect decision)
  // 2. Draw replacement cards for discarded slots
  // 3. Transition to 'result' phase
  // ─────────────────────────────────────────────────────────────────────────
  confirmMulligan: () => {
    const { hand, keptIds } = get();

    // ── Per-card feedback ──────────────────────────────────────────────────
    const feedback = hand.map(card => {
      const optimal     = card.mulliganWinrate >= KEEP_THRESHOLD; // true = should keep
      const playerKept  = keptIds.has(card._handId);
      const isCorrect   = optimal === playerKept;
      return { ...card, optimal, playerKept, isCorrect };
    });

    const score = feedback.filter(f => f.isCorrect).length;

    // ── Replacement draws ─────────────────────────────────────────────────
    const { useGameStore } = require('../store/useGameStore');
    const cardDictionary = useGameStore.getState().cardDictionary;
    const allCards = Object.values(cardDictionary);

    const keptCards     = hand.filter(c => keptIds.has(c._handId));
    const discardCount  = hand.length - keptCards.length;
    const replacements  = pickRandom(allCards, discardCount).map((c, i) => ({
      ...c,
      _handId: `replace_${i}_${Date.now()}`,
    }));

    const replacedHand = [...keptCards, ...replacements];

    set({ feedback, score, replacedHand, phase: 'result' });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NEXT SCENARIO
  // ─────────────────────────────────────────────────────────────────────────
  nextScenario: () => {
    const { scenarios, scenarioIndex } = get();
    const next = (scenarioIndex + 1) % scenarios.length;
    set({ scenarioIndex: next });
    get().loadScenario(scenarios[next].id);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RESTART — reset to mulligan phase with original hand
  // ─────────────────────────────────────────────────────────────────────────
  restart: () => {
    const { currentScenario } = get();
    if (currentScenario) get().loadScenario(currentScenario.id);
  },
}));
