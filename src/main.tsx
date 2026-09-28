import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { ToastProvider } from './components/toast/ToastProvider'
import { ThemeProvider } from './components/theme-provider'
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

    // In development the MSW worker may be legitimately active (VITE_MSW=true),
    // so it is left alone. In a production build it can never start again — the
    // guard below is dev-only and dist/mockServiceWorker.js is not shipped — so
    // a leftover registration (e.g. from having loaded the dev app on the same
    // origin) would silently keep intercepting fetches and must be removed.
    if (isMswWorker && import.meta.env.DEV) {
      continue
    }

    await registration.unregister()
    removedStaleWorker = true
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

  // Tree-shaking contract: MSW must only be reachable through this branch.
  // `import.meta.env.DEV` and `import.meta.env.VITE_MSW` are statically replaced
  // by Vite, so in a production build this becomes `if (false) {...}` and Rollup
  // drops the dynamic import together with src/mocks/browser.ts and every
  // handler under src/mocks/handlers/**.
  if (import.meta.env.DEV && import.meta.env.VITE_MSW === 'true') {
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
        <ThemeProvider defaultTheme="system" storageKey="petad-ui-theme">
          <ToastProvider>
            <BrowserRouter> {/* 2. Wrap your App */}
              <App />
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

bootstrap()
