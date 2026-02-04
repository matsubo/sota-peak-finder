import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import App from './App.tsx'
import { Help } from './pages/Help.tsx'
import './index.css'
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
    <BrowserRouter basename="/offline-qth">
      <PageViewTracker />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
