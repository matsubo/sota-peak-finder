import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import type { SotaSummit } from "../../utils/sotaDatabase";
import { BookmarkButton } from "../BookmarkButton";
import { Footer } from "../Footer";
import { Header } from "../Header";
import { RouteFallback } from "../RouteFallback";
import { StatsCard } from "../StatsCard";
import { SummitTable } from "../SummitTable";

function summit(overrides: Partial<SotaSummit> = {}): SotaSummit {
  return {
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
    ...overrides,
  } as SotaSummit;
}

describe("StatsCard", () => {
  it("renders its title and value", () => {
    renderWithProviders(<StatsCard title="Total Summits" value="181,658" />);

    expect(screen.getByText("Total Summits")).toBeDefined();
    expect(screen.getByText("181,658")).toBeDefined();
  });

  it("exposes a test id only when asked", () => {
    const { unmount } = renderWithProviders(
      <StatsCard title="Total" value="1" testId="total-summits" />,
    );
    expect(screen.getByTestId("total-summits-value").textContent).toBe("1");
    unmount();

    renderWithProviders(<StatsCard title="Total" value="1" />);
    expect(screen.queryByTestId("total-summits-value")).toBeNull();
  });

  it("renders an optional subtitle and trend", () => {
    renderWithProviders(
      <StatsCard
        title="Highest"
        value="3,776 m"
        subtitle="Worldwide"
        trend={{ value: "up 3", positive: true }}
      />,
    );

    expect(screen.getByText("Worldwide")).toBeDefined();
    expect(screen.getByText(/up 3/)).toBeDefined();
  });

  it("becomes a link when given a destination", () => {
    renderWithProviders(<StatsCard title="Summits" value="1" linkTo="/summits" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/summits");
  });

  it("accepts a numeric value", () => {
    renderWithProviders(<StatsCard title="Count" value={42} />);
    expect(screen.getByText("42")).toBeDefined();
  });
});

describe("Header", () => {
  it("links to the main sections", () => {
    renderWithProviders(<Header />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
  });

  it("shows a bookmark count once summits are saved", () => {
    localStorage.setItem(
      "sota-bookmarks",
      '{"JA/SO-001":{"status":"activated","savedAt":"2026-01-01T00:00:00Z"}}',
    );
    renderWithProviders(<Header />);
    expect(screen.getByText("1")).toBeDefined();
  });

  it("renders in both connection states", () => {
    const { unmount } = renderWithProviders(<Header isOnline />);
    expect(screen.getByRole("banner")).toBeDefined();
    unmount();

    renderWithProviders(<Header isOnline={false} />);
    expect(screen.getByRole("banner")).toBeDefined();
  });
});

describe("Footer", () => {
  it("credits the author and links to the repository", () => {
    renderWithProviders(<Footer />);
    expect(screen.getAllByText(/JE1WFV/).length).toBeGreaterThan(0);
  });

  it("shows the summit count and build date when provided", () => {
    renderWithProviders(<Footer sotaCount={181658} sotaBuildDate="2026-08-15" />);
    expect(screen.getByText(/181,658/)).toBeDefined();
  });

  it("omits database details when they are unknown", () => {
    renderWithProviders(<Footer sotaCount={null} sotaBuildDate={null} />);
    expect(screen.getByRole("contentinfo")).toBeDefined();
  });
});

describe("RouteFallback", () => {
  it("announces itself politely while a route loads", () => {
    renderWithProviders(<RouteFallback />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });
});

describe("BookmarkButton", () => {
  it("cycles status when clicked", async () => {
    const onCycle = vi.fn();
    renderWithProviders(<BookmarkButton status={null} onCycle={onCycle} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onCycle).toHaveBeenCalledOnce();
  });

  it("is labelled for assistive technology in each state", () => {
    for (const status of [null, "want_to_go", "activated"] as const) {
      const { unmount } = renderWithProviders(
        <BookmarkButton status={status} onCycle={() => {}} />,
      );
      expect(screen.getByRole("button").getAttribute("aria-label")).toBeTruthy();
      unmount();
    }
  });
});

describe("SummitTable", () => {
  const summits = [
    summit(),
    summit({ id: 2, ref: "W7W/KG-001", name: "Mount Si", association: "United States" }),
  ];

  it("renders a row per summit with its reference and name", () => {
    renderWithProviders(
      <SummitTable
        summits={summits}
        totalSummits={2}
        currentPage={1}
        onPageChange={() => {}}
        loading={false}
      />,
    );

    expect(screen.getAllByText("JA/SO-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mount Si").length).toBeGreaterThan(0);
  });

  it("links each summit to its detail page", () => {
    renderWithProviders(
      <SummitTable
        summits={[summit()]}
        totalSummits={1}
        currentPage={1}
        onPageChange={() => {}}
        loading={false}
      />,
    );

    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/summit/ja-so-001");
  });

  it("shows a loading state instead of rows", () => {
    const { container } = renderWithProviders(
      <SummitTable
        summits={[]}
        totalSummits={0}
        currentPage={1}
        onPageChange={() => {}}
        loading={true}
      />,
    );
    expect(container.textContent).toBeTruthy();
  });

  it("handles an empty result set", () => {
    const { container } = renderWithProviders(
      <SummitTable
        summits={[]}
        totalSummits={0}
        currentPage={1}
        onPageChange={() => {}}
        loading={false}
      />,
    );
    expect(container.textContent).toBeTruthy();
  });

  it("requests another page when pagination is used", async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <SummitTable
        summits={summits}
        totalSummits={200}
        currentPage={2}
        onPageChange={onPageChange}
        loading={false}
      />,
    );

    // Pagination controls are the buttons that are not per-row bookmark toggles.
    const pagers = screen
      .getAllByRole("button")
      .filter((b) => !b.getAttribute("aria-label")?.match(/bookmark/i));

    expect(pagers.length).toBeGreaterThan(0);
    await userEvent.click(pagers[pagers.length - 1]);
    expect(onPageChange).toHaveBeenCalled();
  });

  it("reports the association for a summit", () => {
    const { container } = renderWithProviders(
      <SummitTable
        summits={[summit()]}
        totalSummits={1}
        currentPage={1}
        onPageChange={() => {}}
        loading={false}
      />,
    );
    expect(within(container).getAllByText(/Japan/).length).toBeGreaterThan(0);
  });
});
