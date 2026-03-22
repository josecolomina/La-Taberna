// src/store/useGameStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Global Zustand store — March 2026 Engine Consolidation.
//
// Features newly promoted to production:
//   ✅ Battlecries (TARGETED_DAMAGE, AOE_DAMAGE, BUFF_STATS, HEAL_HERO, DRAW_CARD)
//   ✅ Hero Power (TARGETED / SUMMON / PASSIVE — all 11 classes)
//   ✅ Weapons & Hero Attack (durability tracking, retaliation)
//   ✅ Deathrattles (SUMMON_TOKEN, DEAL_DAMAGE, GIVE_STATS)
//   ✅ Auras (BUFF_ADJACENT, BUFF_ALL)
//   ✅ Discover (modal UI pipeline)
//   ✅ Combo (playHistory-based detection)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import puzzle1 from '../data/puzzle1.json';
import {
  applyDamage, applyHealing,
  BATTLECRY_HANDLERS,
  DEATHRATTLE_HANDLERS,
  applyAuras,
  HERO_POWER_CONFIG,
} from '../utils/mechanics';
import { buildCardDatabase } from '../services/cardDatabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveCard(ref, cardDictionary) {
  if (!ref) return null;
  if (typeof ref === 'string') {
    const found = cardDictionary[ref];
    if (!found) {
      console.warn(`[CardDB] Unknown card ID: "${ref}" — stub.`);
      return { id: ref, name: ref, cost: 0, type: 'unknown', image: '' };
    }
    return { ...found };
  }
  if (!ref.image && ref.id) {
    const found = cardDictionary[ref.id];
    return found ? { ...found, ...ref } : { ...ref };
  }
  return { ...ref };
}

function resolveCardList(list, cardDictionary) {
  if (!Array.isArray(list)) return [];
  return list.map(c => resolveCard(c, cardDictionary)).filter(Boolean);
}

