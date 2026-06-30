import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, FileText, Trophy, Clock, Info } from 'lucide-react'
import { Button } from '@components/ui/Button'
import { selectCurrentUser } from '@features/auth'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@app/api'
import { cn } from '@lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const iconMap: Record<string, React.ReactNode> = {
  submission: <FileText className="h-4 w-4 text-blue-500" />,
  grade: <Trophy className="h-4 w-4 text-yellow-500" />,
  quiz: <Clock className="h-4 w-4 text-indigo-500" />,
  info: <Info className="h-4 w-4 text-gray-500" />,
}

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const user = useSelector(selectCurrentUser)

  const { data: notifications } = useGetNotificationsQuery(user?.id || '', {
    skip: !user?.id,
  })
  const { data: unreadData } = useGetUnreadCountQuery(user?.id || '', {
    skip: !user?.id,
  })
  const [markAsRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()

  const unreadCount = unreadData?.count || 0

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notifId: string) => {
    await markAsRead(notifId)
  }

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await markAllRead(user.id)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-neon-pink rounded-full shadow-[0_0_8px_rgba(255,0,127,0.6)]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 z-50 w-80 mt-2 glass-panel rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-sm text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-3 w-3" />
                  Tout marquer lu
                </Button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {(!notifications || notifications.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors',
                      !notif.is_read && 'bg-neon-cyan/[0.02]'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {iconMap[notif.type] || <Info className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm truncate',
                            !notif.is_read ? 'font-semibold text-white' : 'font-medium text-slate-300'
                          )}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-neon-cyan flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
