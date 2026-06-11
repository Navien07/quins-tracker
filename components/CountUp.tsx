'use client'

import { useEffect, useRef, useState } from 'react'

/** Counts up from 0 to value with an ease-out curve on mount. */
export default function CountUp({
  value,
  duration = 1200,
  suffix = '',
}: {
  value: number
  duration?: number
  suffix?: string
}) {
  const [n, setN] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * value))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return (
    <>
      {n}
      {suffix}
    </>
  )
}
