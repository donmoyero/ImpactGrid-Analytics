import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStartUrl, cleanAnswers } from "../lib/onboarding";
import { PLATFORM_URL, safeDestination } from "../lib/platform";

test("cleanAnswers trims, caps lengths and drops unknown goals", () => {
  const a = cleanAnswers({ name: "  Glow   Studio ", type: "x".repeat(200), goal: "hack" });
  assert.equal(a.name, "Glow Studio");
  assert.equal(a.type.length, 60);
  assert.equal(a.goal, "");
  assert.equal(cleanAnswers({ name: "a".repeat(200) }).name.length, 80);
  assert.equal(cleanAnswers({ goal: "website" }).goal, "website");
});

test("buildStartUrl points at the platform and encodes the answers", () => {
  const url = buildStartUrl({ name: "Joe & Sons", type: "Barber shop", goal: "bookings" });
  const u = new URL(url);
  assert.equal(u.origin, new URL(PLATFORM_URL).origin);
  assert.equal(u.pathname, "/start");
  assert.equal(u.searchParams.get("name"), "Joe & Sons");
  assert.equal(u.searchParams.get("type"), "Barber shop");
  assert.equal(u.searchParams.get("goal"), "bookings");
});

test("buildStartUrl with no answers is still a valid platform URL, and is an accepted post-login destination", () => {
  assert.equal(buildStartUrl({}), `${PLATFORM_URL}/start`);
  assert.equal(safeDestination(buildStartUrl({ name: "Acme", goal: "team" })), buildStartUrl({ name: "Acme", goal: "team" }));
});
