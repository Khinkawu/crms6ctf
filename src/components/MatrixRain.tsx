'use client'
import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]<>/\\|=+-_~`flag{CTF}'
    const fontSize = 14
    let cols: number[]
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Array(Math.floor(canvas.width / fontSize)).fill(1)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px monospace`

      cols.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize

        // Lead char = bright white, trail = green shades
        if (y * fontSize < canvas.height * 0.1) {
          ctx.fillStyle = '#ffffff'
        } else {
          const brightness = Math.random()
          ctx.fillStyle = brightness > 0.95 ? '#aaffaa' : brightness > 0.7 ? '#00ff41' : '#008f11'
        }

        ctx.fillText(char, x, y * fontSize)

        if (y * fontSize > canvas.height && Math.random() > 0.975) {
          cols[i] = 0
        }
        cols[i]++
      })

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.18 }}
    />
  )
}
