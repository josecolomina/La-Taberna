// src/tests/Minion.test.jsx
// Rendering tests for the Minion component.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('../hooks/useInteraction', () => ({
  INTERACTION_STATE: { IDLE: 'IDLE', TARGETING_SPELL: 'TARGETING_SPELL', ATTACKING: 'ATTACKING' },
  useInteraction: () => ({
    state: 'IDLE',
    lockedTarget: null,
    lockTarget: vi.fn(),
    clearTarget: vi.fn(),
  }),
}));

import Minion from '../components/Board/Minion';

const BASE_MINION = {
  id: 'min_test',
  type: 'minion',
  name: 'Test Minion',
  attack: 3,
  health: 4,
  image: 'https://example.com/minion.png',
  canAttack: false,
};

describe('Minion – stats rendering', () => {
  it('renders the attack value', () => {
    render(<Minion minion={BASE_MINION} owner="player" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the health value', () => {
    render(<Minion minion={BASE_MINION} owner="player" />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders the minion portrait image', () => {
    render(<Minion minion={BASE_MINION} owner="player" />);
    const img = screen.getByAltText('Test Minion');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', BASE_MINION.image);
  });
});

describe('Minion – keyword indicators', () => {
  it('renders the stealth icon when stealth=true', () => {
    render(<Minion minion={{ ...BASE_MINION, stealth: true }} owner="enemy" />);
    expect(screen.getByText('🌑')).toBeInTheDocument();
  });

  it('renders the windfury icon when windfury=true', () => {
    render(<Minion minion={{ ...BASE_MINION, windfury: true }} owner="player" />);
    expect(screen.getByText('💨')).toBeInTheDocument();
  });

  it('renders the poisonous icon when poisonous=true', () => {
    render(<Minion minion={{ ...BASE_MINION, poisonous: true }} owner="player" />);
    expect(screen.getByText('☠')).toBeInTheDocument();
  });

  it('does NOT render keyword icons when minion has none', () => {
    render(<Minion minion={BASE_MINION} owner="player" />);
    expect(screen.queryByText('🌑')).not.toBeInTheDocument();
    expect(screen.queryByText('💨')).not.toBeInTheDocument();
    expect(screen.queryByText('☠')).not.toBeInTheDocument();
  });
});
