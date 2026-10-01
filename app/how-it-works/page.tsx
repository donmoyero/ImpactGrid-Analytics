import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HowItWorks } from "@/components/HomeSections";
import { getHomepageContent } from "@/lib/site/content";
import { PLATFORM_LOGIN_URL } from "@/lib/platform";

export const metadata = { title: "How it works — ImpactGrid Analytics" };
export const revalidate = 60; // edited in Admin → Homepage

export default async function HowItWorksPage() {
  const c = await getHomepageContent();
  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 pb-4 pt-20 lg:px-10">
        <p className="label-tag text-slate">How it works</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl lg:text-5xl">From first idea to a live website.</h1>
      </div>

      <HowItWorks how={c.how} />

      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl lg:text-4xl">{c.cta.heading}</h2>
          <Link href={PLATFORM_LOGIN_URL} className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-ink hover:bg-blueprint2">
            {c.cta.button}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
