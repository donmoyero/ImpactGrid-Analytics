export const metadata = { title: "About — ImpactGrid Digital" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">About</p>
      <h1 className="mt-3 font-display text-4xl lg:text-5xl">A studio, not a self-serve tool.</h1>
      <div className="mt-8 space-y-5 text-slate">
        <p>
          ImpactGrid Digital is the website studio inside the ImpactGrid
          ecosystem. Where most page builders hand you a blank canvas and hope
          for the best, we work the way a good agency always has: you tell us
          about your business, and we design and build it for you.
        </p>
        <p>
          You still get the control — a dashboard that shows exactly where
          your project is, from planning through to launch — without having
          to learn a website builder to get there.
        </p>
        <p>
          We keep the studio focused: domains, design, build, and the
          ongoing care a live site needs. Nothing you don't need, nothing you
          have to configure yourself.
        </p>
      </div>
    </main>
  );
}
