// src/utils/shareState.js
// Pure share utilities — no store imports.
// Builds human-readable text snapshots and copies to clipboard.

/**
 * Build a text summary of a mulligan result for sharing.
 * @param {object} scenario  — current scenario object from useMulliganStore
 * @param {Array}  feedback  — feedback[] from store
 * @param {number} score     — correct count
 * @returns {string}
 */
export function buildMulliganShareText(scenario, feedback, score) {
  if (!scenario || !feedback?.length) return '';

  const coin   = scenario.hasCoin ? ' 🪙' : '';
  const perfect = score === feedback.length;
  const header  = `🃏 Hearthstone Trainer — Mulligan Result\n${scenario.playerClass} vs ${scenario.opponentClass}${coin} | ${score}/${feedback.length} Correct${perfect ? ' ✦ Perfect!' : ''}`;

  const lines = feedback.map(f => {
    const verdict = f.isCorrect
      ? (f.playerKept ? '✓ Kept' : '✓ Discarded')
      : (f.playerKept ? '✕ Should discard' : '✕ Should keep');
    return `  ${f.name}: ${verdict} (${f.mulliganWinrate}% win rate)`;
  });

  return [header, ...lines, '\nhttps://github.com/josecolomina/La-Taberna'].join('\n');
}

/**
 * Build a text summary of a solved lethal puzzle.
 * @param {string} puzzleId
 * @param {string} title
 * @param {string} playerClass
 * @param {Array}  playHistory  — from useGameStore
 * @returns {string}
 */
export function buildPuzzleShareText(puzzleId, title, playerClass, playHistory) {
  const header = `⚔ Hearthstone Trainer — Lethal Found!\nPuzzle: ${title} (${puzzleId}) | ${playerClass ?? 'Unknown class'}`;

  const moves = (playHistory ?? []).map((h, i) => {
    if (h.action === 'play_spell')  return `  ${i + 1}. Played ${h.card?.name ?? '?'} → ${h.targetId}`;
    if (h.action === 'play_minion') return `  ${i + 1}. Played ${h.card?.name ?? '?'}`;
    if (h.action === 'attack')      return `  ${i + 1}. ${h.sourceId} attacked ${h.targetId}`;
    return `  ${i + 1}. ${h.action}`;
  });

  return [header, ...moves, '\nhttps://github.com/josecolomina/La-Taberna'].join('\n');
}

/**
 * Copy text to clipboard. Returns true on success.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    // Fallback for older browsers
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity  = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch (_2) {
      return false;
    }
  }
}
