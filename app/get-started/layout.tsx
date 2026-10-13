/**
 * The Get started flow is a full-screen experience: it sits over the site's normal header and footer (which stay
 * in the page underneath) so each question gets the whole window, like a setup wizard.
 */
export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] overflow-hidden overscroll-contain bg-white text-paper">{children}</div>;
}
