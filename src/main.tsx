import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'
import { AuthProvider } from './context/AuthContext'
import { Analytics } from "@vercel/analytics/react"

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Analytics/>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
// Build trigger Thu Sep 18 04:42:15 IST 2025
