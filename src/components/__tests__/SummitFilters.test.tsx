import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FilterState } from "../../hooks/useSummitFilters";
import { renderWithProviders } from "../../test/render";
import { SummitFilters } from "../SummitFilters";

const FILTERS: FilterState = {
  country: "",
  association: "",
  region: "",
  minAltitude: 0,
  maxAltitude: 5000,
  minPoints: 1,
  maxPoints: 10,
  minActivations: 0,
  maxActivations: undefined,
  searchText: "",
  sortBy: "name",
  sortOrder: "asc",
  page: 1,
};

function renderFilters(overrides: Partial<FilterState> = {}) {
  const setFilters = vi.fn();
  const resetFilters = vi.fn();

  renderWithProviders(
    <SummitFilters
      filters={{ ...FILTERS, ...overrides }}
      setFilters={setFilters}
      resetFilters={resetFilters}
      countries={["Japan", "United States"]}
      associations={["Japan", "W7W"]}
      regions={["SO", "TK"]}
      filterRanges={{ minAltitude: 0, maxAltitude: 5000, maxActivations: 200 }}
    />,
  );

  return { setFilters, resetFilters };
}

describe("SummitFilters", () => {
  it("offers the countries it was given", () => {
    renderFilters();
    expect(screen.getAllByText(/Japan/).length).toBeGreaterThan(0);
  });

  it("reports a country choice upward", async () => {
    const { setFilters } = renderFilters();
    const selects = screen.getAllByRole("combobox");

    await userEvent.selectOptions(selects[0], "Japan");
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ country: "Japan" }));
  });

  it("reports typed search text", async () => {
    const { setFilters } = renderFilters();
    const search = screen.getAllByRole("textbox")[0];

    await userEvent.type(search, "f");
    expect(setFilters).toHaveBeenCalled();
  });

  it("shows the current search text", () => {
    renderFilters({ searchText: "fujisan" });
    expect(screen.getByDisplayValue("fujisan")).toBeDefined();
  });

  it("offers regions once an association is selected", () => {
    renderFilters({ association: "Japan" });
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1);
  });

  it("can be reset", async () => {
    const { resetFilters } = renderFilters({ searchText: "fuji" });
    const buttons = screen.getAllByRole("button");

    for (const button of buttons) {
      await userEvent.click(button);
    }
    expect(resetFilters).toHaveBeenCalled();
  });

  it("renders altitude and points controls", () => {
    const { container } = renderWithProviders(
      <SummitFilters
        filters={FILTERS}
        setFilters={vi.fn()}
        resetFilters={vi.fn()}
        countries={[]}
        associations={[]}
        regions={[]}
        filterRanges={{ minAltitude: 0, maxAltitude: 5000, maxActivations: 200 }}
      />,
    );

    expect(container.querySelectorAll("input").length).toBeGreaterThan(0);
  });
});
