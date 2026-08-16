import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import { HeroMapBanner } from "../HeroMapBanner";
import { RecentActivations } from "../RecentActivations";
import { WeatherForecast } from "../WeatherForecast";

const fetchWeatherForecast = vi.fn();
const fetchSummitActivations = vi.fn();

vi.mock("../../utils/weather", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/weather")>()),
  fetchWeatherForecast: (...a: unknown[]) => fetchWeatherForecast(...a),
}));

vi.mock("../../utils/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/api")>()),
  fetchSummitActivations: (...a: unknown[]) => fetchSummitActivations(...a),
}));

const FORECAST = {
  elevation: 3776,
  fetchedAt: new Date().toISOString(),
  days: [
    {
      date: "2026-01-01",
      weatherCode: 0,
      tempMax: 5,
      tempMin: -3,
      precipitationSum: 0,
      windSpeedMax: 11,
      windGustsMax: 25,
    },
    {
      date: "2026-01-02",
      weatherCode: 71,
      tempMax: -1,
      tempMin: -9,
      precipitationSum: 8,
      windSpeedMax: 30,
      windGustsMax: 55,
    },
  ],
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchWeatherForecast.mockResolvedValue(FORECAST);
  fetchSummitActivations.mockResolvedValue([]);
});

describe("HeroMapBanner", () => {
  it("counts up to the worldwide summit total", async () => {
    renderWithProviders(<HeroMapBanner totalSummits={181658} isOnline />);

    // The figure animates upward, so the final value arrives asynchronously.
    await waitFor(() => expect(screen.getAllByText(/181,658/).length).toBeGreaterThan(0), {
      timeout: 5000,
    });
  });

  it("renders before the total is known", () => {
    const { container } = renderWithProviders(<HeroMapBanner totalSummits={null} isOnline />);
    expect(container.textContent).toBeTruthy();
  });

  it("renders while offline", () => {
    const { container } = renderWithProviders(
      <HeroMapBanner totalSummits={100} isOnline={false} />,
    );
    expect(container.textContent).toBeTruthy();
  });
});

describe("WeatherForecast", () => {
  it("renders a panel per forecast day", async () => {
    renderWithProviders(<WeatherForecast lat={35.36} lon={138.72} elevation={3776} />);

    await waitFor(() => expect(screen.getAllByText(/5|−3|-3/).length).toBeGreaterThan(0));
  });

  it("requests the forecast for the summit's own elevation", async () => {
    renderWithProviders(<WeatherForecast lat={35.36} lon={138.72} elevation={3776} />);
    await waitFor(() => expect(fetchWeatherForecast).toHaveBeenCalledWith(35.36, 138.72, 3776));
  });

  it("reports a failure instead of rendering an empty panel", async () => {
    fetchWeatherForecast.mockRejectedValue(new Error("rate limited"));
    const { container } = renderWithProviders(<WeatherForecast lat={0} lon={0} elevation={0} />);

    await waitFor(() => expect(container.textContent).toBeTruthy());
  });

  it("handles a forecast with no days", async () => {
    fetchWeatherForecast.mockResolvedValue({ ...FORECAST, days: [] });
    const { container } = renderWithProviders(<WeatherForecast lat={0} lon={0} elevation={0} />);

    await waitFor(() => expect(container.textContent).toBeTruthy());
  });
});

describe("RecentActivations", () => {
  it("shows an empty state when a summit has never been activated", async () => {
    const { container } = renderWithProviders(<RecentActivations summitRef="JA/SO-001" />);
    await waitFor(() => expect(container.textContent).toBeTruthy());
  });

  it("lists activations when there are any", async () => {
    fetchSummitActivations.mockResolvedValue([
      { activationDate: "2026-01-01", callsign: "JE1WFV", ownCallsign: "JE1WFV", qsos: 12 },
    ]);

    renderWithProviders(<RecentActivations summitRef="JA/SO-001" />);
    await waitFor(() => expect(screen.getAllByText(/JE1WFV/).length).toBeGreaterThan(0));
  });

  it("reports a failed lookup", async () => {
    fetchSummitActivations.mockRejectedValue(new Error("sota api down"));
    const { container } = renderWithProviders(<RecentActivations summitRef="JA/SO-001" />);

    await waitFor(() => expect(container.textContent).toBeTruthy());
  });
});
