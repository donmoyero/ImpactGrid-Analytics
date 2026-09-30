import { Suspense } from "react";
import BookProjectFlow from "./BookProjectFlow";

export const metadata = { title: "Start a project — ImpactGrid Analytics" };

export default function BookProjectPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Start a project</p>
      <h1 className="mt-3 font-display text-4xl">Let's set up your build.</h1>
      <p className="mt-4 text-slate">
        A few quick steps and tell us what you want. We review every request and
        email you when it's approved. Nothing to pay today.
      </p>

      <div className="mt-12">
        <Suspense fallback={null}>
          <BookProjectFlow />
        </Suspense>
      </div>
    </main>
  );
}
