/** Full-screen page, the same as Sign in and the Get started steps. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] overflow-hidden overscroll-contain bg-white text-paper">{children}</div>;
}