/** Pick a random element from array */
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  // ── Card Database ─────────────────────────────────────────────────────────
  cardDictionary:   {},
  heroesDictionary: {},
  dbStatus:         'idle',
  dbError:          null,
  dbCount:          0,

  // ── Puzzle ────────────────────────────────────────────────────────────────
  puzzleId:    null,
  title:       '',
  description: '',

  playerState: {
    hp: 0, maxHealth: 30, armor: 0,
    mana: { current: 0, max: 0 },
    hand: [], board: [], weapon: null,
    heroPower: null, heroPowerUsed: false,
    frozen: false, heroClass: 'MAGE',
  },

  enemyState: {
    hp: 0, maxHealth: 30, armor: 0,
    board: [], weapon: null,
    frozen: false,
  },

  solutions: [],
  completedSolution: null,

  // ── Event Engine ──────────────────────────────────────────────────────────
  actionQueue:          [],
  isProcessing:         false,
  targetingMode:        null,
  currentSequenceIndex: 0,
  isWrongMove:          false,
  isLethalFound:        false,

  // ── Battlecry pending (targeted) ─────────────────────────────────────────
  pendingBattlecry: null,   // { card, config } — waiting for useInteraction target

  // ── Discover ─────────────────────────────────────────────────────────────
  discoverOptions: null,    // null | Card[] (3 choices)

  // ── Play history & Undo ──────────────────────────────────────────────────
  playHistory: [],
  pastStates: [],
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create((set, get) => ({
  ...initialState,

  // ─────────────────────────────────────────────────────────────────────────
  // 1. DATABASE
  // ─────────────────────────────────────────────────────────────────────────

  initDatabase: async () => {
    if (get().dbStatus === 'loading' || get().dbStatus === 'ready') return;
    set({ dbStatus: 'loading', dbError: null });
    try {
      const { cards, heroes, count } = await buildCardDatabase();
      set({ cardDictionary: cards, heroesDictionary: heroes, dbStatus: 'ready', dbCount: count });
      console.info(`[CardDB] ✅ ${count} Standard cards loaded.`);
    } catch (err) {
      console.error('[CardDB] ❌', err);
      set({ dbStatus: 'error', dbError: err.message });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PUZZLE LOADING
  // ─────────────────────────────────────────────────────────────────────────

  loadPuzzle: (puzzleData) => {
    const { cardDictionary } = get();
    const data = JSON.parse(JSON.stringify(puzzleData));

    data.playerState.hand  = resolveCardList(data.playerState.hand,  cardDictionary);
    data.playerState.board = resolveCardList(data.playerState.board, cardDictionary).map(m => ({
      ...m, canAttack: m.canAttack ?? false, attacksThisTurn: 0,
    }));
    data.enemyState.board  = resolveCardList(data.enemyState.board,  cardDictionary).map(m => ({
      ...m, canAttack: false, attacksThisTurn: 0,
    }));

    // Attach hero power to player based on class
    const heroClass = data.playerState.heroClass ?? 'MAGE';
    const hpCfg     = HERO_POWER_CONFIG[heroClass];
    if (hpCfg) {
      data.playerState.heroPower    = { ...hpCfg, id: `hp_${heroClass}` };
      data.playerState.heroPowerUsed = false;
    }

    data.playerState.type = 'hero';
    data.enemyState.type  = 'hero';

    set({
      ...data,
      winConditionType:  data.winConditionType ?? 'LETHAL',
      isBoardCleared:    false,
      actionQueue: [], isProcessing: false, targetingMode: null,
      currentSequenceIndex: 0, isWrongMove: false, isLethalFound: false,
      pendingBattlecry: null, discoverOptions: null, playHistory: [],
      pastStates: [], completedSolution: null,
      currentPuzzleData: puzzleData,   // store raw copy for reset
    });
  },

  resetPuzzle: () => {
    const { currentPuzzleData } = get();
    if (currentPuzzleData) get().loadPuzzle(currentPuzzleData);
    else get().loadPuzzle(puzzle1);
  },

  saveSnapshot: () => {
    set(state => {
      try {
        return {
          pastStates: [...state.pastStates, {
        playerState: structuredClone(state.playerState),
        enemyState: structuredClone(state.enemyState),
        playHistory: structuredClone(state.playHistory),
        pendingBattlecry: structuredClone(state.pendingBattlecry),
      }]
          };
      } catch (e) {
        console.error("CLONE ERROR", e);
        return {};
      }
    });
  },

  undoLastMove: () => {
    set(state => {
      if (state.pastStates.length === 0) return {};
      const newPast = [...state.pastStates];
      const snapshot = newPast.pop();
      return {
        playerState: snapshot.playerState,
        enemyState: snapshot.enemyState,
        playHistory: snapshot.playHistory,
        pendingBattlecry: snapshot.pendingBattlecry,
        pastStates: newPast,
        // Resurrect valid visual state
        isWrongMove: false,
        isLethalFound: false,
        isBoardCleared: false,
      };
    });
    get().recalculateAuras();
  },

  setWrongMove: (val) => set({ isWrongMove: val }),

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ACTION ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  performAction: (actionObj) => {
    const s = get();
    if (s.isLethalFound || s.isBoardCleared || s.isWrongMove || s.isProcessing || s.targetingMode) return;
    get().enqueueEvent(actionObj);
  },

  enqueueEvent: (event) => {
    set(s => ({ actionQueue: [...s.actionQueue, event] }));
    get().processLogic();
  },

  processLogic: async () => {
    if (get().isProcessing) return;
    set({ isProcessing: true });

    while (get().actionQueue.length > 0) {
      if (get().isWrongMove || get().isLethalFound || get().isBoardCleared) break;

      const event = get().actionQueue[0];
      const isBoardClear = get().winConditionType === 'BOARD_CLEAR';

      // Lethal: validate strict solution sequence. Board Clear: free-form, skip validation.
      if (!isBoardClear
          && event.action !== 'end_turn' && event.action !== 'hero_attack'
          && event.action !== 'use_hero_power' && event.action !== 'resolve_discover') {
        get().validateSolutionStep(event);
      }

      if (event.action === 'end_turn') {
        if (isBoardClear) {
          // In Board Clear mode, end_turn = "Give up" — show fail screen
          set({ isWrongMove: true });
        } else {
          set({ isWrongMove: true });
          setTimeout(() => get().resetPuzzle(), 1500);
        }
        break;
      }

      if (get().isWrongMove) break;

      get().applyEvent(event);
      set(s => ({ actionQueue: s.actionQueue.slice(1) }));

      get().recalculateAuras();
      get().processDeaths();

      // Check win condition after every action
      get().checkWinCondition();

      await new Promise(r => setTimeout(r, 100));
    }

    set({ isProcessing: false });

    // Final win check (covers last action)
    get().checkWinCondition();
  },

  checkWinCondition: () => {
    const s = get();
    if (s.isWrongMove || s.isLethalFound || s.isBoardCleared) return;

    if (s.winConditionType === 'LETHAL') {
      const hasSolutions = Array.isArray(s.solutions) && s.solutions.length > 0;
      if (s.enemyState.hp <= 0) {
        if (!hasSolutions || s.completedSolution) {
          set({ isLethalFound: true });
        }
      }
    } else if (s.winConditionType === 'BOARD_CLEAR') {
      if (s.enemyState.board.length === 0) {
        set({ isBoardCleared: true });
      }
    }
  },

  validateSolutionStep: (event) => {
    const state = get();
    if (!state.solutions || state.solutions.length === 0) {
      set({ currentSequenceIndex: state.currentSequenceIndex + 1 });
      return;
    }

    const validPaths = state.solutions.filter(sol => {
      if (state.currentSequenceIndex >= sol.sequence.length) return false;
      const expected = sol.sequence[state.currentSequenceIndex];
      let isMatch = true;
      if (event.action !== expected.action) isMatch = false;
      else if (expected.cardId && event.cardId !== expected.cardId) isMatch = false;
      else if (expected.sourceId && event.sourceId !== expected.sourceId) isMatch = false;
      else if (expected.targetId && event.targetId !== expected.targetId) isMatch = false;
      return isMatch;
    });

    if (validPaths.length === 0) {
      set({ isWrongMove: true });
      setTimeout(() => get().resetPuzzle(), 1500);
    } else {
      set({ currentSequenceIndex: state.currentSequenceIndex + 1 });
      const completed = validPaths.find(sol => sol.sequence.length === state.currentSequenceIndex + 1);
      if (completed) {
        set({ completedSolution: completed });
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. APPLY EVENT — the core executor
  // ─────────────────────────────────────────────────────────────────────────

  applyEvent: (event) => {
    get().saveSnapshot();
    
    set((state) => {
      let player = structuredClone(state.playerState);
      let enemy  = structuredClone(state.enemyState);
      const newHistory = [];

      const spellDamage = player.board.reduce((t, m) => t + (m.spellDamage || 0), 0);

      const findTarget = (id) => {
        if (id === 'enemy_hero')  return enemy;
        if (id === 'player_hero') return player;
        const em = enemy.board.find(x => x.id === id);
        if (em) return em;
        return player.board.find(x => x.id === id);
      };

      // ── play_spell ─────────────────────────────────────────────────────
      if (event.action === 'play_spell') {
        const cIdx = player.hand.findIndex(c => c.id === event.cardId);
        if (cIdx > -1) {
          const card = player.hand[cIdx];
          player.mana.current -= card.cost;
          player.hand.splice(cIdx, 1);

          const t = findTarget(event.targetId);
          if (t && t.elusive) return { isWrongMove: true };

          if (t && card.damage) {
            applyDamage(t, card.damage + spellDamage);
          }

          // Combo check (Rogue class)
          if (card.combo && player.heroClass === 'ROGUE' && state.playHistory.length > 0) {
            const cfg = card.comboConfig;
            if (cfg && BATTLECRY_HANDLERS[cfg.type]) {
              const comboTarget = findTarget(event.targetId);
              BATTLECRY_HANDLERS[cfg.type]({
                target: comboTarget, enemyBoard: enemy.board,
                playerBoard: player.board, sourceId: card.id,
                amount: cfg.amount, spellDamage,
                player, enemy,
              });
            }
          }

          // Discover
          if (card.discover) {
            const dictValues = Object.values(state.cardDictionary ?? {});
            if (dictValues.length >= 3) {
              const shuffled = dictValues.sort(() => 0.5 - Math.random());
              return {
                playerState: player, enemyState: enemy,
                playHistory: [...state.playHistory, ...newHistory],
                discoverOptions: shuffled.slice(0, 3),
              };
            }
          }

          newHistory.push({ action: 'play_spell', card, targetId: event.targetId, timestamp: Date.now() });
        }
      }

      // ── play_minion ────────────────────────────────────────────────────
      else if (event.action === 'play_minion') {
        if (player.board.length >= 7) return { isWrongMove: true };

        const cIdx = player.hand.findIndex(c => c.id === event.cardId);
        if (cIdx > -1) {
          const card = player.hand[cIdx];
          player.mana.current -= card.cost;
          player.hand.splice(cIdx, 1);

          const newMinion = {
            ...card, type: 'minion',
            canAttack: !!(card.charge || card.rush),
            attacksThisTurn: 0,
          };
          player.board.push(newMinion);

          // ── Battlecry resolution ──────────────────────────────────────
          const battlecryConfig = card.battlecryConfig;
          if (card.battlecry && battlecryConfig) {
            const bType = battlecryConfig.type;

            if (bType === 'TARGETED_DAMAGE') {
              // Pause: we need a target → signal pendingBattlecry
              // The store update is returned here; useInteraction will call
              // resolveBattlecry(targetId) after the player picks a target.
              return {
                playerState: player, enemyState: enemy,
                playHistory: [...state.playHistory, ...newHistory],
                pendingBattlecry: { card, config: battlecryConfig },
              };
            }

            // Immediate battlecries
            if (BATTLECRY_HANDLERS[bType]) {
              const t = event.targetId ? findTarget(event.targetId) : null;
              BATTLECRY_HANDLERS[bType]({
                target: t, enemyBoard: enemy.board,
                playerBoard: player.board, sourceId: newMinion.id,
                amount: battlecryConfig.amount ?? battlecryConfig.attack,
                attack: battlecryConfig.attack, health: battlecryConfig.health,
                spellDamage, player, enemy,
              });
            }
          }

          newHistory.push({ action: 'play_minion', card, targetId: 'player_board', timestamp: Date.now() });
        }
      }

      // ── attack ─────────────────────────────────────────────────────────
      else if (event.action === 'attack') {
        const source = findTarget(event.sourceId);
        const target = findTarget(event.targetId);

        if (source && source.frozen) return { isWrongMove: true };
        if (target && target.stealth && target.owner === 'enemy') return { isWrongMove: true };

        if (source && target) {
          if (source.type === 'minion') {
            if (!source.windfury || (source.attacksThisTurn && source.attacksThisTurn >= 1)) {
              source.canAttack = false;
            } else {
              source.attacksThisTurn = (source.attacksThisTurn || 0) + 1;
            }
          }

          const dmgToTarget = source.attack ?? 0;
          const dmgToSource = target.attack ?? 0;

          if (dmgToTarget > 0) {
            applyDamage(target, dmgToTarget);
            if (source.poisonous && target.type === 'minion') target.health = -999;
            if (source.lifesteal) applyHealing(player, dmgToTarget);
          }
          if (dmgToSource > 0) {
            applyDamage(source, dmgToSource);
            if (target.poisonous && source.type === 'minion') source.health = -999;
            if (target.lifesteal && target.owner === 'enemy') applyHealing(enemy, dmgToSource);
          }

          newHistory.push({ action: 'attack', sourceId: event.sourceId, targetId: event.targetId, timestamp: Date.now() });
        }
      }

      // ── hero_attack  (weapon) ──────────────────────────────────────────
      else if (event.action === 'hero_attack') {
        const target = findTarget(event.targetId);
        const weapon = player.weapon;
        if (!weapon || !target) return {};

        const heroAtk = (weapon.attack ?? 0) + (player.attackBonus ?? 0);

        if (heroAtk > 0) {
          applyDamage(target, heroAtk);
          if (player.lifesteal) applyHealing(player, heroAtk);
        }

        // Retaliation — target hits back
        const retaliaDmg = target.type === 'hero' ? 0 : (target.attack ?? 0);
        if (retaliaDmg > 0) applyDamage(player, retaliaDmg);

        // Reduce durability
        weapon.durability = (weapon.durability ?? 1) - 1;
        if (weapon.durability <= 0) player.weapon = null;

        newHistory.push({ action: 'hero_attack', sourceId: 'player_hero', targetId: event.targetId, timestamp: Date.now() });
      }

      // ── use_hero_power ─────────────────────────────────────────────────
      else if (event.action === 'use_hero_power') {
        const hp = player.heroPower;
        if (!hp || player.heroPowerUsed || player.mana.current < (hp.cost ?? 2)) return {};

        player.mana.current -= hp.cost ?? 2;
        player.heroPowerUsed = true;

        if (hp.type === 'PASSIVE') {
          // Warrior: armor
          if (hp.armor) player.armor = (player.armor ?? 0) + hp.armor;
          // Hunter: deal 2 to enemy hero
          if (hp.damage && hp.target === 'ENEMY_HERO') applyDamage(enemy, hp.damage);
          // Warlock: deal 2 to self, draw
          if (hp.selfDamage) applyDamage(player, hp.selfDamage);
          if (hp.draw) player._drawPending = (player._drawPending ?? 0) + hp.draw;
          // Druid / DH: attack bonus this turn
          if (hp.attack) player.attackBonus = (player.attackBonus ?? 0) + hp.attack;
          // Rogue: equip dagger
          if (hp.weaponData && !player.weapon) player.weapon = { ...hp.weaponData };
        }

        else if (hp.type === 'SUMMON') {
          // Paladin: Silver Hand Recruit
          let tokenData = hp.tokenData;
          // Shaman: random totem not already on board
          if (hp.tokenPool) {
            const existing = player.board.map(m => m.name);
            const available = hp.tokenPool.filter(t => !existing.includes(t.name));
            tokenData = available.length > 0 ? pickRandom(available) : pickRandom(hp.tokenPool);
          }
          if (tokenData && player.board.length < 7) {
            player.board.push({
              id: `hp_token_${Date.now()}`,
              type: 'minion', canAttack: false, attacksThisTurn: 0,
              image: '',
              ...tokenData,
            });
          }
        }

        // TARGETED type is handled via useInteraction → resolveBattlecry
        // (pendingBattlecry is set by Hero Power click in HeroPower.jsx)

        newHistory.push({ action: 'use_hero_power', targetId: event.targetId, timestamp: Date.now() });
      }

      // ── resolve_discover ───────────────────────────────────────────────
      else if (event.action === 'resolve_discover') {
        const { cardDictionary } = state;
        const chosen = cardDictionary[event.cardId] ?? { id: event.cardId, name: event.cardId, cost: 0, type: 'unknown', image: '' };
        player.hand.push({ ...chosen });
        return {
          playerState: player, enemyState: enemy,
          playHistory: [...state.playHistory, ...newHistory],
          discoverOptions: null,
        };
      }

      return {
        playerState: player, enemyState: enemy,
        playHistory: [...state.playHistory, ...newHistory],
      };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. BATTLECRY TARGET RESOLUTION (called by useInteraction after targeting)
  // ─────────────────────────────────────────────────────────────────────────

  resolveBattlecry: (targetId) => {
    const { pendingBattlecry } = get();
    if (!pendingBattlecry) return;

    const { card, config } = pendingBattlecry;
    set(state => {
      let player = structuredClone(state.playerState);
      let enemy  = structuredClone(state.enemyState);
      const spellDamage = player.board.reduce((t, m) => t + (m.spellDamage || 0), 0);

      const findTarget = (id) => {
        if (id === 'enemy_hero')  return enemy;
        if (id === 'player_hero') return player;
        const em = enemy.board.find(x => x.id === id);
        if (em) return em;
        return player.board.find(x => x.id === id);
      };

      const target = findTarget(targetId);
      if (target && BATTLECRY_HANDLERS[config.type]) {
        BATTLECRY_HANDLERS[config.type]({
          target, enemyBoard: enemy.board, playerBoard: player.board,
          sourceId: card.id, amount: config.amount,
          attack: config.attack, health: config.health,
          spellDamage, player, enemy,
        });
      }

      return { playerState: player, enemyState: enemy, pendingBattlecry: null };
    });

    get().recalculateAuras();
    get().processDeaths();
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. HERO POWER — click entry point (targeted powers open arrow via useInteraction)
  // ─────────────────────────────────────────────────────────────────────────

  useHeroPower: () => {
    const { playerState } = get();
    const hp = playerState.heroPower;
    if (!hp || playerState.heroPowerUsed || playerState.mana.current < (hp.cost ?? 2)) return;

    if (hp.type === 'TARGETED') {
      // Delegate targeting to useInteraction — the arrow will call back via
      // performAction({ action: 'use_hero_power', targetId }) on mouseup
      set({ pendingBattlecry: { card: { ...hp, id: 'hero_power' }, config: { type: hp.heal ? 'HEAL_TARGET' : 'TARGETED_DAMAGE', amount: hp.damage ?? hp.heal ?? 1 } } });
      // useInteraction.startTargetingSpell is called by HeroPower.jsx after this
    } else {
      get().performAction({ action: 'use_hero_power' });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. DISCOVER
  // ─────────────────────────────────────────────────────────────────────────

  resolveDiscover: (cardId) => {
    get().performAction({ action: 'resolve_discover', cardId });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. AURAS + DEATHS
  // ─────────────────────────────────────────────────────────────────────────

  recalculateAuras: () => {
    set(state => {
      let p = structuredClone(state.playerState);
      let e = structuredClone(state.enemyState);
      applyAuras(p.board);
      applyAuras(e.board);
      return { playerState: p, enemyState: e };
    });
  },

  processDeaths: () => {
    set(state => {
      let p = structuredClone(state.playerState);
      let e = structuredClone(state.enemyState);

      const pDead = p.board.filter(m => m.health <= 0);
      const eDead = e.board.filter(m => m.health <= 0);

      p.board = p.board.filter(m => m.health > 0);
      e.board = e.board.filter(m => m.health > 0);

      // ── Deathrattle triggers ──────────────────────────────────────────
      for (const dead of eDead) {
        const cfg = dead.deathrattleConfig;
        if (dead.deathrattle && cfg && DEATHRATTLE_HANDLERS[cfg.type]) {
          DEATHRATTLE_HANDLERS[cfg.type]({
            ownerBoard: e.board, enemy: p,  // enemy's POV: owner is enemy side
            amount: cfg.amount, tokenData: cfg.tokenData,
            attack: cfg.attack, health: cfg.health,
            target: cfg.target,
          });
        }
      }
      for (const dead of pDead) {
        const cfg = dead.deathrattleConfig;
        if (dead.deathrattle && cfg && DEATHRATTLE_HANDLERS[cfg.type]) {
          DEATHRATTLE_HANDLERS[cfg.type]({
            ownerBoard: p.board, enemy: e,
            amount: cfg.amount, tokenData: cfg.tokenData,
            attack: cfg.attack, health: cfg.health,
            target: cfg.target,
          });
        }
      }

      return { playerState: p, enemyState: e };
    });
  },
}));
