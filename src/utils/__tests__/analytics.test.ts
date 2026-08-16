import { beforeEach, describe, expect, it } from "vitest";
import {
  trackBookmarkCycle,
  trackBookmarkRemove,
  trackLanguageChange,
  trackLocationFetchError,
  trackLocationFetchSuccess,
  trackOfflineMode,
  trackPageView,
  trackPositionCheckResult,
  trackPositionCheckStart,
  trackPositionCheckStop,
  trackSotaSummitView,
  trackSummitView,
} from "../analytics";

/** Most recent event pushed to the GTM dataLayer. */
function lastEvent() {
  return window.dataLayer[window.dataLayer.length - 1];
}

beforeEach(() => {
  window.dataLayer = [];
});

describe("analytics", () => {
  it("records a successful location fetch with its context", () => {
    trackLocationFetchSuccess({
      latitude: 35.6762,
      longitude: 139.6503,
      accuracy: 12,
      hasElevation: true,
      hasAddress: false,
      isOnline: true,
    });

    expect(lastEvent()).toMatchObject({ event: "location_fetch_success" });
  });

  it("records a location fetch error, including without a message", () => {
    trackLocationFetchError("permission_denied");
    expect(lastEvent()).toMatchObject({
      event: "location_fetch_error",
      error_type: "permission_denied",
    });

    trackLocationFetchError("timeout", "took too long");
    expect(lastEvent()).toMatchObject({
      event: "location_fetch_error",
      error_type: "timeout",
      error_message: "took too long",
    });
  });

  it("records a language change in both directions", () => {
    trackLanguageChange("en", "ja");
    expect(lastEvent()).toMatchObject({
      event: "language_change",
      from_language: "en",
      to_language: "ja",
    });
  });

  it("records a nearby summit view", () => {
    trackSotaSummitView(3, "JA/SO-001", 1200);
    expect(lastEvent()).toMatchObject({
      event: "sota_summit_view",
      summit_count: 3,
      nearest_summit_ref: "JA/SO-001",
      nearest_distance_meters: 1200,
    });
  });

  it("records offline state changes", () => {
    trackOfflineMode(true);
    expect(lastEvent()).toMatchObject({ event: "offline_mode", is_offline: true });

    trackOfflineMode(false);
    expect(lastEvent()).toMatchObject({ event: "offline_mode", is_offline: false });
  });

  it("records a page view", () => {
    trackPageView("/summits", "Browse Summits");
    expect(lastEvent()).toMatchObject({
      event: "page_view",
      page_path: "/summits",
      page_title: "Browse Summits",
    });
  });

  it("records a summit detail view", () => {
    trackSummitView("JA/SO-001", 10, 3776, "Japan");
    expect(lastEvent()).toMatchObject({
      event: "summit_view",
      summit_ref: "JA/SO-001",
      summit_points: 10,
      summit_altitude_m: 3776,
      summit_association: "Japan",
    });
  });

  describe("bookmarks", () => {
    it("records a cycle between two states", () => {
      trackBookmarkCycle("JA/SO-001", "want_to_go", "activated");
      expect(lastEvent()).toMatchObject({
        event: "bookmark_cycle",
        summit_ref: "JA/SO-001",
        from_status: "want_to_go",
        to_status: "activated",
      });
    });

    it("represents absent states as 'none' rather than null", () => {
      trackBookmarkCycle("JA/SO-001", null, null);
      expect(lastEvent()).toMatchObject({ from_status: "none", to_status: "none" });

      trackBookmarkRemove("JA/SO-001", null);
      expect(lastEvent()).toMatchObject({
        event: "bookmark_remove",
        previous_status: "none",
      });
    });

    it("records a removal with its previous state", () => {
      trackBookmarkRemove("JA/SO-001", "activated");
      expect(lastEvent()).toMatchObject({
        event: "bookmark_remove",
        summit_ref: "JA/SO-001",
        previous_status: "activated",
      });
    });
  });

  describe("position checker", () => {
    it("records the start and stop of a GPS watch", () => {
      trackPositionCheckStart("JA/SO-001");
      expect(lastEvent()).toMatchObject({ summit_ref: "JA/SO-001" });

      trackPositionCheckStop("JA/SO-001");
      expect(lastEvent()).toMatchObject({ summit_ref: "JA/SO-001" });
    });

    it("records a result with distances in metres", () => {
      trackPositionCheckResult("JA/SO-001", "in_range", -10, 45);
      expect(lastEvent()).toMatchObject({
        event: "position_check_result",
        summit_ref: "JA/SO-001",
        result: "in_range",
        vert_dist_m: -10,
        horiz_dist_m: 45,
      });
    });

    it.each(["in_range", "out_of_range", "uncertain"] as const)("records a %s result", (result) => {
      trackPositionCheckResult("JA/SO-001", result, 0, 0);
      expect(lastEvent()).toMatchObject({ result });
    });
  });

  it("appends rather than replacing, so events accumulate", () => {
    trackOfflineMode(true);
    trackPageView("/", "Home");
    expect(window.dataLayer).toHaveLength(2);
  });
});
