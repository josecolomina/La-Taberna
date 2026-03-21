// src/tests/Hero.test.jsx
// Rendering and interaction tests for the Hero component.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mock Framer Motion ──────────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div:  ({ children, ...p }) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}));

// ── Mock useInteraction ─────────────────────────────────────────────────────
vi.mock('../hooks/useInteraction', () => ({
  INTERACTION_STATE: { IDLE: 'IDLE', TARGETING_SPELL: 'TARGETING_SPELL', ATTACKING: 'ATTACKING' },
  useInteraction: () => ({
    state: 'IDLE',
    lockedTarget: null,
    lockTarget: vi.fn(),
    clearTarget: vi.fn(),
    startAttacking: vi.fn(),
  }),
}));

// ── Mock HeroPower (child component) ───────────────────────────────────────
vi.mock('../components/Board/HeroPower', () => ({
  default: ({ power }) => <div data-testid="hero-power">{power ? power.name : 'no-power'}</div>,
}));

import Hero from '../components/Board/Hero';

const PLAYER_STATE = {
  hp: 30,
  armor: 0,
  frozen: false,
  heroPower: null,
  heroPowerUsed: false,
  weapon: null,
};

const ENEMY_STATE = {
  hp: 14,
  armor: 5,
  frozen: false,
  heroPower: null,
  heroPowerUsed: true,
  weapon: null,
};

describe('Hero – player side', () => {
  it('renders the player hero portrait image', () => {
    render(<Hero type="player" state={PLAYER_STATE} />);
    const img = screen.getByAltText('Jaina');
    expect(img).toBeInTheDocument();
  });

  it('renders the correct HP value', () => {
    render(<Hero type="player" state={PLAYER_STATE} />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('does NOT render the armor badge when armor is 0', () => {
    render(<Hero type="player" state={PLAYER_STATE} />);
    expect(screen.queryByText('0 armor')).not.toBeInTheDocument();
  });

  it('renders the HeroPower child component', () => {
    render(<Hero type="player" state={PLAYER_STATE} />);
    expect(screen.getByTestId('hero-power')).toBeInTheDocument();
  });
});

describe('Hero – enemy side', () => {
  it('renders the enemy hero portrait image', () => {
    render(<Hero type="enemy" state={ENEMY_STATE} />);
    const img = screen.getByAltText('Garrosh');
    expect(img).toBeInTheDocument();
  });

  it('renders the correct enemy HP value', () => {
    render(<Hero type="enemy" state={ENEMY_STATE} />);
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders the armor badge when armor > 0', () => {
    render(<Hero type="enemy" state={ENEMY_STATE} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('Hero – edge cases', () => {
  it('renders 0 HP without crashing', () => {
    const deadHero = { ...PLAYER_STATE, hp: 0 };
    render(<Hero type="player" state={deadHero} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders frozen state without crashing', () => {
    const frozenHero = { ...ENEMY_STATE, frozen: true };
    render(<Hero type="enemy" state={frozenHero} />);
    // Just make sure it doesn't throw and still renders
    expect(screen.getByAltText('Garrosh')).toBeInTheDocument();
  });
});
