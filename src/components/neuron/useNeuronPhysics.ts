import { useRef, useCallback } from 'react'

export function useNeuronPhysics() {
  const animT = useRef(0)

  const tick = useCallback(() => {
    animT.current += 0.016
    return animT.current
  }, [])

  const pulse = useCallback((t: number) => Math.sin(t * 1.4) * 0.5 + 0.5, [])

  return { animT, tick, pulse }
}
