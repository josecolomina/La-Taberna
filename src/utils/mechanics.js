// src/utils/mechanics.js
// ─────────────────────────────────────────────────────────────────────────────
// Core game mechanics helpers:
//   applyDamage()   — damage with armor + divine-shield + hero/minion split
//   applyHealing()  — bounded healing
//   BATTLECRY_HANDLERS  — executed when a minion with 'battlecry' is played
//   DEATHRATTLE_HANDLERS — executed when a minion with 'deathrattle' dies
//   applyAuras()    — recomputes aura stat bonuses each event cycle
// ─────────────────────────────────────────────────────────────────────────────

// ── Base damage / healing ───────────────────────────────────────────────────

/**
 * Applies damage to a target, respecting Divine Shield and armor.
 * Heroes use .hp; minions use .health.
 */
export function applyDamage(target, amount) {
  let remainingDamage = amount;

  // Divine Shield blocks the first hit
  if (remainingDamage > 0 && target.divineShield) {
    target.divineShield = false;
    return;
  }

  const isHero = target.type === 'hero';

  // Armor absorbs first (heroes only)
  if (isHero && target.armor > 0) {
    if (remainingDamage >= target.armor) {
      remainingDamage -= target.armor;
      target.armor = 0;
    } else {
      target.armor -= remainingDamage;
      remainingDamage = 0;
    }
  }

  if (isHero) {
    target.hp = (target.hp ?? 0) - remainingDamage;
  } else {
    target.health = (target.health ?? 0) - remainingDamage;
  }
}

/**
 * Heals a target, capped at maxHealth (heroes default to 30).
 * Heroes use .hp; minions use .health.
 */
export function applyHealing(target, amount) {
  const isHero = target.type === 'hero';
  const max    = target.maxHealth ?? 30;
  if (isHero) {
    target.hp = Math.min((target.hp ?? 0) + amount, max);
  } else {
    target.health = Math.min((target.health ?? 0) + amount, max);
  }
}

// ── BATTLECRY HANDLERS ──────────────────────────────────────────────────────
// Each handler receives { player, enemy, card, targetId? } and mutates in place.
// Return value is ignored — mutations are written to the cloned state objects.
//
// card.battlecryConfig = {
//   type: 'TARGETED_DAMAGE' | 'AOE_DAMAGE' | 'BUFF_STATS',
//   amount?: number,   // damage or buff amount
//   attack?: number,   // for BUFF_STATS
//   health?: number,
// }

export const BATTLECRY_HANDLERS = {

  /**
   * TARGETED_DAMAGE — deal `amount` damage to a specific target.
   * targetId must be supplied (resolved via findTarget in store).
   */
  TARGETED_DAMAGE: ({ target, amount = 1, spellDamage = 0 }) => {
    if (!target) return;
    applyDamage(target, amount + spellDamage);
  },

  /**
   * AOE_DAMAGE — deal `amount` damage to all enemy minions.
   */
  AOE_DAMAGE: ({ enemyBoard, amount = 1 }) => {
    for (const minion of enemyBoard) {
      applyDamage(minion, amount);
    }
  },

  /**
   * BUFF_STATS — give +attack/+health to all OTHER friendly minions.
   * The triggering minion itself is excluded.
   */
  BUFF_STATS: ({ playerBoard, sourceId, attack = 0, health = 0 }) => {
    for (const minion of playerBoard) {
      if (minion.id === sourceId) continue;
      minion.attack = (minion.attack ?? 0) + attack;
      minion.health = (minion.health ?? 0) + health;
    }
  },

  /**
   * HEAL_HERO — restore `amount` HP to the friendly hero.
   */
  HEAL_HERO: ({ player, amount = 2 }) => {
    applyHealing(player, amount);
  },

  /**
   * DRAW_CARD — placeholder; mark "draw pending" — actual draw logic
   * requires cardDictionary access (handled in store).
   */
  DRAW_CARD: ({ player }) => {
    // Signal handled by store after battlecry resolves
    player._drawPending = (player._drawPending ?? 0) + 1;
  },
};

// ── DEATHRATTLE HANDLERS ────────────────────────────────────────────────────
// Each handler receives { player, enemy, deadMinion } and mutates in place.
//
// minion.deathrattleConfig = {
//   type: 'SUMMON_TOKEN' | 'DEAL_DAMAGE' | 'GIVE_STATS',
//   tokenData?: { ...minion fields }
//   amount?: number,
//   attack?: number,
//   health?: number,
//   target?: 'ENEMY_ALL' | 'ENEMY_HERO' | 'ALLY_ALL'
// }

