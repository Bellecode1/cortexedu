import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard,
  FileQuestion,
  Trophy,
  FileText,
  Users,
  GitBranch,
  LogOut,
  BrainCircuit,
} from 'lucide-react'
import { selectSidebarOpen } from '@features/ui'
import { selectUserRole, logout } from '@features/auth'
import { useDispatch } from 'react-redux'
import { cn } from '@lib/utils'
import type { UserRole } from '@/types'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    path: '/quiz',
    label: 'Quiz',
    icon: <FileQuestion className="h-5 w-5" />,
    roles: ['Student', 'Teacher', 'Administrateur'],
  },
  {
    path: '/examinations',
    label: 'Épreuves',
    icon: <FileText className="h-5 w-5" />,
    roles: ['Student', 'Teacher', 'Administrateur'],
  },
  {
    path: '/results',
    label: 'Résultats',
    icon: <Trophy className="h-5 w-5" />,
    roles: ['Student', 'Teacher', 'Parent', 'Administrateur'],
  },
  {
    path: '/admin/users',
    label: 'Utilisateurs',
    icon: <Users className="h-5 w-5" />,
    roles: ['Administrateur'],
  },
  {
    path: '/admin/branches',
    label: 'Branches',
    icon: <GitBranch className="h-5 w-5" />,
    roles: ['Administrateur'],
  },
]

export const Sidebar = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectSidebarOpen)
  const userRole = useSelector(selectUserRole)
  const location = useLocation()

  const handleLogout = () => {
    dispatch(logout())
  }

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  )

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  }

  return (
    <motion.aside
      className="fixed left-0 top-20 h-[calc(100vh-5rem)] z-40 flex flex-col glass-panel rounded-none border-l-0 border-t-0 border-b-0"
      variants={sidebarVariants}
      animate={isOpen ? 'expanded' : 'collapsed'}
      initial={false}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-center h-20 border-b border-white/10 px-4">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-neon-cyan" />
              </div>
              <div>
                <p className="font-bold tracking-tight">
                  <span className="text-white">Cortex</span><span className="text-neon-cyan">Edu</span>
                </p>
                <p className="text-[10px] text-slate-500">Plateforme éducative</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-10 w-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center"
            >
              <BrainCircuit className="h-5 w-5 text-neon-cyan" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="group relative block"
              title={!isOpen ? item.label : undefined}
            >
              {() => (
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <AnimatePresence mode="wait">
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium text-sm whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip when collapsed */}
                  {!isOpen && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg glass-panel text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20"
          title={!isOpen ? 'Déconnexion' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium text-sm whitespace-nowrap overflow-hidden"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>

          {!isOpen && (
            <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg glass-panel text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              Déconnexion
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
