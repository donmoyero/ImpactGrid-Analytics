import DomainSearchBox from "@/components/DomainSearchBox";

export const metadata = { title: "Domain search — ImpactGrid Digital" };

export default function DomainSearchPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center lg:px-10">
      <p className="label-tag text-slate">Domain search</p>
      <h1 className="mt-3 font-display text-4xl lg:text-5xl">Find your name.</h1>
      <p className="mx-auto mt-4 max-w-md text-slate">
        Search directly — no third-party registrar to sign up for. Available
        domains are added straight to your order.
      </p>

      <div className="mt-10 text-left">
        <DomainSearchBox />
      </div>
    </main>
  );
}
