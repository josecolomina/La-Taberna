// src/components/Shared/ManaBar.jsx
// Hexagonal mana crystals matching Hearthstone's look.
import React from 'react';

export default function ManaBar({ current, max }) {
  const crystals = Array.from({ length: 10 }, (_, i) => ({
    unlocked: i < max,
    filled:   i < current,
  }));

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex gap-[3px] items-center">
        {crystals.map(({ unlocked, filled }, i) => (
          unlocked ? (
            <div
              key={i}
              className={`mana-crystal ${filled ? 'mana-crystal-filled' : 'mana-crystal-empty'}`}
            />
          ) : (
            <div key={i} className="w-5 h-5 opacity-0" />
          )
        ))}
      </div>
      <div className="text-xs font-bold text-sky-300 tracking-widest"
        style={{ fontFamily: 'var(--font-hs)', textShadow: '0 0 6px rgba(14,165,233,0.8)' }}>
        {current}/{max}
      </div>
    </div>
  );
}
