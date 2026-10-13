import { test } from "node:test";
import assert from "node:assert/strict";
import { GOALS, buildStartUrl, cleanAnswers } from "../lib/onboarding";
import { PLATFORM_URL, safeDestination } from "../lib/platform";

test("cleanAnswers trims, caps lengths and drops unknown goals", () => {
  const a = cleanAnswers({ name: "  Glow   Studio ", type: "x".repeat(200), goals: ["hack", "__proto__"] });
  assert.equal(a.name, "Glow Studio");
  assert.equal(a.type.length, 60);
  assert.deepEqual(a.goals, []);
  assert.equal(cleanAnswers({ name: "a".repeat(200) }).name.length, 80);
});

test("goals: several allowed, order kept, repeats and unknown ids dropped, old single goal still read", () => {
  assert.deepEqual(cleanAnswers({ goals: ["website", "bookings", "website", "nope", " products "] }).goals, ["website", "bookings", "products"]);
  assert.deepEqual(cleanAnswers({ goals: "bookings,team,,bad" }).goals, ["bookings", "team"]);
  assert.deepEqual(cleanAnswers({ goal: "website" }).goals, ["website"]);
  assert.deepEqual(cleanAnswers({ goals: ["team"], goal: "website" }).goals, ["team"]);
  assert.equal(GOALS.length, 16);
  assert.equal(new Set(GOALS.map((g) => g.id)).size, GOALS.length);
});

test("buildStartUrl points at the platform and encodes the answers", () => {
  const url = buildStartUrl({ name: "Joe & Sons", type: "Barber shop", goals: ["bookings", "products"] });
  const u = new URL(url);
  assert.equal(u.origin, new URL(PLATFORM_URL).origin);
  assert.equal(u.pathname, "/start");
  assert.equal(u.searchParams.get("name"), "Joe & Sons");
  assert.equal(u.searchParams.get("type"), "Barber shop");
  assert.equal(u.searchParams.get("goals"), "bookings,products");
  assert.equal(u.searchParams.get("goal"), "bookings"); // the first one, for a platform that only knows a single goal
});

test("buildStartUrl with no answers is still a valid platform URL, and is an accepted post-login destination", () => {
  assert.equal(buildStartUrl({}), `${PLATFORM_URL}/start`);
  assert.equal(safeDestination(buildStartUrl({ name: "Acme", goals: ["team"] })), buildStartUrl({ name: "Acme", goals: ["team"] }));
});

test("stepUrl: one page per step, carrying only clean answers", async () => {
  const { stepUrl, STEPS } = await import("../lib/onboarding");
  assert.equal(STEPS.length, 4);
  assert.equal(stepUrl(0, {}), "/get-started");
  assert.equal(stepUrl(1, { type: "Barber shop" }), "/get-started/goal?type=Barber+shop");
  assert.equal(stepUrl(3, { type: "Barber shop", goals: ["bookings", "products"], name: "Joe & Sons" }), "/get-started/account?type=Barber+shop&goals=bookings%2Cproducts&name=Joe+%26+Sons");
  assert.equal(stepUrl(2, { goals: ["hack"] }), "/get-started/name");
  assert.equal(stepUrl(99, {}), "/get-started/account");
  assert.equal(stepUrl(-5, {}), "/get-started");
});

test("answersFromParams and firstMissingStep send people back to what is missing", async () => {
  const { answersFromParams, firstMissingStep } = await import("../lib/onboarding");
  const a = answersFromParams({ type: ["Barber shop", "x"], goals: "bookings,team", name: undefined });
  assert.deepEqual(a, { name: "", type: "Barber shop", goals: ["bookings", "team"] });
  assert.deepEqual(answersFromParams({ goal: "website" }).goals, ["website"]); // links made before multiple goals
  assert.equal(firstMissingStep(0, {}), null);
  assert.equal(firstMissingStep(1, {}), 0);
  assert.equal(firstMissingStep(2, { type: "Cafe" }), 1);
  assert.equal(firstMissingStep(3, { type: "Cafe", goals: ["team"] }), 2);
  assert.equal(firstMissingStep(3, { type: "Cafe", goals: ["team"], name: "A" }), 2);
  assert.equal(firstMissingStep(3, { type: "Cafe", goals: ["team"], name: "Ab" }), null);
});

test("previewCopy follows the goals ticked and never needs a name", async () => {
  const { previewCopy } = await import("../lib/onboarding");
  assert.equal(previewCopy({}).title, "Your business");
  assert.equal(previewCopy({ goals: ["bookings"], name: "Joe" }).cta, "Book now");
  assert.deepEqual(previewCopy({ goals: ["bookings", "products"] }).links, ["Appointments", "Shop", "About"]);
  assert.equal(previewCopy({ goals: ["products", "bookings"] }).cta, "Shop now"); // the first goal sets the button
  assert.equal(previewCopy({ goals: ["website"], name: "Joe" }).headline, "Welcome to Joe");
  assert.equal(previewCopy({ type: "Barber shop" }).sub, "Barber shop");
  assert.ok(previewCopy({ goals: GOALS.map((g) => g.id) }).links.length <= 4);
});
