// src/components/Shared/DamageNumber.jsx
// Floats up from the impact point and fades out.
import React from 'react';
import { motion } from 'framer-motion';

export default function DamageNumber({ amount, x, y }) {
  const isHeal   = amount > 0 && String(amount).startsWith('+');
  const color    = isHeal ? '#22c55e' : '#ef4444';
  const shadow   = isHeal
    ? '0 0 8px rgba(34,197,94,0.9)'
    : '0 0 10px rgba(239,68,68,0.9), 0 2px 0 #000';

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] font-black text-4xl select-none"
      style={{
        left: x,
        top: y,
        color,
        textShadow: shadow,
        WebkitTextStroke: '1.5px black',
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 1, y: 0, scale: 1.4 }}
      animate={{ opacity: 0, y: -70, scale: 1 }}
      transition={{ duration: 0.85, ease: 'easeOut' }}
    >
      {isHeal ? amount : `-${amount}`}
    </motion.div>
  );
}