export const DEATHRATTLE_HANDLERS = {

  /**
   * SUMMON_TOKEN — place a minion token on the owner's board.
   * If the board has <7 minions, insert next to where the dead minion was.
   */
  SUMMON_TOKEN: ({ ownerBoard, tokenData }) => {
    if (!tokenData || ownerBoard.length >= 7) return;
    ownerBoard.push({
      id: `token-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'minion',
      canAttack: false,
      attacksThisTurn: 0,
      ...tokenData,
    });
  },

  /**
   * DEAL_DAMAGE — deal damage to enemies (all minions, hero, or specific).
   */
  DEAL_DAMAGE: ({ enemy, amount = 1, target = 'ENEMY_ALL' }) => {
    if (target === 'ENEMY_ALL') {
      for (const m of enemy.board) applyDamage(m, amount);
    } else if (target === 'ENEMY_HERO') {
      applyDamage(enemy, amount);
    }
  },

  /**
   * GIVE_STATS — buff all surviving friendly minions.
   */
  GIVE_STATS: ({ ownerBoard, attack = 0, health = 0 }) => {
    for (const m of ownerBoard) {
      m.attack = (m.attack ?? 0) + attack;
      m.health = (m.health ?? 0) + health;
    }
  },
};

// ── AURA SYSTEM ─────────────────────────────────────────────────────────────
// Aura minions grant a continuous stat bonus to friendly minions while alive.
// Called each event cycle via recalculateAuras().
//
// minion.aura = {
//   type: 'BUFF_ADJACENT' | 'BUFF_ALL',
//   attack?: number,
//   health?: number,
// }

/**
 * Strips and re-applies all aura bonuses on playerBoard.
 * Each minion gets `auraAttack` and `auraHealth` (temp fields reset each cycle).
 */
export function applyAuras(board) {
  // 1. Reset aura deltas on every minion
  for (const m of board) {
    m.attack  = (m.attack  ?? 0) - (m._auraAttack ?? 0);
    m.health  = (m.health  ?? 0) - (m._auraHealth ?? 0);
    m._auraAttack = 0;
    m._auraHealth = 0;
  }

  // 2. Re-apply auras from each source
  for (let i = 0; i < board.length; i++) {
    const src = board[i];
    if (!src.aura) continue;

    const { type, attack = 0, health = 0 } = src.aura;
    let targets = [];

    if (type === 'BUFF_ALL') {
      targets = board.filter(m => m.id !== src.id);
    } else if (type === 'BUFF_ADJACENT') {
      if (i > 0)              targets.push(board[i - 1]);
      if (i < board.length - 1) targets.push(board[i + 1]);
    }

    for (const t of targets) {
      t.attack       = (t.attack  ?? 0) + attack;
      t.health       = (t.health  ?? 0) + health;
      t._auraAttack  = (t._auraAttack ?? 0) + attack;
      t._auraHealth  = (t._auraHealth ?? 0) + health;
    }
  }
}

// ── HERO POWER CONFIG ───────────────────────────────────────────────────────
// Defines each class's hero power. Referenced by useGameStore.useHeroPower().
//
// type: 'TARGETED'  — opens targeting arrow
//       'SUMMON'    — places token on board immediately
//       'PASSIVE'   — self-effect, no targeting

export const HERO_POWER_CONFIG = {
  MAGE: {
    name: 'Fireblast',
    cost: 2,
    type: 'TARGETED',
    damage: 1,
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_034.png',
  },
  PALADIN: {
    name: 'Reinforce',
    cost: 2,
    type: 'SUMMON',
    tokenData: {
      name: 'Silver Hand Recruit',
      attack: 1, health: 1,
      image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_101t.png',
    },
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_101.png',
  },
  WARRIOR: {
    name: 'Armor Up!',
    cost: 2,
    type: 'PASSIVE',
    armor: 2,
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_102.png',
  },
  HUNTER: {
    name: 'Steady Shot',
    cost: 2,
    type: 'PASSIVE',
    damage: 2,
    target: 'ENEMY_HERO',
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/DS1h_292.png',
  },
  DRUID: {
    name: 'Shapeshift',
    cost: 2,
    type: 'PASSIVE',
    armor: 1,
    attack: 1, // Hero gains 1 attack this turn
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_017.png',
  },
  ROGUE: {
    name: 'Dagger Mastery',
    cost: 2,
    type: 'PASSIVE',
    weaponData: { name: 'Wicked Knife', attack: 1, durability: 2 },
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_083b.png',
  },
  SHAMAN: {
    name: 'Totemic Call',
    cost: 2,
    type: 'SUMMON',
    tokenPool: [
      { name: 'Stoneclaw Totem',    attack: 0, health: 2, taunt: true },
      { name: 'Healing Totem',      attack: 0, health: 2 },
      { name: 'Searing Totem',      attack: 1, health: 1 },
      { name: 'Wrath of Air Totem', attack: 0, health: 2, spellDamage: 1 },
    ],
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_049.png',
  },
  WARLOCK: {
    name: 'Life Tap',
    cost: 2,
    type: 'PASSIVE',
    selfDamage: 2,
    draw: 1,
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS2_056.png',
  },
  PRIEST: {
    name: 'Lesser Heal',
    cost: 2,
    type: 'TARGETED',
    heal: 2,
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/CS1h_001.png',
  },
  DEMONHUNTER: {
    name: 'Demon Claws',
    cost: 1,
    type: 'PASSIVE',
    attack: 1, // Demon Hunter hero gains 1 attack
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/HERO_10bp.png',
  },
  DEATHKNIGHT: {
    name: 'Ghoul Charge',
    cost: 2,
    type: 'SUMMON',
    tokenData: { name: 'Ghoul', attack: 2, health: 1, charge: true },
    image: 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x/HERO_11bp.png',
  },
};
