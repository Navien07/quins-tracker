'use client'

const COLORS = ['#3FB950', '#00897B', '#D29922', '#E6EDF3', '#2E7D32']

/** Deterministic 0..1 from a seed — pure (no Math.random), so safe during render. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Lightweight, dependency-free confetti burst. Renders fixed, non-interactive. */
export default function Confetti({ count = 70 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = rand(i + 1) * 100
        const delay = rand(i + 7) * 0.5
        const dur = 2.4 + rand(i + 13) * 1.4
        const w = 6 + rand(i + 19) * 8
        const h = w * (0.4 + rand(i + 23) * 0.4)
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${left}%`,
              width: w,
              height: h,
              background: COLORS[i % COLORS.length],
              borderRadius: 2,
              animation: `confettiFall ${dur}s linear ${delay}s forwards`,
            }}
          />
        )
      })}
    </div>
  )
}
