import { useEffect, useRef } from 'react'
import { mountDesign } from './mount-design'

export default function DesignBoard() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (host.current) {
      return mountDesign(host.current)
    }
  }, [])

  return <div ref={host} style={{ height: 480 }} />
}
