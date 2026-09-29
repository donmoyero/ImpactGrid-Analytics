import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in | ImpactGrid Analytics" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  // Only allow same-site relative redirects.
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/dashboard";
  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-2 text-slate">Manage your website, Care Plan and more.</p>
      <LoginForm next={next} />
    </main>
  );
}
