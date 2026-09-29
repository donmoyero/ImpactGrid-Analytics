/**
 * Payment-suspension CLI — run from the project folder:
 *
 *   npx tsx scripts/website.ts queue                          overdue invoices + the action available for each
 *   npx tsx scripts/website.ts suspend "ABC Fashion"          SUSPEND WEBSITE (needs an overdue invoice)
 *   npx tsx scripts/website.ts suspend "ABC Fashion" "reason" --force     override the overdue requirement
 *   npx tsx scripts/website.ts restore "ABC Fashion"          bring it back manually
 *   npx tsx scripts/website.ts status abcfashion.co.uk        what the enforcement layer sees for a hostname
 *   npx tsx scripts/website.ts careplan ["ABC Fashion"]      Care Plan status, renewal date, price and where the chain is up to
 *   npx tsx scripts/website.ts maintenance "ABC Fashion" on|off   manual maintenance mode
 *   npx tsx scripts/website.ts cycle --dry                    show what the reminder job WOULD do
 *   npx tsx scripts/website.ts cycle                          run the reminder job now
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || raw.trim().startsWith("#")) continue;
    const value = m[2].replace(/\s+#.*$/, "").replace(/^["']|[\"']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

const gbp = (n: number | string) => `£${Number(n).toFixed(2)}`;

async function main() {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dry = args.includes("--dry");
  const [cmd, a, b] = args.filter((x) => !x.startsWith("--"));

  const sus = await import("../lib/payments/suspension");
  const inv = await import("../lib/invoice/service");

  switch (cmd) {
    case "queue": {
      const rows = (await sus.getSuspensionQueue()) as any[];
      if (!rows.length) return console.log("No overdue invoices.");
      for (const r of rows) {
        console.log(
          `${r.invoice_number}  ${String(r.business_name).padEnd(24)} ${gbp(r.amount_due).padStart(9)} outstanding  ${String(r.days_past_due).padStart(3)}d past due  ->  ${r.admin_action}`
        );
      }
      return;
    }
    case "suspend": {
      if (!a) throw new Error('Usage: suspend "<business name or project id>" ["reason"] [--force]');
      const projectId = await inv.resolveProject(a);
      const site = await sus.suspendWebsite(projectId, b, { force });
      console.log(`Website suspended (${(site as any).suspended_reason}). It is now enforced at the application layer.`);
      return;
    }
    case "restore": {
      if (!a) throw new Error('Usage: restore "<business name or project id>"');
      await sus.restoreWebsite(await inv.resolveProject(a));
      console.log("Website restored.");
      return;
    }
    case "status": {
      if (!a) throw new Error("Usage: status <hostname>");
      console.log(`${a}: ${(await sus.siteStatusForHost(a)) ?? "not managed by ImpactGrid"}`);
      return;
    }
    case "careplan": {
      const { getCarePlans, describeCarePlan } = await import("../lib/care-plan/admin");
      const rows = await getCarePlans(a);
      if (!rows.length) return console.log(a ? `No Care Plan matches "${a}".` : "No Care Plans yet.");
      for (const r of rows) {
        console.log(`\n${r.business_name}`);
        for (const l of describeCarePlan(r)) console.log(`  ${l}`);
      }
      return;
    }
    case "maintenance": {
      if (!a || !["on", "off"].includes(b)) throw new Error('Usage: maintenance "<business name or project id>" on|off');
      await sus.setMaintenance(await inv.resolveProject(a), b === "on");
      console.log(b === "on" ? "Website is now in maintenance mode." : "Website is live again.");
      return;
    }
    case "cycle": {
      const { runPaymentCycle } = await import("../lib/payments/reminders");
      const { runCarePlanCycle } = await import("../lib/care-plan/cycle");
      const i = await runPaymentCycle({ dryRun: dry });
      const c = await runCarePlanCycle({ dryRun: dry });
      const lines = [...i.reminded, ...i.overdue, ...c.reminded, ...c.maintenance, ...c.expired];
      for (const l of lines) console.log(l);
      for (const l of [...i.failed, ...c.failed]) console.log(`FAILED  ${l}`);
      for (const l of [...i.errors, ...c.errors]) console.log(`ERROR   ${l}`);
      if (!lines.length && !i.failed.length && !c.failed.length && !i.errors.length && !c.errors.length) console.log("Nothing to do.");
      return;
    }
    default:
      console.log("Commands: queue | suspend <project> [reason] [--force] | restore <project> | status <host> | careplan [name] | maintenance <project> on|off | cycle [--dry]");
  }
}

main().catch((e) => {
  console.error(`Error: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
