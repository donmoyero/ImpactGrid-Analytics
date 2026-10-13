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

test("stepUrl: one page per step, carrying only clean answers", async () => {
  const { stepUrl, STEPS } = await import("../lib/onboarding");
  assert.equal(STEPS.length, 4);
  assert.equal(stepUrl(0, {}), "/get-started");
  assert.equal(stepUrl(1, { type: "Barber shop" }), "/get-started/goal?type=Barber+shop");
  assert.equal(stepUrl(3, { type: "Barber shop", goal: "bookings", name: "Joe & Sons" }), "/get-started/account?type=Barber+shop&goal=bookings&name=Joe+%26+Sons");
  assert.equal(stepUrl(2, { goal: "hack" }), "/get-started/name");
  assert.equal(stepUrl(99, {}), "/get-started/account");
  assert.equal(stepUrl(-5, {}), "/get-started");
});

test("answersFromParams and firstMissingStep send people back to what is missing", async () => {
  const { answersFromParams, firstMissingStep } = await import("../lib/onboarding");
  const a = answersFromParams({ type: ["Barber shop", "x"], goal: "bookings", name: undefined });
  assert.deepEqual(a, { name: "", type: "Barber shop", goal: "bookings" });
  assert.equal(firstMissingStep(0, {}), null);
  assert.equal(firstMissingStep(1, {}), 0);
  assert.equal(firstMissingStep(2, { type: "Cafe" }), 1);
  assert.equal(firstMissingStep(3, { type: "Cafe", goal: "team" }), 2);
  assert.equal(firstMissingStep(3, { type: "Cafe", goal: "team", name: "A" }), 2);
  assert.equal(firstMissingStep(3, { type: "Cafe", goal: "team", name: "Ab" }), null);
});

test("previewCopy follows the goal and never needs a name", async () => {
  const { previewCopy } = await import("../lib/onboarding");
  assert.equal(previewCopy({}).title, "Your business");
  assert.equal(previewCopy({ goal: "bookings", name: "Joe" }).cta, "Book now");
  assert.equal(previewCopy({ goal: "products" }).links[0], "Shop");
  assert.equal(previewCopy({ goal: "website", name: "Joe" }).headline, "Welcome to Joe");
  assert.equal(previewCopy({ type: "Barber shop" }).sub, "Barber shop");
});
