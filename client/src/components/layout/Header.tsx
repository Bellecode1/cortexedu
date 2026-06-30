import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Menu,
  Sun,
  Moon,
  Search,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { selectCurrentUser } from '@features/auth'
import { selectSidebarOpen, toggleSidebar, selectTheme, toggleTheme } from '@features/ui'
import { NotificationDropdown } from '@components/notifications/NotificationDropdown'
import { getInitials } from '@lib/utils'

export const Header = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const sidebarOpen = useSelector(selectSidebarOpen)
  const theme = useSelector(selectTheme)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-20 glass-panel rounded-none border-t-0 border-l-0 border-r-0 z-50">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleSidebar())}
            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 lg:w-80 h-10 pl-10 pr-4 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile search toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Rechercher"
          >
            <Search className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleTheme}
            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </motion.button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile */}
          {user && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 pl-3 border-l border-white/10"
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-navy-700 border-2 border-neon-cyan/50 flex items-center justify-center font-semibold text-sm text-neon-cyan shadow-[0_0_10px_rgba(0,229,255,0.15)]">
                  {getInitials(user.name, user.surname)}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-navy-800" />
              </div>
              <div className="hidden lg:block">
                <p className="font-medium text-sm text-white">
                  {user.name} {user.surname}
                </p>
                <p className="text-[11px] text-slate-500">{user.role}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile search bar (animated) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden px-4 pb-3 overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all duration-200"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
