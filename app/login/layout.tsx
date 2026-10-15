/** Sign in is a full-screen page, the same as the Get started steps: it sits over the site's header and footer. */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] overflow-hidden overscroll-contain bg-white text-paper">{children}</div>;
}
