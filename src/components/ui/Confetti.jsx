import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const colors = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
]

function ConfettiPiece({ delay, x, color }) {
  return (
    <motion.div
      initial={{
        opacity: 1,
        y: 0,
        x: x,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -100, 200],
        x: [x, x + (Math.random() - 0.5) * 100, x + (Math.random() - 0.5) * 200],
        rotate: [0, 360, 720],
        scale: [1, 1.2, 0.5],
      }}
      transition={{
        duration: 2,
        delay: delay,
        ease: 'easeOut',
      }}
      className="absolute pointer-events-none"
      style={{
        width: Math.random() * 8 + 4,
        height: Math.random() * 8 + 4,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
    />
  )
}

export function Confetti({ isActive, onComplete }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.3,
        x: Math.random() * 300 - 150,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
      setPieces(newPieces)

      const timer = setTimeout(() => {
        setPieces([])
        onComplete?.()
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {pieces.map((piece) => (
            <ConfettiPiece
              key={piece.id}
              delay={piece.delay}
              x={piece.x}
              color={piece.color}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// Success burst animation for smaller celebrations
export function SuccessBurst({ isActive }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-full bg-status-approved/30 pointer-events-none"
        />
      )}
    </AnimatePresence>
  )
}
