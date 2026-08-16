import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BookmarkProvider } from "../contexts/BookmarkContext";

interface Options {
  /** Initial URL, including any search string. */
  route?: string;
  /** Route pattern to mount the element under, for pages that read params. */
  path?: string;
}

function Providers({ children, route = "/", path }: Options & { children: ReactNode }) {
  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <BookmarkProvider>
          {path ? <Routes>{<Route path={path} element={children} />}</Routes> : children}
        </BookmarkProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

/** Renders with the providers every page and most components depend on. */
export function renderWithProviders(ui: ReactElement, options: Options = {}): RenderResult {
  return render(<Providers {...options}>{ui}</Providers>);
}

/** Wrapper for renderHook, which takes the provider rather than an element. */
export function hookWrapper(options: Options = {}) {
  return ({ children }: { children: ReactNode }) => <Providers {...options}>{children}</Providers>;
}
