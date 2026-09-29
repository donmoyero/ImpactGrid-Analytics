import Link from "next/link";

export const metadata = { title: "Order received — ImpactGrid Analytics" };

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center lg:px-10">
      <p className="label-tag text-slate">Order received</p>
      <h1 className="mt-3 font-display text-3xl">Thank you. Your Care Plan is set up.</h1>
      <p className="mt-4 text-slate">
        Your card is saved and your first year of the Care Plan is free. We&apos;ll
        email your website build invoice with bank transfer details, and get
        started once it&apos;s paid.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-medium text-paper hover:border-paper"
      >
        Back to home
      </Link>
    </main>
  );
}
