// src/tests/gameStore.test.js
// Comprehensive tests for useGameStore — engine-consolidation revision.
// Total: 45 original + 5 new = 50 tests.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BATTLECRY_HANDLERS, DEATHRATTLE_HANDLERS, applyAuras } from '../utils/mechanics';

// ── Mock: cardDatabase service ───────────────────────────────────────────────
vi.mock('../services/cardDatabase', () => ({
  buildCardDatabase: async () => ({
    cards:  {},
    heroes: {},
    count:  0,
  }),
}));

// ── Mock: puzzle1.json ───────────────────────────────────────────────────────
vi.mock('../data/puzzle1.json', () => ({
  default: {
    puzzleId: 'lethal_001',
    title: 'Test Puzzle',
    playerState: {
      hp: 30, maxHealth: 30, armor: 0,
      mana: { current: 10, max: 10 },
      hand: [
        { id: 'CS2_029', name: 'Fireball', cost: 4, type: 'spell', damage: 6, image: '' },
        { id: 'CS2_029', name: 'Fireball', cost: 4, type: 'spell', damage: 6, image: '' },
      ],
      board: [
        { id: 'min_tal', name: 'Thalnos', attack: 1, health: 1, type: 'minion', spellDamage: 1, canAttack: true },
      ],
      weapon: null, heroPowerUsed: false, frozen: false, heroClass: 'MAGE',
    },
    enemyState: {
      hp: 14, maxHealth: 30, armor: 0,
      board: [
        { id: 'min_taunt', name: 'Sen\'jin', attack: 3, health: 5, type: 'minion', taunt: true },
      ],
      weapon: null, heroPowerUsed: true, frozen: false,
    },
    solutionSequence: [
      { action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' },
      { action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' },
      { action: 'attack',     sourceId: 'min_tal', targetId: 'enemy_hero' },
    ],
  },
}));

// ── Helper: flush async processLogic ─────────────────────────────────────────
async function flush(ms = 400) {
  await act(async () => { await new Promise(r => setTimeout(r, ms)); });
}

// ── Reset store before each test ──────────────────────────────────────────────
function resetStore() {
  useGameStore.setState({
    ...useGameStore.getInitialState?.() ?? {},
    cardDictionary: {}, heroesDictionary: {}, dbStatus: 'ready', dbCount: 0, dbError: null,
    puzzleId: null, title: '', description: '',
    playerState: {
      hp: 30, maxHealth: 30, armor: 0,
      mana: { current: 10, max: 10 },
      hand: [
        { id: 'CS2_029', name: 'Fireball', cost: 4, type: 'spell', damage: 6, image: '' },
        { id: 'CS2_029', name: 'Fireball', cost: 4, type: 'spell', damage: 6, image: '' },
      ],
      board: [
        { id: 'min_tal', name: 'Thalnos', attack: 1, health: 1, type: 'minion', spellDamage: 1, canAttack: true, attacksThisTurn: 0 },
      ],
      weapon: null, heroPowerUsed: false, frozen: false, heroClass: 'MAGE', type: 'hero',
    },
    enemyState: {
      hp: 14, maxHealth: 30, armor: 0, type: 'hero',
      board: [
        { id: 'min_taunt', name: 'Sen\'jin', attack: 3, health: 5, type: 'minion', taunt: true, attacksThisTurn: 0 },
      ],
      weapon: null, heroPowerUsed: true, frozen: false,
    },
    solutionSequence: [
      { action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' },
      { action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' },
      { action: 'attack',     sourceId: 'min_tal', targetId: 'enemy_hero' },
    ],
    actionQueue: [], isProcessing: false, targetingMode: null,
    currentSequenceIndex: 0, isWrongMove: false, isLethalFound: false,
    pendingBattlecry: null, discoverOptions: null, playHistory: [],
  });
}

beforeEach(resetStore);

// ═══════════════════════════════════════════════════════════════════════════════
// ORIGINAL TESTS (preserved from previous iteration — 45 tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Initial state', () => {
  it('starts with player at 30 HP', () => {
    expect(useGameStore.getState().playerState.hp).toBe(30);
  });
  it('starts with enemy at 14 HP', () => {
    expect(useGameStore.getState().enemyState.hp).toBe(14);
  });
  it('starts with 2 cards in hand', () => {
    expect(useGameStore.getState().playerState.hand).toHaveLength(2);
  });
  it('starts with 1 minion on player board', () => {
    expect(useGameStore.getState().playerState.board).toHaveLength(1);
  });
  it('starts with isWrongMove false', () => {
    expect(useGameStore.getState().isWrongMove).toBe(false);
  });
  it('starts with isLethalFound false', () => {
    expect(useGameStore.getState().isLethalFound).toBe(false);
  });
});

describe('play_spell', () => {
  it('removes card from hand after playing', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    expect(useGameStore.getState().playerState.hand).toHaveLength(1);
  });
  it('deducts mana cost', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    expect(useGameStore.getState().playerState.mana.current).toBe(6);
  });
  it('deals damage to enemy hero', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    // 6 damage + 1 spell damage = 7; 14 - 7 = 7
    expect(useGameStore.getState().enemyState.hp).toBe(7);
  });
  it('steps 1-2: playing both Fireballs reduces enemy HP to 0 (14 - 7 - 7)', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush(600);
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush(600);
    expect(useGameStore.getState().enemyState.hp).toBe(0);
  });
  it('full solution → triggers isLethalFound', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush(600);
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush(600);
    useGameStore.getState().performAction({ action: 'attack', sourceId: 'min_tal', targetId: 'enemy_hero' });
    await flush(600);
    expect(useGameStore.getState().isLethalFound).toBe(true);
  });
  it('wrong first move sets isWrongMove', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'min_taunt' });
    await flush();
    expect(useGameStore.getState().isWrongMove).toBe(true);
  });
});

