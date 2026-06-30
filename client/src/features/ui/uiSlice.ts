import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  toast: {
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    isVisible: boolean
  } | null
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toast: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
      localStorage.setItem('theme', state.theme)
    },
    showToast: (
      state,
      action: PayloadAction<{
        message: string
        type: 'success' | 'error' | 'info' | 'warning'
      }>
    ) => {
      state.toast = { ...action.payload, isVisible: true }
    },
    hideToast: (state) => {
      state.toast = null
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  showToast,
  hideToast,
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectSidebarOpen = (state: { ui: UiState }) => state.ui.sidebarOpen
export const selectTheme = (state: { ui: UiState }) => state.ui.theme
export const selectToast = (state: { ui: UiState }) => state.ui.toast
