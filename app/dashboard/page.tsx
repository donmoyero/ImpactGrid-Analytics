import ProgressTracker from "@/components/ProgressTracker";

// Demo data shown until Supabase auth + queries are wired in.
// Replace with a server-side fetch from `projects` filtered by the signed-in client.
const demoProject = {
  business_name: "Impact Bakery",
  package: "Business",
  domain: "impactbakery.co.uk",
  stage: "design" as const,
  progress: { planning: 100, design: 60, development: 0, testing: 0, completed: 0 },
  deadline: "14 Aug 2026",
  payment_status: "paid" as const,
};

export default function DashboardPage() {
  return (
    <div>
      <p className="label-tag text-slate">Dashboard</p>
      <h1 className="mt-2 font-display text-3xl">Welcome back, {demoProject.business_name}.</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="crosshair rounded-2xl border border-line bg-ink2 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Project progress</h2>
            <span className="label-tag rounded-full border border-blueprint2 px-2.5 py-1 text-blueprint2">
              {demoProject.package} package
            </span>
          </div>
          <div className="mt-6">
            <ProgressTracker currentStage={demoProject.stage} progress={demoProject.progress} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-ink2 p-6">
            <p className="label-tag text-slate">Domain</p>
            <p className="mt-2 font-mono text-sm">{demoProject.domain}</p>
          </div>
          <div className="rounded-2xl border border-line bg-ink2 p-6">
            <p className="label-tag text-slate">Target launch</p>
            <p className="mt-2 text-sm">{demoProject.deadline}</p>
          </div>
          <div className="rounded-2xl border border-line bg-ink2 p-6">
            <p className="label-tag text-slate">Payment status</p>
            <p className="mt-2 text-sm capitalize text-blueprint2">{demoProject.payment_status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
