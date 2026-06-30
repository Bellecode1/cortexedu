import { useSelector } from 'react-redux'
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectUserRole,
  selectIsStudent,
  selectIsTeacher,
  selectIsParent,
  selectIsAdmin,
  selectHasRole,
} from '@features/auth'
import type { UserRole } from '@/types'

export const useAuth = () => {
  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)
  const role = useSelector(selectUserRole)

  return {
    user,
    isAuthenticated,
    isLoading,
    role,
  }
}

export const useRole = () => {
  const isStudent = useSelector(selectIsStudent)
  const isTeacher = useSelector(selectIsTeacher)
  const isParent = useSelector(selectIsParent)
  const isAdmin = useSelector(selectIsAdmin)

  return {
    isStudent,
    isTeacher,
    isParent,
    isAdmin,
  }
}

export const useHasRole = (roles: UserRole[]) => {
  return useSelector((state: Parameters<typeof selectHasRole>[0]) =>
    selectHasRole(state, roles)
  )
}
