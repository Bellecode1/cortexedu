import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { API_URL } from '@app/api/baseApi'
import { setCredentials, logout, selectIsLoading, setLoading } from '@features/auth'
import { Loader2 } from 'lucide-react'

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch()
  const isLoading = useSelector(selectIsLoading)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      dispatch(setLoading(false))
      return
    }

    const fetchProfile = async () => {
      try {
        const profileRes = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!profileRes.ok) {
          throw new Error('Token invalide')
        }

        const profileData = await profileRes.json()
        dispatch(setCredentials({ user: profileData.user, token }))
      } catch {
        // Token is invalid or expired — clear auth state
        dispatch(logout())
      }
    }

    fetchProfile()
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
