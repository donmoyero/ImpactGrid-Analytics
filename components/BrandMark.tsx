/** The ImpactGrid Business logo tile (public/images/brand-mark.png). */
export default function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/brand-mark.png" alt="" width={36} height={36} className={`${className} rounded-md`} />;
}
