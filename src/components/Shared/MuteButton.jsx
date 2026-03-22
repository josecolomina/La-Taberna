// src/components/Shared/MuteButton.jsx
// Fixed-position mute/unmute toggle rendered in App.jsx.
// Reads and writes `muted` from useUserStore (persisted).

import React from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';

export default function MuteButton() {
  const { muted, toggleMute } = useUserStore();

  return (
    <motion.button
      onClick={toggleMute}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      title={muted ? 'Unmute' : 'Mute'}
      style={{
        position: 'fixed',
        top: 14, right: 16,
        zIndex: 500,
        width: 36, height: 36,
        borderRadius: '50%',
        border: '1px solid rgba(100,80,40,0.4)',
        background: 'rgba(20,14,6,0.72)',
        backdropFilter: 'blur(4px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: muted ? '#475569' : '#d4af37',
        boxShadow: muted ? 'none' : '0 0 10px rgba(212,175,55,0.2)',
        transition: 'color 0.2s, box-shadow 0.2s',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </motion.button>
  );
}
