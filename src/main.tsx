import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import './index.css'
import App from './App.tsx'

const STALE_SW_RELOAD_KEY = 'petad:stale-sw-reload'

async function cleanupServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  let removedStaleWorker = false

  for (const registration of registrations) {
    const scriptUrl =
      registration.active?.scriptURL ??
      registration.waiting?.scriptURL ??
      registration.installing?.scriptURL

    if (!scriptUrl) {
      continue
    }

    const isMswWorker = scriptUrl.endsWith('/mockServiceWorker.js')

    if (!isMswWorker) {
      await registration.unregister()
      removedStaleWorker = true
    }
  }

  if (removedStaleWorker && !sessionStorage.getItem(STALE_SW_RELOAD_KEY)) {
    sessionStorage.setItem(STALE_SW_RELOAD_KEY, 'true')
    window.location.reload()
    return true
  }

  sessionStorage.removeItem(STALE_SW_RELOAD_KEY)
  return false
}

async function bootstrap() {
  const reloadingAfterCleanup = await cleanupServiceWorkers()

  if (reloadingAfterCleanup) {
    return
  }

  if (import.meta.env.VITE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter> {/* 2. Wrap your App */}
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

bootstrap()