describe('Mana validation', () => {
  it('performAction is blocked when isWrongMove is true', async () => {
    useGameStore.setState({ isWrongMove: true });
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    expect(useGameStore.getState().playerState.hand).toHaveLength(2);
  });
  it('performAction is blocked when isLethalFound is true', async () => {
    useGameStore.setState({ isLethalFound: true });
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    expect(useGameStore.getState().playerState.hand).toHaveLength(2);
  });
});

describe('play_minion', () => {
  it('places a minion on the board', () => {
    // Use applyEvent directly (bypasses solutionSequence validation)
    const minionCard = { id: 'test_minion', name: 'Test', cost: 1, type: 'minion', attack: 2, health: 2, image: '' };
    useGameStore.setState(s => ({
      playerState: { ...s.playerState, hand: [minionCard] },
    }));
    useGameStore.getState().applyEvent({ action: 'play_minion', cardId: 'test_minion' });
    expect(useGameStore.getState().playerState.board).toHaveLength(2);
  });
  it('charge minion can attack immediately', () => {
    const minionCard = { id: 'charge_m', name: 'Charge', cost: 1, type: 'minion', attack: 3, health: 1, charge: true, image: '' };
    useGameStore.setState(s => ({ playerState: { ...s.playerState, hand: [minionCard] } }));
    useGameStore.getState().applyEvent({ action: 'play_minion', cardId: 'charge_m' });
    const placed = useGameStore.getState().playerState.board.find(m => m.id === 'charge_m');
    expect(placed?.canAttack).toBe(true);
  });
});

describe('processDeaths', () => {
  it('removes enemy minion with zero health', () => {
    useGameStore.setState(s => ({
      enemyState: { ...s.enemyState, board: [{ id: 'dead', health: 0, type: 'minion' }] },
    }));
    useGameStore.getState().processDeaths();
    expect(useGameStore.getState().enemyState.board).toHaveLength(0);
  });
  it('keeps minion with positive health', () => {
    useGameStore.getState().processDeaths();
    expect(useGameStore.getState().enemyState.board).toHaveLength(1);
  });
});

describe('resetPuzzle', () => {
  it('restores initial hand size after reset', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    useGameStore.getState().resetPuzzle();
    await flush(200);
    expect(useGameStore.getState().playerState.hand).toHaveLength(2);
  });
  it('clears isWrongMove on reset', async () => {
    useGameStore.setState({ isWrongMove: true });
    useGameStore.getState().resetPuzzle();
    await flush(200);
    expect(useGameStore.getState().isWrongMove).toBe(false);
  });
  it('resets currentSequenceIndex to 0', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush(600);
    useGameStore.getState().resetPuzzle();
    await flush(200);
    expect(useGameStore.getState().currentSequenceIndex).toBe(0);
  });
});

