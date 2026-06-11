'use client'

import { useEffect, useState } from 'react'
import CountUp from './CountUp'

/** Progress ring whose arc sweeps in and whose number counts up on mount. */
export default function AnimatedRing({
  percent,
  size = 132,
  stroke = 11,
}: {
  percent: number
  size?: number
  stroke?: number
}) {
  const [p, setP] = useState(0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (p / 100) * c

  useEffect(() => {
    const id = requestAnimationFrame(() => setP(percent))
    return () => cancelAnimationFrame(id)
  }, [percent])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--status-green)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,.61,.36,1)' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize={size * 0.22}
        fontWeight="700"
      >
        <CountUp value={percent} suffix="%" />
      </text>
    </svg>
  )
}
