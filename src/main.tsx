import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import { Help } from './pages/Help.tsx'
import { SummitPage } from './pages/SummitPage.tsx'
import { SummitsListPage } from './pages/SummitsListPage.tsx'
import { NotFound } from './pages/NotFound.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './i18n'
import { trackPageView } from './utils/analytics'

// Page view tracker component
function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    const pageTitle = location.pathname === '/help' ? 'Help' : 'Home'
    trackPageView(location.pathname, pageTitle)
  }, [location])

  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/sota-peak-finder">
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/help" element={<Help />} />
          <Route path="/summits" element={<SummitsListPage />} />
          <Route path="/summit/:ref" element={<SummitPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
