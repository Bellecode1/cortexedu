import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'
import { store } from './app/store'
import { AppRouter } from './routes'
import { AuthInitializer } from './components/auth/AuthInitializer'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
      <Toaster position="top-right" richColors />
    </Provider>
  </React.StrictMode>
)
