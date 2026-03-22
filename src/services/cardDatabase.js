// src/services/cardDatabase.js
// ───────────────────────────────────────────────────────────────────────────
// Hearthstone Card Database Service
//
// Fetches the full HearthstoneJSON card list (collectible only) and filters
// it down to the current Standard-legal sets (updated March 2026).
// Builds a flat cardDictionary keyed by card ID for O(1) lookup.
// ───────────────────────────────────────────────────────────────────────────

// ── Standard-legal sets as of March 2026 ────────────────────────────────
// Core set is always in Standard.  The two-year window currently includes:
//   Year of the Pegasus (2024):  Whizbang's Workshop, Perils in Paradise, The Great Dark Beyond
//   Year of the Hydra / new sets (2025-2026): Into the Emerald Dream, …
// Update this list when Blizzard rotates sets.
export const STANDARD_SETS = new Set([
  // Core (always legal)
  'CORE',

  // Year of the Pegasus — 2024
  'WHIZBANGS_WORKSHOP',       // Whizbang's Workshop
  'PERILS_IN_PARADISE',       // Perils in Paradise
  'GREAT_DARK_BEYOND',        // The Great Dark Beyond

  // Year of the Hydra — 2025 (Patch 31+)
  'INTO_THE_EMERALD_DREAM',   // Into the Emerald Dream
  'STARSHIP_GRAVEYARD',       // (if released before March 2026)
  'SPACE_ODYSSEY',            // (placeholder — add when announced)

  // Twist / event sets that Blizzard has deemed Standard-legal:
  'TITANS',                   // Titans (2023, still in window)
  'PATH_OF_ARTHAS',           // Path of Arthas
  'WILD_WEST',                // Showdown in the Badlands
  'CAVERNS_OF_TIME',          // Festival of Legends (rotates 2026)
]);

// ── Hero class mappings ────────────────────────────────────────────────────
// Canonical base hero card IDs for each class.
export const BASE_HERO_IDS = {
  MAGE:        'HERO_08',
  PALADIN:     'HERO_04',
  WARRIOR:     'HERO_01',
  HUNTER:      'HERO_05',
  DRUID:       'HERO_06',
  ROGUE:       'HERO_03',
  SHAMAN:      'HERO_02',
  WARLOCK:     'HERO_07',
  PRIEST:      'HERO_09',
  DEMONHUNTER: 'HERO_10',
  DEATHKNIGHT: 'HERO_11',
};

// ── Image URL builder ──────────────────────────────────────────────────────
const ART_BASE = 'https://art.hearthstonejson.com/v1/render/latest/enUS/512x';

/**
 * Returns the full render URL for a card ID.
 * @param {string} cardId - e.g. "CS2_029"
 * @returns {string}
 */
export function cardImageUrl(cardId) {
  return `${ART_BASE}/${cardId}.png`;
}

// ── Keyword mapping (API mechanics → our game flags) ──────────────────────
const MECHANIC_MAP = {
  TAUNT:       'taunt',
  DIVINE_SHIELD: 'divineShield',
  CHARGE:      'charge',
  RUSH:        'rush',
  LIFESTEAL:   'lifesteal',
  POISONOUS:   'poisonous',
  WINDFURY:    'windfury',
  STEALTH:     'stealth',
  FREEZE:      'freeze',
  BATTLECRY:   'battlecry',
  DEATHRATTLE: 'deathrattle',
  SPELL_DAMAGE: 'spellDamage',
  DISCOVER:    'discover',
  COMBO:    'combo',
  OVERLOAD:    'overload',
};

// ── Normalizer ─────────────────────────────────────────────────────────────
/**
 * Converts a raw API card object to our internal game format.
 * @param {Object} raw - raw card from HearthstoneJSON
 * @returns {Object} normalized card
 */
