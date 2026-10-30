import DomainSearch from "@/components/domains/DomainSearch";

export const metadata = {
  title: "Domains — ShopPlug",
  description: "Search for the perfect domain name for your business.",
};

export default function DomainsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 lg:px-10 lg:py-28">
      <p className="eyebrow">Domains</p>
      <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight lg:text-6xl">Find your domain.</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate">
        Search for the name your customers will type. When you pick one, we&apos;ll connect it to your ShopPlug website.
      </p>
      <div className="mt-10">
        <DomainSearch />
      </div>
    </main>
  );
}
