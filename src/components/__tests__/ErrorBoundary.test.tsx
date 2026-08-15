import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../i18n";
import { ErrorBoundary } from "../ErrorBoundary";

function Boom(): never {
  throw new Error("summit database unavailable");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // React and the boundary both log the caught error; keep the run readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>summit list</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("summit list")).toBeDefined();
  });

  it("shows a recoverable fallback instead of unmounting when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    // The message is surfaced so a failing database is diagnosable, not silent.
    expect(alert.textContent).toContain("summit database unavailable");
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("logs the error so it remains visible to diagnostics", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalled();
  });
});
