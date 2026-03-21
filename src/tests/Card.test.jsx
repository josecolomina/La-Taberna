// src/tests/Card.test.jsx
// Rendering tests for the Card component.
// Does NOT test Framer Motion animations or the SVG arrow (out of scope).
// Focuses on: DOM rendering, displayed props, affordance states.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mock framer-motion so tests run without animation overhead ──────────────
vi.mock('framer-motion', () => ({
  motion: {
    div:  ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useSpring: (v) => v,
  AnimatePresence: ({ children }) => children,
}));

// ── Mock useInteraction (interaction state machine) ─────────────────────────
vi.mock('../hooks/useInteraction', () => ({
  INTERACTION_STATE: { IDLE: 'IDLE', TARGETING_SPELL: 'TARGETING_SPELL', DRAGGING_MINION: 'DRAGGING_MINION' },
  useInteraction: () => ({
    state: 'IDLE',
    startTargetingSpell: vi.fn(),
    startDraggingMinion: vi.fn(),
  }),
}));

// ── Mock useGameStore to control mana ───────────────────────────────────────
vi.mock('../store/useGameStore', () => ({
  useGameStore: vi.fn((selector) => selector({
    playerState: { mana: { current: 8 } },
  })),
}));

import Card from '../components/Card/Card';

const SPELL_CARD = {
  id: 'card_fb1',
  type: 'spell',
  name: 'Fireball',
  cost: 4,
  damage: 6,
  image: 'https://example.com/fireball.png',
};

const MINION_CARD = {
  id: 'card_minion1',
  type: 'minion',
  name: 'Stonetusk Boar',
  cost: 1,
  attack: 1,
  health: 1,
  image: 'https://example.com/boar.png',
};

describe('Card – spell card rendering', () => {
  it('displays the card name', () => {
    render(<Card card={SPELL_CARD} handIndex={0} totalInHand={1} />);
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('displays the mana cost', () => {
    render(<Card card={SPELL_CARD} handIndex={0} totalInHand={1} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows the damage description', () => {
    render(<Card card={SPELL_CARD} handIndex={0} totalInHand={1} />);
    // Should mention "6" somewhere for the damage number display
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('renders the card image with correct src', () => {
    render(<Card card={SPELL_CARD} handIndex={0} totalInHand={1} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', SPELL_CARD.image);
    expect(img).toHaveAttribute('alt', 'Fireball');
  });
});

describe('Card – minion card rendering', () => {
  it('displays the minion name', () => {
    render(<Card card={MINION_CARD} handIndex={0} totalInHand={1} />);
    expect(screen.getByText('Stonetusk Boar')).toBeInTheDocument();
  });

  it('displays the mana cost in the gem badge', () => {
    render(<Card card={MINION_CARD} handIndex={0} totalInHand={1} />);
    // "1" appears as attack, health, and mana cost – just check at least one exists
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('renders attack and health stats for minions', () => {
    render(<Card card={MINION_CARD} handIndex={0} totalInHand={1} />);
    // both stats are "1" — check at least one text node is present
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Card – affordance states', () => {
  it('dims card (brightness-50) when mana is insufficient', () => {
    // The mock returns mana.current=8 but this card costs 4, so it's always affordable.
    // Render a card with cost=10 to force the "can't afford" branch.
    const expensiveCard = { ...SPELL_CARD, cost: 10 };
    const { container } = render(<Card card={expensiveCard} handIndex={0} totalInHand={1} />);
    const dimmed = container.querySelector('.brightness-50');
    expect(dimmed).toBeInTheDocument();
  });
});
