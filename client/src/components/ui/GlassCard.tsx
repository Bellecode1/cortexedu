import { motion } from 'framer-motion'
import { cn } from '@lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
  hoverEffect?: boolean
  glowColor?: 'cyan' | 'violet'
  as?: 'div' | 'section' | 'article' | 'aside'
}

export const GlassCard = ({
  children,
  className,
  style,
  delay = 0,
  hoverEffect = false,
  glowColor,
  as: Component = 'div',
}: GlassCardProps) => {
  const MotionComponent = motion[Component as keyof typeof motion] as typeof motion.div

  return (
    <MotionComponent
      className={cn(
        'glass-panel rounded-2xl p-6',
        hoverEffect && 'hover:bg-navy-700/50 hover:border-white/20 transition-colors duration-300',
        glowColor === 'cyan' && 'neon-border-cyan',
        glowColor === 'violet' && 'neon-border-violet',
        className
      )}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </MotionComponent>
  )
}
