import { Suspense } from "react";
import BookProjectFlow from "./BookProjectFlow";

export const metadata = { title: "Start a project — ImpactGrid Digital" };

export default function BookProjectPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Start a project</p>
      <h1 className="mt-3 font-display text-4xl">Let's set up your build.</h1>
      <p className="mt-4 text-slate">
        A few quick steps, then straight to checkout. You can change anything
        later from your dashboard.
      </p>

      <div className="mt-12">
        <Suspense fallback={null}>
          <BookProjectFlow />
        </Suspense>
      </div>
    </main>
  );
}
