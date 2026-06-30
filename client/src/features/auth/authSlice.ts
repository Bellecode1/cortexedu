import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.isLoading = false
      localStorage.setItem('token', token)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      localStorage.removeItem('token')
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    initAuth: (state) => {
      const token = localStorage.getItem('token')
      if (token) {
        state.token = token
        state.isLoading = true
      } else {
        state.isLoading = false
      }
    },
  },
})

export const { setCredentials, logout, updateUser, setLoading, initAuth } =
  authSlice.actions

export default authSlice.reducer

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated
export const selectUserRole = (state: { auth: AuthState }) =>
  state.auth.user?.role
export const selectIsLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading

// Role-based selectors
export const selectIsStudent = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'Student'
export const selectIsTeacher = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'Teacher'
export const selectIsParent = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'Parent'
export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'Administrateur'

export const selectHasRole = (state: { auth: AuthState }, roles: UserRole[]) =>
  state.auth.user?.role ? roles.includes(state.auth.user.role) : false
