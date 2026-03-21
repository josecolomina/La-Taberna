// src/components/Shared/TargetingArrow.jsx
// Renders a living SVG Bezier curve from source to cursor.
// Covers the entire board area as an absolutely-positioned overlay.

import React, { useEffect, useRef } from 'react';
import { useInteraction, INTERACTION_STATE } from '../../hooks/useInteraction';

const ARROW_COLOR     = '#ff4d00';
const ARROW_GLOW      = 'rgba(255, 100, 0, 0.7)';
const ARROW_WIDTH     = 6;
const ARROWHEAD_SIZE  = 18;

export default function TargetingArrow({ boardRef }) {
  const { state, arrowStart, arrowEnd, lockedTarget } = useInteraction();
  const arrowActive =
    state === INTERACTION_STATE.TARGETING_SPELL ||
    state === INTERACTION_STATE.ATTACKING;

  if (!arrowActive) return null;

  const sx = arrowStart.x;
  const sy = arrowStart.y;
  const ex = arrowEnd.x;
  const ey = arrowEnd.y;

  // Cubic Bezier control points: pull upward for a nice arc
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cx1 = sx + dx * 0.25;
  const cy1 = sy - len * 0.3;
  const cx2 = ex - dx * 0.25;
  const cy2 = ey - len * 0.3;

  const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}`;

  // Approximate arrowhead angle at the end of the cubic bezier
  const aDx = ex - cx2;
  const aDy = ey - cy2;
  const angle = (Math.atan2(aDy, aDx) * 180) / Math.PI;

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full z-[999]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="arrow-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id="arrowhead"
          markerWidth={ARROWHEAD_SIZE}
          markerHeight={ARROWHEAD_SIZE}
          refX={ARROWHEAD_SIZE / 2}
          refY={ARROWHEAD_SIZE / 2}
          orient="auto"
        >
          <polygon
            points={`0 0, ${ARROWHEAD_SIZE} ${ARROWHEAD_SIZE / 2}, 0 ${ARROWHEAD_SIZE}`}
            fill={ARROW_COLOR}
          />
        </marker>
      </defs>

      {/* Glow layer */}
      <path
        d={pathD}
        stroke={ARROW_GLOW}
        strokeWidth={ARROW_WIDTH + 8}
        fill="none"
        filter="url(#arrow-glow)"
        strokeLinecap="round"
      />
      {/* Main line */}
      <path
        d={pathD}
        stroke={ARROW_COLOR}
        strokeWidth={ARROW_WIDTH}
        fill="none"
        markerEnd="url(#arrowhead)"
        strokeLinecap="round"
        strokeDasharray={lockedTarget ? 'none' : '14 6'}
        style={{
          strokeDashoffset: 0,
          animation: lockedTarget ? 'none' : 'dashMove 0.4s linear infinite',
        }}
      />

      <style>{`
        @keyframes dashMove {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </svg>
  );
}
