import i18n from "i18next";
import { beforeEach, vi } from "vitest";
// Imported for its side effect: this is what initialises the i18n singleton.
import "../i18n";

/**
 * The i18n fallback is Japanese and the language detector reads the jsdom
 * environment, so without pinning this, assertions would depend on whatever
 * locale the test machine reports.
 */
await i18n.changeLanguage("en");

beforeEach(() => {
  localStorage.clear();

  // Any network call a test has not deliberately stubbed should fail loudly
  // rather than hang or hit the real service.
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      throw new Error(`unmocked fetch: ${String(input)}`);
    }),
  );
});
