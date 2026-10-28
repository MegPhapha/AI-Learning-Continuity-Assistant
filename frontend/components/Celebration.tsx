'use client'

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['🎉', '⭐', '✨', '🏅', '🎊', '🌟', '💫', '🏆']

/**
 * Full-screen confetti burst shown when the student gets a practice answer right.
 * Renders animated emoji pieces; disappears by itself after ~2.5 seconds.
 */
export default function Celebration({ show, onHide }: { show: boolean; onHide: () => void }) {
  const pieces = useMemo(() => {
    if (!show) return []
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      // spread across the screen, deterministic per burst
      x: (i * 37) % 100,
      delay: (i % 12) * 0.04,
      rotate: (i * 47) % 360 - 180,
      size: 18 + ((i * 13) % 18),
    }))
  }, [show])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onHide, 2500)
    return () => clearTimeout(timer)
  }, [show, onHide])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: `${p.x}vw`, y: '-5vh', rotate: 0, opacity: 1 }}
              animate={{ y: '110vh', rotate: p.rotate, opacity: [1, 1, 0.9, 0.6] }}
              transition={{ duration: 1.8 + (p.delay * 2), delay: p.delay, ease: 'easeIn' }}
              className="absolute select-none"
              style={{ fontSize: p.size, left: 0 }}
            >
              {p.emoji}
            </motion.span>
          ))}
          {/* Center burst message */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-white rounded-3xl px-8 py-5 shadow-2xl border-4 border-amber-300"
          >
            <p className="text-3xl font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              Amazing work!
            </p>
            <p className="text-center text-sm text-slate-500 mt-1">+25 XP ⭐</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
