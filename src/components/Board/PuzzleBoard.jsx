// src/components/Board/PuzzleBoard.jsx
// Main arena. Global mouse tracking drives the SVG arrow.
// Features:
//   – Wood-frame board with stone-rune interior
//   – Taunt-aware target locking (via useInteraction)
//   – PlayHistory sidebar (left)
//   – Reset button (carved wood style, right side)
//   – LethalScreen overlay (epic animation)
//   – Wrong-move board shake + red flash

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore }   from '../../store/useGameStore';
import { useInteraction, INTERACTION_STATE } from '../../hooks/useInteraction';
import { useSound }       from '../../hooks/useSound';
import Hero             from './Hero';
import Minion           from './Minion';
import Hand             from '../Card/Hand';
import ManaBar          from '../Shared/ManaBar';
import Weapon           from './Weapon';
import TargetingArrow   from '../Shared/TargetingArrow';
import DamageNumber     from '../Shared/DamageNumber';
import PlayHistory      from '../Shared/PlayHistory';
import LethalScreen     from './LethalScreen';
import BoardClearScreen from '../BoardClear/BoardClearScreen';
import BoardClearFailScreen from '../BoardClear/BoardClearFailScreen';
import { useAppStore }  from '../../store/useAppStore';

export default function PuzzleBoard({ onNextPuzzle }) {
  const boardRef    = useRef(null);
  const {
    resetPuzzle,
    playerState,
    enemyState,
    performAction,
    isWrongMove,
    isLethalFound,
    isBoardCleared,
    winConditionType,
    pastStates,
    undoLastMove,
  } = useGameStore();

  const interaction = useInteraction();
  const { play } = useSound();

  useEffect(() => { resetPuzzle(); }, []);

  // ── Global mouse handlers ────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (interaction.state === INTERACTION_STATE.IDLE) return;
    interaction.updateArrow({ x: e.clientX, y: e.clientY });
  }, [interaction.state]);

  const handleMouseUp = useCallback(() => {
    const { state, source, lockedTarget } = useInteraction.getState();
    const storeState = useGameStore.getState();
    const { performAction: doAction, pendingBattlecry } = storeState;
    if (state === INTERACTION_STATE.IDLE) return;

    if (lockedTarget) {
      const targetId = lockedTarget.id;

      // ── Battlecry / Hero Power targeted resolution ─────────────────
      if (pendingBattlecry) {
        // Resolve the pending battlecry with the chosen target
        storeState.resolveBattlecry(targetId);
        interaction.backToIdle();

      } else if (state === INTERACTION_STATE.TARGETING_SPELL) {
        // Check if this is a hero power spell
        if (source?.card?.id === 'hero_power') {
          doAction({ action: 'use_hero_power', targetId });
        } else {
          doAction({ action: 'play_spell', cardId: source.card.id, targetId });
        }
      } else if (state === INTERACTION_STATE.ATTACKING) {
        const sourceId = source.minion?.id ?? source.minionId ?? 'player_hero';
        const isHeroAttack = sourceId === 'player_hero';
        doAction({
          action: isHeroAttack ? 'hero_attack' : 'attack',
          sourceId,
          targetId,
        });
      } else if (state === INTERACTION_STATE.DRAGGING_MINION) {
        doAction({ action: 'play_minion', cardId: source.card.id, targetId: 'player_board' });
      }

      const rect = document.getElementById(lockedTarget.id)?.getBoundingClientRect();
      if (rect) {
        interaction.spawnDamageNumber('!', rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      interaction.resolve();
      setTimeout(() => interaction.backToIdle(), 200);
    } else {
      interaction.cancel();
    }
  }, []);

  useEffect(() => {
    if (interaction.state !== INTERACTION_STATE.IDLE) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup',   handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [interaction.state, handleMouseMove, handleMouseUp]);

  // ── Player board drop zone ───────────────────────────────────────────
  const handleBoardMouseUp = (e) => {
    const { state, source } = useInteraction.getState();
    if (state === INTERACTION_STATE.DRAGGING_MINION && source?.card) {
      e.stopPropagation();
      performAction({ action: 'play_minion', cardId: source.card.id, targetId: 'player_board' });
      interaction.backToIdle();
    }
  };

  // ── Taunt-aware lockTarget factory ───────────────────────────────────
  // Passes the current enemy board so useInteraction can enforce taunt
  const makeLockTarget = useCallback(
    (id, type) => interaction.lockTarget(id, type, { enemyBoard: enemyState?.board ?? [] }),
    [interaction.lockTarget, enemyState?.board]
  );

  if (!playerState?.hp) {
    return (
      <div className="text-amber-300 text-2xl font-serif animate-pulse tracking-widest">
        Loading Board…
      </div>
    );
  }

  const isDragging = interaction.state === INTERACTION_STATE.DRAGGING_MINION;

  return (
    <div className="flex items-start gap-4 w-full max-w-6xl mx-auto">

      {/* ── LEFT SIDEBAR: Play History ─────────────────────────── */}
      <div className="flex-shrink-0 pt-2">
        <PlayHistory />
      </div>

      {/* ── BOARD FRAME CONTAINER ───────────────────────────────── */}
      <div ref={boardRef} className="relative flex-1" style={{ perspective: 1000 }}>
        <motion.div
          animate={isWrongMove ? { x: [-14, 14, -14, 14, 0] } : {}}
          transition={{ duration: 0.38 }}
          className="relative w-full h-[830px] overflow-hidden flex flex-col wood-texture"
          style={{
            borderRadius: 20,
            border: '12px solid',
            borderColor: '#3d1f06',
            boxShadow:
              '0 0 0 4px #6b3310, 0 0 0 6px #3d1f06, 0 20px 80px rgba(0,0,0,0.95)',
            outline: '4px solid #7a4a1e',
            outlineOffset: '-16px',
          }}
        >
          {/* ── SVG Targeting Arrow ─────────────────────────────── */}
          <TargetingArrow boardRef={boardRef} />

          {/* ── Epic Lethal Screen ──────────────────────────────── */}
          {winConditionType === 'LETHAL' && <LethalScreen isVisible={isLethalFound} />}
          {winConditionType === 'BOARD_CLEAR' && (
            <>
              <BoardClearScreen
                isVisible={isBoardCleared}
                onReset={() => { resetPuzzle(); interaction.backToIdle(); }}
                onMenu={() => useAppStore.getState().goTo('menu')}
                onNext={onNextPuzzle}
              />
              <BoardClearFailScreen
                isVisible={isWrongMove && !isBoardCleared}
                onReset={() => { resetPuzzle(); interaction.backToIdle(); }}
                onMenu={() => useAppStore.getState().goTo('menu')}
              />
            </>
          )}

          {/* ── Wrong move flash ────────────────────────────────── */}
          <AnimatePresence>
            {isWrongMove && winConditionType !== 'BOARD_CLEAR' && (
              <motion.div
                key="wrong"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-[90] flex items-center justify-center pointer-events-none"
                style={{ background: 'rgba(180,0,0,0.45)', backdropFilter: 'blur(2px)' }}
              >
                <span
                  className="font-black tracking-widest"
                  style={{
                    fontSize: '3.5rem',
                    color: '#ff4444',
                    fontFamily: 'var(--font-hs)',
                    textShadow: '0 0 30px red, 0 0 60px rgba(255,0,0,0.5)',
                  }}
                >
                  WRONG MOVE
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── END TURN + RESET row ────────────────────────────── */}
          <div className="absolute top-1/2 right-5 -translate-y-1/2 z-50 flex flex-col gap-3">
            {/* End Turn */}
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 20px rgba(180,140,60,0.6)' }}
              whileTap={{ scale: 0.93 }}
              onClick={() => performAction({ action: 'end_turn' })}
              disabled={isLethalFound || isBoardCleared}
              style={{
                width: 80, height: 52,
                background: 'radial-gradient(ellipse at 50% 30%, #3a3528, #1e1c16)',
                border: '3px solid #5a4a1e',
                borderRadius: 8,
                color: '#d4af37',
                fontFamily: 'var(--font-hs)',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.07em',
                textShadow: '0 0 8px rgba(212,175,55,0.6)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                cursor: (isLethalFound || isBoardCleared) ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>⚔</span>
              END TURN
            </motion.button>

            {/* Undo */}
            <motion.button
              whileHover={pastStates.length > 0 ? { scale: 1.06, boxShadow: '0 0 16px rgba(100,150,255,0.4)' } : {}}
              whileTap={pastStates.length > 0 ? { scale: 0.93 } : {}}
              onClick={() => {
                if (pastStates.length > 0) {
                  play('rewind');
                  undoLastMove();
                  interaction.backToIdle();
                }
              }}
              disabled={pastStates.length === 0}
              title="Undo Last Move"
              style={{
                width: 80, height: 38,
                background: 'radial-gradient(ellipse at 50% 30%, #22283a, #141820)',
                border: '2px solid #3a4060',
                borderRadius: 8,
                color: pastStates.length > 0 ? '#94a3b8' : '#475569',
                opacity: pastStates.length > 0 ? 1 : 0.5,
                fontFamily: 'var(--font-hs)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.07em',
                cursor: pastStates.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 1,
                boxShadow: '0 3px 10px rgba(0,0,0,0.6)',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>⏪</span>
              UNDO
            </motion.button>

            {/* Reset — carved stone button */}
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 16px rgba(100,150,255,0.4)' }}
              whileTap={{ scale: 0.93 }}
              onClick={() => { resetPuzzle(); interaction.backToIdle(); }}
              title="Reset Puzzle"
              style={{
                width: 80, height: 38,
                background: 'radial-gradient(ellipse at 50% 30%, #22283a, #141820)',
                border: '2px solid #3a4060',
                borderRadius: 8,
                color: '#94a3b8',
                fontFamily: 'var(--font-hs)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.07em',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 1,
                boxShadow: '0 3px 10px rgba(0,0,0,0.6)',
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>↺</span>
              RESET
            </motion.button>
          </div>

          {/* ════════════════ ENEMY HALF ════════════════ */}
          <div className="flex-1 flex flex-col stone-texture relative"
            style={{ borderBottom: '6px solid #0e0f13' }}>
            <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(60,80,160,0.15) 0%, transparent 70%)' }} />

            {/* Enemy hero + weapon */}
            <div className="flex justify-center items-start pt-4 gap-4 relative z-10">
              {enemyState.weapon && <Weapon weapon={enemyState.weapon} />}
              <div id="enemy_hero">
                <Hero
                  type="enemy"
                  state={enemyState}
                  onLockTarget={(id, type) => makeLockTarget(id, type)}
                />
              </div>
            </div>

            {/* Enemy board */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-5 flex-1 pb-2 relative z-10 max-w-full">
              {enemyState.board.map(m => (
                <div key={m.id} id={m.id}>
                  <Minion
                    minion={m}
                    owner="enemy"
                    onLockTarget={(id, type) => makeLockTarget(id, type)}
                  />
                </div>
              ))}
              {enemyState.board.length === 0 && (
                <span className="text-stone-600 text-sm tracking-widest font-serif opacity-60">— empty —</span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(100,200,80,0.2) 50%, transparent)' }} />

          {/* ════════════════ PLAYER HALF ════════════════ */}
          <div
            className="flex-1 flex flex-col stone-texture relative transition-all duration-150"
            style={isDragging ? {
              background: 'radial-gradient(ellipse at 50% 50%, rgba(50,100,200,0.18) 0%, transparent 70%)',
              boxShadow: 'inset 0 0 40px rgba(59,130,246,0.12)',
            } : {}}
            onMouseUp={handleBoardMouseUp}
          >
            <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 110%, rgba(60,80,160,0.12) 0%, transparent 70%)' }} />

            {/* Player board */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-5 flex-1 pt-2 relative z-10 max-w-full">
              {playerState.board.map(m => (
                <div key={m.id} id={m.id}>
                  <Minion minion={m} owner="player" />
                </div>
              ))}
              {isDragging && playerState.board.length < 7 && (
                <div className="border-2 border-dashed border-blue-400/50 rounded-full opacity-60"
                  style={{ width: 80, height: 100 }} />
              )}
            </div>

            {/* Player hero row */}
            <div className="flex justify-between items-end px-10 pb-28 relative z-10">
              <div className="flex-1" />
              <div className="flex items-end gap-3">
                {playerState.weapon && <Weapon weapon={playerState.weapon} />}
                <div id="player_hero">
                  <Hero type="player" state={playerState} />
                </div>
              </div>
              <div className="flex-1 flex justify-end">
                <ManaBar current={playerState.mana.current} max={playerState.mana.max} />
              </div>
            </div>
          </div>

          {/* ── Hand ──────────────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
            <div className="pointer-events-auto">
              <Hand cards={playerState.hand} />
            </div>
          </div>
        </motion.div>

        {/* Floating damage numbers */}
        <AnimatePresence>
          {interaction.damageNumbers.map(dn => (
            <DamageNumber key={dn.id} amount={dn.amount} x={dn.x} y={dn.y} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
