/**
 * The full ShopPlug wordmark (public/images/shopplug-logo.png).
 * The file is black on transparent; pass `light` to show it white on dark backgrounds.
 */
export default function BrandLogo({ className = "h-8 w-auto", light = false }: { className?: string; light?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/images/shopplug-logo.png"
      alt="ShopPlug"
      width={1200}
      height={221}
      className={`${className} ${light ? "brightness-0 invert" : ""}`}
    />
  );
}
