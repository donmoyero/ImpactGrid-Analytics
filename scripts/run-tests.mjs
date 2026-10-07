// Runs every tests/*.test.ts with tsx. Works on Windows, macOS and Linux (no shell glob needed).
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const files = readdirSync("tests").filter((f) => f.endsWith(".test.ts")).sort().map((f) => `tests/${f}`);
if (files.length === 0) { console.error("No test files found in tests/."); process.exit(1); }
const r = spawnSync(process.execPath, [require.resolve("tsx/cli"), "--test", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