export function normalizeCard(raw) {
  const keywords = {};
  (raw.mechanics ?? []).forEach(m => {
    const key = MECHANIC_MAP[m];
    if (key) keywords[key] = true;
  });

  // spellDamage is numeric in our game engine
  if (raw.spellDamageText) {
    keywords.spellDamage = parseInt(raw.spellDamageText, 10) || 1;
  }

  const cardType = raw.type?.toLowerCase() ?? 'unknown';

  return {
    // ── Identity ──────────────────────────────────────────────
    id:          raw.id,
    dbfId:       raw.dbfId,
    name:        raw.name,
    set:         raw.set,
    cardClass:   raw.cardClass ?? 'NEUTRAL',
    rarity:      raw.rarity ?? 'FREE',
    type:        cardType === 'minion' ? 'minion'
               : cardType === 'spell'  ? 'spell'
               : cardType === 'weapon' ? 'weapon'
               : cardType === 'hero'   ? 'hero'
               : cardType,

    // ── Stats ──────────────────────────────────────────────────
    cost:        raw.cost   ?? 0,
    attack:      raw.attack ?? 0,
    health:      raw.health ?? (raw.durability ?? 0),
    durability:  raw.durability ?? 0,
    armor:       raw.armor  ?? 0,
    damage:      raw.spellDamage ?? undefined, // for spell cards

    // ── Text ───────────────────────────────────────────────────
    text:        raw.text ?? '',
    flavor:      raw.flavor ?? '',
    race:        raw.race ?? null,

    // ── Keywords (our engine format) ──────────────────────────
    ...keywords,

    // ── Art URLs ───────────────────────────────────────────────
    image: cardImageUrl(raw.id),
    tileImage: `https://art.hearthstonejson.com/v1/tiles/${raw.id}.png`,
  };
}

// ── Standard filter ────────────────────────────────────────────────────────
/**
 * Filters a raw card array to only Standard-legal collectible cards.
 * @param {Object[]} rawCards
 * @returns {Object[]}
 */
export function filterStandard(rawCards) {
  return rawCards.filter(c =>
    c.collectible === true &&
    STANDARD_SETS.has(c.set) &&
    // We only want gameplay types — no enchantments, tokens, etc.
    ['MINION', 'SPELL', 'WEAPON'].includes(c.type)
  );
}

// ── Base heroes filter ─────────────────────────────────────────────────────
/**
 * Extracts and normalizes the 11 base hero cards.
 * @param {Object[]} rawCards
 * @returns {Object[]}
 */
export function filterBaseHeroes(rawCards) {
  const heroIdSet = new Set(Object.values(BASE_HERO_IDS));
  return rawCards
    .filter(c => heroIdSet.has(c.id) && c.type === 'HERO')
    .map(normalizeCard);
}

// ── Database builder ───────────────────────────────────────────────────────
/**
 * Fetches all collectible cards from HearthstoneJSON, filters to Standard
 * format and base heroes, and returns a keyed dictionary.
 *
 * @returns {Promise<{
 *   cards: Record<string, Object>,
 *   heroes: Record<string, Object>,
 *   count: number
 * }>}
 */
export async function buildCardDatabase() {
  // Use cards.json (full) so we can also extract hero cards
  const url = 'https://api.hearthstonejson.com/v1/latest/enUS/cards.json';

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // 30 s timeout via AbortController
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`HearthstoneJSON fetch failed: ${res.status} ${res.statusText}`);
  }

  const allCards = await res.json();

  // ── Playable cards ──────────────────────────────────────────────────────
  const standardRaw  = filterStandard(allCards);
  const cardsDictionary = {};
  for (const raw of standardRaw) {
    cardsDictionary[raw.id] = normalizeCard(raw);
  }

  // ── Base heroes ─────────────────────────────────────────────────────────
  const heroesRaw = filterBaseHeroes(allCards);
  const heroesDictionary = {};
  for (const hero of heroesRaw) {
    heroesDictionary[hero.id] = hero;
  }

  return {
    cards:  cardsDictionary,
    heroes: heroesDictionary,
    count:  standardRaw.length,
  };
}
