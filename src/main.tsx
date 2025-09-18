import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'
import { AuthProvider } from './context/AuthContext'
import { Analytics } from "@vercel/analytics/react"

const queryClient = new QueryClient()

function HeaderMeasure() {
  useEffect(() => {
    const update = () => {
      const header = document.getElementById('appHeader')
      const leftLogo = document.querySelector('.issoperfec') as HTMLElement | null
      const rightLogo = document.querySelector('.jpisPef') as HTMLElement | null

      const rects: Array<DOMRect> = []
      if (header) rects.push(header.getBoundingClientRect())
      if (leftLogo) rects.push(leftLogo.getBoundingClientRect())
      if (rightLogo) rects.push(rightLogo.getBoundingClientRect())

      let bottomMax = 0
      for (const r of rects) bottomMax = Math.max(bottomMax, r.bottom)

      // Fallback if nothing found
      if (bottomMax === 0) bottomMax = 120

      // Add a small spacing below header visuals
      const h = Math.round(bottomMax + 8) // px from top of viewport
      document.documentElement.style.setProperty('--app-header-h', `${h}px`)
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    
    <QueryClientProvider client={queryClient}>
      <HeaderMeasure />
      <AuthProvider>
        <AppRouter />
        <Analytics/>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
// Build trigger Thu Sep 18 04:42:15 IST 2025
