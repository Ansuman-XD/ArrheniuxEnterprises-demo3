/**
 * Simple, smooth brand loader — a clean spinner with a subtle accent glow.
 * Used for full-page loads and inline content loads.
 */
export const BrandLoader = ({
  fullscreen = false,
  label = "Loading",
  size = 64,
}: {
  fullscreen?: boolean;
  label?: string;
  size?: number;
}) => {
  const content = (
    <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
      <div className="simple-spinner" style={{ width: size, height: size }} aria-hidden />
      <div className="flex items-center gap-2">
        <span className="font-display tracking-[0.25em] text-[11px] uppercase text-muted-foreground">
          {label}
        </span>
        <span className="simple-spinner-dot" />
        <span className="simple-spinner-dot" style={{ animationDelay: "0.12s" }} />
        <span className="simple-spinner-dot" style={{ animationDelay: "0.24s" }} />
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  );

  if (!fullscreen) return content;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/85 backdrop-blur-md animate-fade-in">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ambient opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-[0.04]" />
      <div className="relative">{content}</div>
    </div>
  );
};

export default BrandLoader;
