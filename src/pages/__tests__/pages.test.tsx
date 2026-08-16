import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";

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
};

const dashboardStats = {
  highestSummit: SUMMIT,
  lowestSummit: { ...SUMMIT, id: 2, ref: "JA/SO-002", altitude: 12 },
  mostValuable: [SUMMIT],
  mostActivated: [SUMMIT],
  unactivatedCount: 500,
  unactivatedSummits: [SUMMIT],
  countryStats: [{ country: "Japan", count: 3000 }],
  pointsDistribution: [{ points: 10, count: 100 }],
};

vi.mock("../../utils/sotaDatabase", () => ({
  sotaDatabase: {
    init: vi.fn(async () => undefined),
    onProgress: vi.fn(() => () => {}),
    getStats: vi.fn(async () => ({
      totalSummits: 181658,
      associations: [{ association: "Japan", count: 3000 }],
    })),
    getMetadata: vi.fn(async () => ({
      buildDate: "2026-08-15",
      version: "1.0",
      source: "sota.org.uk",
    })),
    getDashboardStats: vi.fn(async () => dashboardStats),
    findByRef: vi.fn(async () => SUMMIT),
    findNearby: vi.fn(async () => [{ ...SUMMIT, distance: 1.2 }]),
    searchSummits: vi.fn(async () => ({ summits: [SUMMIT], total: 1 })),
    getCountries: vi.fn(async () => ["Japan"]),
    getAssociations: vi.fn(async () => ["Japan"]),
    getRegionsByAssociation: vi.fn(async () => ["SO"]),
    getFilterRanges: vi.fn(async () => ({
      minAltitude: 0,
      maxAltitude: 5000,
      maxActivations: 200,
    })),
  },
}));

// Leaflet does not render meaningfully in jsdom; the pages' own logic is what
// these tests are about.
vi.mock("../../components/LocationMap", () => ({
  LocationMap: () => <div data-testid="location-map" />,
}));
vi.mock("../../components/HeroMapBanner", () => ({
  HeroMapBanner: ({ totalSummits }: { totalSummits: number | null }) => (
    <div data-testid="hero">{totalSummits}</div>
  ),
}));
vi.mock("../../components/PositionChecker", () => ({
  PositionChecker: () => <div data-testid="position-checker" />,
}));

vi.mock("../../utils/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/api")>()),
  fetchSummitActivations: vi.fn(async () => []),
  fetchActivatorHistory: vi.fn(async () => []),
}));
vi.mock("../../utils/weather", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/weather")>()),
  fetchWeatherForecast: vi.fn(async () => ({
    days: [],
    elevation: 3776,
    fetchedAt: new Date().toISOString(),
  })),
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.dataLayer = [];
});

describe("Help", () => {
  it("renders its guidance", async () => {
    const { Help } = await import("../Help");
    renderWithProviders(<Help />);
    expect(screen.getByRole("banner")).toBeDefined();
  });
});

describe("NotFound", () => {
  it("offers a way back home", async () => {
    const { NotFound } = await import("../NotFound");
    renderWithProviders(<NotFound />);

    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
  });
});

describe("BookmarksPage", () => {
  it("shows an empty state when nothing is saved", async () => {
    const { BookmarksPage } = await import("../BookmarksPage");
    renderWithProviders(<BookmarksPage />);
    expect(screen.getByRole("banner")).toBeDefined();
  });

  it("lists saved summits", async () => {
    localStorage.setItem(
      "sota-bookmarks",
      '{"JA/SO-001":{"status":"activated","savedAt":"2026-01-01T00:00:00Z"}}',
    );
    const { BookmarksPage } = await import("../BookmarksPage");
    renderWithProviders(<BookmarksPage />);

    expect(screen.getAllByText(/JA\/SO-001/).length).toBeGreaterThan(0);
  });
});

describe("App dashboard", () => {
  it("shows the worldwide summit total once statistics load", async () => {
    const { default: App } = await import("../../App");
    renderWithProviders(<App />);

    await waitFor(() => expect(screen.getByTestId("total-summits-value")).toBeDefined());
    expect(screen.getByTestId("total-summits-value").textContent).toBe("181,658");
  });

  it("surfaces the highest summit", async () => {
    const { default: App } = await import("../../App");
    renderWithProviders(<App />);

    await waitFor(() => expect(screen.getAllByText(/Fujisan/).length).toBeGreaterThan(0));
  });
});

describe("SummitsListPage", () => {
  it("renders results from the filtered search", async () => {
    const { SummitsListPage } = await import("../SummitsListPage");
    renderWithProviders(<SummitsListPage />, { route: "/summits" });

    await waitFor(() => expect(screen.getAllByText(/JA\/SO-001/).length).toBeGreaterThan(0), {
      timeout: 3000,
    });
  });
});

describe("SummitPage", () => {
  it("renders the summit named in the route", async () => {
    const { SummitPage } = await import("../SummitPage");
    renderWithProviders(<SummitPage />, {
      route: "/summit/ja-so-001",
      path: "/summit/:ref",
    });

    await waitFor(() => expect(screen.getAllByText(/Fujisan/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/JA\/SO-001/).length).toBeGreaterThan(0);
  });

  it("shows the summit altitude", async () => {
    const { SummitPage } = await import("../SummitPage");
    renderWithProviders(<SummitPage />, {
      route: "/summit/ja-so-001",
      path: "/summit/:ref",
    });

    await waitFor(() => expect(screen.getAllByText(/3,?776/).length).toBeGreaterThan(0));
  });
});

describe("ActivatorPage", () => {
  it("renders for a numeric activator id", async () => {
    const { ActivatorPage } = await import("../ActivatorPage");
    renderWithProviders(<ActivatorPage />, {
      route: "/activator/42",
      path: "/activator/:userId",
    });

    await waitFor(() => expect(screen.getByRole("banner")).toBeDefined());
  });
});

describe("NearbyPage", () => {
  it("renders its shell without a GPS fix", async () => {
    const { NearbyPage } = await import("../NearbyPage");
    renderWithProviders(<NearbyPage />, { route: "/nearby" });

    await waitFor(() => expect(screen.getByRole("banner")).toBeDefined());
  });
});
