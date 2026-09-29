export default function BlueprintGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 bg-grid bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)] ${className}`}
    />
  );
}
