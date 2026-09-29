import Link from "next/link";

export const metadata = { title: "Checkout — ImpactGrid Digital" };

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center lg:px-10">
      <p className="label-tag text-slate">Checkout</p>
      <h1 className="mt-3 font-display text-3xl">Payment was cancelled or hasn't started yet.</h1>
      <p className="mt-4 text-slate">
        No charge was made. Head back to your project setup to review your order
        and try again when you're ready.
      </p>
      <Link
        href="/book-project"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-ink hover:bg-blueprint2"
      >
        Back to project setup
      </Link>
    </main>
  );
}
