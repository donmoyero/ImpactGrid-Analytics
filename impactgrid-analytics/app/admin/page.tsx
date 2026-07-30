const stats = [
  { label: "Open projects", value: "12" },
  { label: "Revenue this month", value: "£18,400" },
  { label: "New orders (7d)", value: "5" },
  { label: "Overdue invoices", value: "1" },
];

// Demo rows until wired to `projects` + `clients` tables.
const projects = [
  { customer: "Impact Bakery", package: "Business", domain: "impactbakery.co.uk", deadline: "14 Aug 2026", payment: "Paid", stage: "Design" },
  { customer: "North Fade Barbers", package: "Business", domain: "northfade.co.uk", deadline: "2 Aug 2026", payment: "Paid", stage: "Development" },
  { customer: "Willow & Co", package: "Premium", domain: "willowandco.com", deadline: "20 Aug 2026", payment: "Paid", stage: "Planning" },
  { customer: "Harper Legal", package: "Starter", domain: "harperlegal.co.uk", deadline: "5 Aug 2026", payment: "Due", stage: "Testing" },
];

export default function AdminHome() {
  return (
    <div>
      <p className="label-tag text-slate">Admin</p>
      <h1 className="mt-2 font-display text-3xl">Studio overview.</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-ink2 p-6">
            <p className="label-tag text-slate">{s.label}</p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-ink2">
              {["Customer", "Package", "Domain", "Deadline", "Payment", "Stage"].map((h) => (
                <th key={h} className="label-tag px-5 py-3 text-slate">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.customer} className="border-b border-line last:border-0">
                <td className="px-5 py-4 font-medium">{p.customer}</td>
                <td className="px-5 py-4 text-slate">{p.package}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate">{p.domain}</td>
                <td className="px-5 py-4 text-slate">{p.deadline}</td>
                <td className={`px-5 py-4 ${p.payment === "Paid" ? "text-blueprint2" : "text-signal"}`}>
                  {p.payment}
                </td>
                <td className="px-5 py-4 text-slate">{p.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
