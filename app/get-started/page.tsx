import { answersFromParams } from "@/lib/onboarding";
import TypeStep from "./_components/TypeStep";

export const metadata = { title: "Get started | ShopPlug", robots: { index: false } };

export default function GetStartedPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <TypeStep answers={answersFromParams(searchParams)} />;
}