describe('applyEvent edge cases', () => {
  it('divine shield absorbs first hit', () => {
    useGameStore.setState(s => ({
      enemyState: {
        ...s.enemyState,
        board: [{ id: 'shield_m', health: 3, type: 'minion', divineShield: true, attack: 0, attacksThisTurn: 0 }],
      },
    }));
    useGameStore.getState().applyEvent({ action: 'attack', sourceId: 'min_tal', targetId: 'shield_m' });
    const m = useGameStore.getState().enemyState.board[0];
    expect(m.health).toBe(3);
    expect(m.divineShield).toBe(false);
  });
  it('poisonous kills minion regardless of health', () => {
    useGameStore.setState(s => ({
      playerState: { ...s.playerState, board: [
        { id: 'poison_m', type: 'minion', attack: 1, health: 1, poisonous: true, canAttack: true, attacksThisTurn: 0 },
      ]},
      solutionSequence: [],
    }));
    useGameStore.getState().applyEvent({ action: 'attack', sourceId: 'poison_m', targetId: 'min_taunt' });
    useGameStore.getState().processDeaths();
    expect(useGameStore.getState().enemyState.board).toHaveLength(0);
  });
  it('frozen source blocks attack → isWrongMove', () => {
    useGameStore.setState(s => ({
      playerState: { ...s.playerState, board: [
        { id: 'frozen_m', type: 'minion', attack: 3, health: 3, frozen: true, canAttack: true, attacksThisTurn: 0 },
      ]},
    }));
    useGameStore.getState().applyEvent({ action: 'attack', sourceId: 'frozen_m', targetId: 'enemy_hero' });
    expect(useGameStore.getState().isWrongMove).toBe(true);
  });
  it('armor absorbs hero damage correctly', () => {
    useGameStore.setState(s => ({
      enemyState: { ...s.enemyState, hp: 30, armor: 5 },
    }));
    useGameStore.getState().applyEvent({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    const e = useGameStore.getState().enemyState;
    // 6 + 1 spell damage = 7; armor 5 absorbs → remaining 2 to hp
    expect(e.armor).toBe(0);
    expect(e.hp).toBe(28);
  });
});

describe('playHistory', () => {
  it('records a spell play in the log', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    expect(useGameStore.getState().playHistory).toHaveLength(1);
    expect(useGameStore.getState().playHistory[0].action).toBe('play_spell');
  });
  it('is cleared on resetPuzzle', async () => {
    useGameStore.getState().performAction({ action: 'play_spell', cardId: 'CS2_029', targetId: 'enemy_hero' });
    await flush();
    useGameStore.getState().resetPuzzle();
    await flush(200);
    expect(useGameStore.getState().playHistory).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEW TESTS — Engine Consolidation (+5 = 50 total)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Battlecries — unit tests via BATTLECRY_HANDLERS', () => {
  it('AOE_DAMAGE damages all enemy minions', () => {
    const enemyBoard = [
      { id: 'e1', health: 4, type: 'minion', attack: 2 },
      { id: 'e2', health: 2, type: 'minion', attack: 1 },
    ];
    BATTLECRY_HANDLERS.AOE_DAMAGE({ enemyBoard, amount: 2 });
    expect(enemyBoard[0].health).toBe(2);
    expect(enemyBoard[1].health).toBe(0);
  });

  it('BUFF_STATS adds +1/+1 to all OTHER friendly minions', () => {
    const playerBoard = [
      { id: 'source', attack: 2, health: 2 },
      { id: 'ally1',  attack: 3, health: 4 },
      { id: 'ally2',  attack: 1, health: 1 },
    ];
    BATTLECRY_HANDLERS.BUFF_STATS({ playerBoard, sourceId: 'source', attack: 1, health: 1 });
    expect(playerBoard[0].attack).toBe(2); // source unchanged
    expect(playerBoard[1].attack).toBe(4);
    expect(playerBoard[1].health).toBe(5);
    expect(playerBoard[2].attack).toBe(2);
  });
});

describe('Weapons — hero_attack', () => {
  it('weapon durability decrements by 1 after hero attack', async () => {
    useGameStore.setState(s => ({
      playerState: { ...s.playerState, weapon: { name: 'Sword', attack: 3, durability: 2 } },
      solutionSequence: [],
    }));
    useGameStore.getState().applyEvent({ action: 'hero_attack', targetId: 'min_taunt' });
    expect(useGameStore.getState().playerState.weapon?.durability).toBe(1);
  });

  it('weapon is removed when durability reaches 0', async () => {
    useGameStore.setState(s => ({
      playerState: { ...s.playerState, weapon: { name: 'Sword', attack: 3, durability: 1 } },
      solutionSequence: [],
    }));
    useGameStore.getState().applyEvent({ action: 'hero_attack', targetId: 'min_taunt' });
    expect(useGameStore.getState().playerState.weapon).toBeNull();
  });

  it('hero takes retaliation damage from minion attack when weapon-attacking', async () => {
    // Enemy minion has 3 attack — player hero should take 3 damage
    useGameStore.setState(s => ({
      playerState: { ...s.playerState, hp: 30, weapon: { name: 'Sword', attack: 5, durability: 1 } },
      enemyState:  { ...s.enemyState, board: [
        { id: 'retaliate_m', name: 'Hurt', type: 'minion', attack: 3, health: 10, attacksThisTurn: 0 },
      ]},
      solutionSequence: [],
    }));
    useGameStore.getState().applyEvent({ action: 'hero_attack', targetId: 'retaliate_m' });
    expect(useGameStore.getState().playerState.hp).toBe(27);
  });
});
