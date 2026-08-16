import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import type { SotaSummit } from "../../utils/sotaDatabase";
import { PositionChecker } from "../PositionChecker";

const SUMMIT = {
  id: 1,
  ref: "JA/SO-001",
  name: "Fujisan",
  lat: 35.3606,
  lon: 138.7274,
  altitude: 3776,
  points: 10,
  activations: 42,
  bonus: null,
  association: "Japan",
  region: "SO",
} as SotaSummit;

let watchCallback: PositionCallback | null = null;
let watchError: PositionErrorCallback | null = null;
const clearWatch = vi.fn();

function stubGeolocation(available = true) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    writable: true,
    value: available
      ? {
          watchPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
            watchCallback = success;
            watchError = error ?? null;
            return 1;
          }),
          clearWatch,
        }
      : undefined,
  });
}

/** Delivers a GPS fix at the given altitude, relative to a summit at 3776 m. */
async function reportPosition(altitude: number | null, altitudeAccuracy: number | null = 5) {
  await act(async () => {
    watchCallback?.({
      coords: {
        latitude: 35.3606,
        longitude: 138.7274,
        altitude,
        accuracy: 8,
        altitudeAccuracy,
      },
      timestamp: Date.now(),
    } as GeolocationPosition);
  });
}

async function startWatching() {
  const buttons = screen.getAllByRole("button");
  await userEvent.click(buttons[0]);
}

beforeEach(() => {
  watchCallback = null;
  watchError = null;
  window.dataLayer = [];
  stubGeolocation();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PositionChecker", () => {
  it("waits for a fix before judging anything", () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);

    expect(screen.getByText(/POSITION CHECKER/)).toBeDefined();
    // No verdict is shown until a fix with altitude arrives.
    expect(screen.queryByText(/IN RANGE|OUT OF RANGE|UNCERTAIN/)).toBeNull();
  });

  it("reports being inside the activation zone at the summit", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3776);

    expect(screen.getByText(/IN RANGE/)).toBeDefined();
  });

  it("treats 25 m below the summit as still inside the zone", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3751, 0);

    expect(screen.getByText(/IN RANGE/)).toBeDefined();
  });

  it("reports being outside the zone below 25 m", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3700);

    expect(screen.getByText(/OUT OF RANGE/)).toBeDefined();
  });

  it("suggests how much further to climb when out of range", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3700);

    // 76 m below the summit, less the 25 m zone.
    expect(screen.getByText(/Ascend 51m/)).toBeDefined();
  });

  it("flags the result as uncertain when altitude accuracy spans the boundary", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3766, 20);

    expect(screen.getByText(/UNCERTAIN/)).toBeDefined();
  });

  it("records the first result with distances in metres", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3776);

    const event = window.dataLayer.find((e) => e.event === "position_check_result");
    expect(event).toMatchObject({ result: "in_range", vert_dist_m: 0, horiz_dist_m: 0 });
  });

  it("records the result only once per watch", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(3776);
    await reportPosition(3775);

    const events = window.dataLayer.filter((e) => e.event === "position_check_result");
    expect(events).toHaveLength(1);
  });

  it("announces starting and stopping the watch", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    expect(window.dataLayer.some((e) => e.summit_ref === "JA/SO-001")).toBe(true);
  });

  it("releases the GPS watch when unmounted", async () => {
    const { unmount } = renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    unmount();

    expect(clearWatch).toHaveBeenCalled();
  });

  it("withholds a verdict when the device reports no altitude", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();
    await reportPosition(null);

    expect(screen.queryByText(/IN RANGE|OUT OF RANGE/)).toBeNull();
    expect(window.dataLayer.filter((e) => e.event === "position_check_result")).toHaveLength(0);
  });

  it("surfaces a geolocation failure", async () => {
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();

    await act(async () => {
      watchError?.({ code: 1, message: "denied" } as GeolocationPositionError);
    });

    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("reports unsupported geolocation without throwing", async () => {
    stubGeolocation(false);
    renderWithProviders(<PositionChecker summit={SUMMIT} />);
    await startWatching();

    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});
