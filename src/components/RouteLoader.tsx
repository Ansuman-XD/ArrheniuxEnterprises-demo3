import { useEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Top progress bar + subtle overlay shown during route transitions
 * and initial page loads. Purely presentational; auto-dismisses.
 */
export const RouteLoader = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const [active, setActive] = useState(true);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    setActive(true);
    setProgress(15);
    const t1 = setTimeout(() => setProgress(65), 80);
    const t2 = setTimeout(() => setProgress(92), 260);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setActive(false), 220);
    }, 480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, navType]);

  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none"
        style={{ opacity: active ? 1 : 0, transition: "opacity 300ms ease" }}
      >
        <div
          className="h-full bg-gradient-to-r from-accent via-primary to-accent shadow-[0_0_12px_hsl(var(--accent))]"
          style={{
            width: `${progress}%`,
            transition: "width 260ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <div
        aria-hidden
        className="fixed inset-0 z-[99] pointer-events-none bg-background/20 backdrop-blur-[1px]"
        style={{
          opacity: active ? 1 : 0,
          transition: "opacity 260ms ease",
        }}
      />
    </>
  );
};

export default RouteLoader;
