import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWeatherForecast, wmoCodeToCondition } from "../weather";

describe("wmoCodeToCondition", () => {
  it.each([
    [0, "clear"],
    [1, "partlyCloudy"],
    [2, "partlyCloudy"],
    [3, "cloudy"],
    [45, "fog"],
    [48, "fog"],
    [51, "drizzle"],
    [57, "drizzle"],
    [61, "rain"],
    [67, "rain"],
    [71, "snow"],
    [77, "snow"],
    [80, "showers"],
    [82, "showers"],
    [95, "thunderstorm"],
    [99, "thunderstorm"],
  ])("maps WMO code %i to %s", (code, expected) => {
    expect(wmoCodeToCondition(code)).toBe(expected);
  });

  it.each([44, 49, 58, 60, 68, 70, 78, 79, 83, 94, 100])(
    "falls back to cloudy for unmapped code %i",
    (code) => {
      expect(wmoCodeToCondition(code)).toBe("cloudy");
    },
  );
});

describe("fetchWeatherForecast", () => {
  const payload = {
    elevation: 3776,
    daily: {
      time: ["2026-01-01", "2026-01-02"],
      weather_code: [0, 61],
      temperature_2m_max: [5.4, 3.2],
      temperature_2m_min: [-2.6, -4.8],
      precipitation_sum: [0, 12.5],
      wind_speed_10m_max: [11.2, 20.9],
      wind_gusts_10m_max: [25.4, 40.1],
    },
  };

  function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
    const fn = vi.fn().mockResolvedValue({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => body,
    });
    vi.stubGlobal("fetch", fn);
    return fn;
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps the daily arrays into one entry per day", async () => {
    mockFetch(payload);
    const result = await fetchWeatherForecast(35.36, 138.72, 3776);

    expect(result.days).toHaveLength(2);
    expect(result.days[0]).toMatchObject({
      date: "2026-01-01",
      weatherCode: 0,
      tempMax: 5,
      tempMin: -3,
      precipitationSum: 0,
    });
  });

  it("rounds temperatures and wind speeds", async () => {
    mockFetch(payload);
    const [, second] = (await fetchWeatherForecast(0, 0, 0)).days;
    expect(second.tempMax).toBe(3);
    expect(second.windSpeedMax).toBe(21);
    expect(second.windGustsMax).toBe(40);
  });

  it("returns the elevation the API reports", async () => {
    mockFetch(payload);
    expect((await fetchWeatherForecast(0, 0, 0)).elevation).toBe(3776);
  });

  it("passes coordinates at four decimal places and the summit elevation", async () => {
    const fetchMock = mockFetch(payload);
    await fetchWeatherForecast(35.360600001, 138.7274, 3776);

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("latitude=35.3606");
    expect(url).toContain("elevation=3776");
    expect(url).toContain("forecast_days=7");
  });

  it("throws when the API responds with an error status", async () => {
    mockFetch(null, { ok: false, status: 429 });
    await expect(fetchWeatherForecast(0, 0, 0)).rejects.toThrow("429");
  });

  it("handles an empty forecast without failing", async () => {
    mockFetch({ elevation: 0, daily: { time: [] } });
    expect((await fetchWeatherForecast(0, 0, 0)).days).toEqual([]);
  });
});
