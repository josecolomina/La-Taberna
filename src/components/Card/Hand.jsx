// src/components/Card/Hand.jsx
// Cards fan out in an arc.  Each card receives its index so it can
// compute its own fan angle instead of the parent doing it.
import React from 'react';
import Card from './Card';

export default function Hand({ cards }) {
  return (
    <div className="relative flex justify-center items-end h-44 w-full pointer-events-none px-4">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className="pointer-events-auto -mx-4"
        >
          <Card
            card={card}
            handIndex={i}
            totalInHand={cards.length}
          />
        </div>
      ))}
    </div>
  );
}
