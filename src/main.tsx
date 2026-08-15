import React, { lazy, Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { RouteFallback } from "./components/RouteFallback.tsx";
import { BookmarkProvider } from "./contexts/BookmarkContext";

// The landing route stays eager; everything else is split so that Leaflet and
// the summit pages are not part of the initial download.
const ActivatorPage = lazy(() =>
  import("./pages/ActivatorPage.tsx").then((m) => ({ default: m.ActivatorPage })),
);
const BookmarksPage = lazy(() =>
  import("./pages/BookmarksPage.tsx").then((m) => ({ default: m.BookmarksPage })),
);
const Help = lazy(() => import("./pages/Help.tsx").then((m) => ({ default: m.Help })));
const NearbyPage = lazy(() =>
  import("./pages/NearbyPage.tsx").then((m) => ({ default: m.NearbyPage })),
);
const NotFound = lazy(() => import("./pages/NotFound.tsx").then((m) => ({ default: m.NotFound })));
const SummitPage = lazy(() =>
  import("./pages/SummitPage.tsx").then((m) => ({ default: m.SummitPage })),
);
const SummitsListPage = lazy(() =>
  import("./pages/SummitsListPage.tsx").then((m) => ({ default: m.SummitsListPage })),
);

import "./index.css";
import "leaflet/dist/leaflet.css";
import "./i18n";
import { trackPageView } from "./utils/analytics";

// Page view tracker and scroll restoration component
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change only (not on search param changes like filter sliders)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const getPageTitle = () => {
      if (location.pathname === "/help") return "Help";
      if (location.pathname === "/nearby") return "Nearby Summits";
      if (location.pathname === "/summits") return "Browse Summits";
      if (location.pathname.startsWith("/summit/")) return "Summit Detail";
      if (location.pathname.startsWith("/activator/")) return "Activator History";
      if (location.pathname === "/bookmarks") return "Bookmarks";
      return "Home";
    };
    trackPageView(location.pathname, getPageTitle());
  }, [location.pathname]);

  return null;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/sota-peak-finder">
        <BookmarkProvider>
          <PageViewTracker />
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </ErrorBoundary>
        </BookmarkProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
