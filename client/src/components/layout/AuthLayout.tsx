import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-inter">
      {/* Grid overlay — 50px spacing */}
      <div className="bg-grid" />

      {/* Ambient floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left violet orb */}
        <motion.div
          className="absolute -top-48 -left-48 w-96 h-96 rounded-full mix-blend-screen blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(124,92,255,0.25) 0%, transparent 70%)',
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
        />
        {/* Bottom-right cyan orb */}
        <motion.div
          className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full mix-blend-screen blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.25) 0%, transparent 70%)',
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Card wrapper */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Glass card — horizontal split on md+ */}
        <div className="glass-panel rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col md:flex-row">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
