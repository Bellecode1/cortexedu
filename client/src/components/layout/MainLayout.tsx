import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { selectSidebarOpen } from '@features/ui'
import { cn } from '@lib/utils'

export const MainLayout = () => {
  const sidebarOpen = useSelector(selectSidebarOpen)

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Background grid overlay */}
      <div className="bg-grid" />

      <Header />
      <div className="flex pt-20">
        <Sidebar />
        <motion.main
          className={cn(
            'flex-1 p-4 lg:p-6 transition-all duration-300 min-h-[calc(100vh-5rem)]',
          )}
          animate={{
            marginLeft: sidebarOpen ? 260 : 80,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
