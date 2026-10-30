import TemplateBrowser from "@/components/templates/TemplateBrowser";

export const metadata = {
  title: "Templates — ShopPlug",
  description: "Website templates for every type of business. Pick yours and explore the whole site before you sign up.",
};

export default function TemplatesPage({ searchParams }: { searchParams?: { type?: string | string[] } }) {
  const type = Array.isArray(searchParams?.type) ? searchParams?.type[0] : searchParams?.type;
  return (
    <main>
      <TemplateBrowser initialCategory={type} />
    </main>
  );
}
