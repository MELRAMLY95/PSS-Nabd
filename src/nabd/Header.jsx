import { useEffect, useState } from "react";
import { sitePath } from "./site.js";

const LINKS = [
  ["concept", "Concept"],
  ["organs", "Organs"],
  ["connected", "Connected"],
  ["health", "System health"],
  ["vision", "Vision 2040"],
];

export function Header({ variant = "home" }) {
  const [active, setActive] = useState("concept");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (variant !== "home") return undefined;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4] });
    LINKS.forEach(([id]) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [variant]);

  const linkClass = (id) => (active === id ? "text-bio" : "text-mist hover:text-bio");

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3">
        <a href={sitePath("/")} className="group flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-bone">Nabd</span>
          <span className="font-display text-lg text-bio" lang="ar">نبض</span>
          <span className="nabd-beat" aria-hidden="true" />
          <span className="hidden font-mono text-[11px] tracking-[0.2em] text-dim sm:inline">OMAN·2040</span>
        </a>
        {variant === "home" ? (
          <nav className="hidden items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] lg:flex" aria-label="Sections">
            {LINKS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={linkClass(id)} aria-current={active === id ? "true" : undefined}>{label}</a>
            ))}
          </nav>
        ) : (
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-mist md:inline">Live simulation · You are the brain</span>
        )}
        {variant === "home" ? (
          <span className="flex items-center gap-3">
            <a href={sitePath("/body")} className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-mist hover:text-bone sm:inline">The human body</a>
            <a href={sitePath("/experience")} className="rounded-full bg-bio px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(198,165,106,0.4)]">Become the brain →</a>
          </span>
        ) : (
          <a href={sitePath("/")} className="rounded-full border border-line px-4 py-2 text-sm text-mist hover:border-bio hover:text-bio">← About the invention</a>
        )}
      </div>
      {variant === "home" && (
        <nav className="nabd-subnav font-mono text-[11px] uppercase tracking-[0.16em]" aria-label="Sections">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={linkClass(id)} aria-current={active === id ? "true" : undefined}>{label}</a>
          ))}
        </nav>
      )}
      {variant === "home" && <span className="nabd-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />}
    </header>
  );
}
