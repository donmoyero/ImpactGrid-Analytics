import { test } from "node:test";
import assert from "node:assert/strict";
import { PLATFORM_CONTINUE_URL, PLATFORM_URL, resolveDestination, safeDestination } from "../lib/platform";

test("allows paths on this site", () => {
  assert.equal(safeDestination("/admin"), "/admin");
  assert.equal(safeDestination("/admin/homepage?x=1"), "/admin/homepage?x=1");
});

test("allows URLs on the platform", () => {
  assert.equal(safeDestination(`${PLATFORM_URL}/dashboard`), `${PLATFORM_URL}/dashboard`);
  assert.equal(safeDestination(`${PLATFORM_URL}/auth/continue?next=%2Finvite%2F1`), `${PLATFORM_URL}/auth/continue?next=%2Finvite%2F1`);
});

test("refuses open-redirect attempts", () => {
  for (const bad of [
    "//evil.com", "/\\evil.com", "https://evil.com", "http://evil.com/dashboard", "javascript:alert(1)",
    `${PLATFORM_URL}.evil.com/x`, `https://evil.com@${PLATFORM_URL.replace("https://", "")}`,
    `https://${PLATFORM_URL.replace("https://", "")}@evil.com/`, "/\t/evil.com", "/\n/evil.com", "evil.com", "", null, undefined,
  ]) assert.equal(safeDestination(bad as string | null | undefined), null, `should refuse ${String(bad)}`);
});

test("resolveDestination: default goes to the platform, paths stay on this site, platform URLs pass through", () => {
  assert.equal(resolveDestination(null, "https://impactgridanalytics.com"), PLATFORM_CONTINUE_URL);
  assert.equal(resolveDestination("/admin", "https://impactgridanalytics.com"), "https://impactgridanalytics.com/admin");
  assert.equal(resolveDestination(`${PLATFORM_URL}/dashboard`, "https://impactgridanalytics.com"), `${PLATFORM_URL}/dashboard`);
});
