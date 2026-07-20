import logo from "@/assets/arrhenius-logo.png";

/**
 * Brand loader — displays the company logo with a pulsing halo,
 * rotating conic ring, and shimmer sweep. Used for full-page loads
 * and inline content loads.
 */
export const BrandLoader = ({
  fullscreen = false,
  label = "Loading",
  size = 96,
}: {
  fullscreen?: boolean;
  label?: string;
  size?: number;
}) => {
  const content = (
    <div className="flex flex-col items-center gap-6" role="status" aria-live="polite">
      <div
        className="brand-loader-wrap"
        style={{ width: size, height: size }}
      >
        <span className="brand-loader-plate" aria-hidden />
        <span className="brand-loader-orbit brand-loader-orbit--outer" aria-hidden />
        <span className="brand-loader-orbit brand-loader-orbit--inner" aria-hidden />
        <span className="brand-loader-halo" aria-hidden />
        <img
          src={logo}
          alt="Arrheniux"
          className="brand-loader-logo"
          draggable={false}
        />
        <span className="brand-loader-sheen" aria-hidden />
      </div>
      <div className="brand-loader-text">
        <span className="font-display tracking-[0.3em] text-xs text-ink uppercase">
          {label}
        </span>
        <span className="brand-loader-dot" />
        <span className="brand-loader-dot" style={{ animationDelay: "0.14s" }} />
        <span className="brand-loader-dot" style={{ animationDelay: "0.28s" }} />
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
