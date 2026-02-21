import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import { Help } from './pages/Help.tsx'
import { SummitPage } from './pages/SummitPage.tsx'
import { SummitsListPage } from './pages/SummitsListPage.tsx'
import { NearbyPage } from './pages/NearbyPage.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { ActivatorPage } from './pages/ActivatorPage.tsx'
import { BookmarksPage } from './pages/BookmarksPage.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './i18n'
import { trackPageView } from './utils/analytics'

// Page view tracker and scroll restoration component
function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    // Scroll to top on route change only (not on search param changes like filter sliders)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    const getPageTitle = () => {
      if (location.pathname === '/help') return 'Help'
      if (location.pathname === '/nearby') return 'Nearby Summits'
      if (location.pathname === '/summits') return 'Browse Summits'
      if (location.pathname.startsWith('/summit/')) return 'Summit Detail'
      if (location.pathname.startsWith('/activator/')) return 'Activator History'
      if (location.pathname === '/bookmarks') return 'Bookmarks'
      return 'Home'
    }
    trackPageView(location.pathname, getPageTitle())
  }, [location.pathname])

  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/sota-peak-finder">
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/nearby" element={<NearbyPage />} />
          <Route path="/help" element={<Help />} />
          <Route path="/summits" element={<SummitsListPage />} />
          <Route path="/summit/:ref" element={<SummitPage />} />
          <Route path="/activator/:userId" element={<ActivatorPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
