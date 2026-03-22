// src/hooks/useSound.js
// Thin hook wrapping audioService. Reads muted pref from useUserStore.
// Usage: const { play } = useSound(); play('click');

import { useCallback } from 'react';
import { useUserStore } from '../store/useUserStore';
import { playSound }   from '../services/audioService';

export function useSound() {
  const muted = useUserStore(s => s.muted);

  const play = useCallback((name) => {
    playSound(name, muted);
  }, [muted]);

  return { play };
}
