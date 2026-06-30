import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'default' | 'outline' | 'destructive' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon'
  isLoading?: boolean
  icon?: React.ReactNode
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const variants: Record<string, string> = {
    primary:
      'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]',
    secondary:
      'bg-white/5 text-white border border-white/10 hover:bg-white/10',
    ghost:
      'bg-transparent text-slate-300 hover:text-white hover:bg-white/5',
    danger:
      'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20',
    ai: 'bg-gradient-to-r from-neon-violet/20 to-neon-cyan/20 text-white border border-neon-violet/50 relative overflow-hidden',
    // Backward compatibility mappings
    default: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]',
    outline: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
    destructive: 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20',
    link: 'bg-transparent text-neon-cyan hover:underline underline-offset-4',
  }

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    // Backward compatibility mappings
    default: 'px-4 py-2 text-sm',
    icon: 'h-10 w-10 p-0',
  }

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900',
        variants[variant],
        sizes[size],
        className
      )}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {/* AI shimmer effect */}
      {variant === 'ai' && (
        <span
          className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />
      )}
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  )
}
