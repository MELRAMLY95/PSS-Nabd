import { useEffect, useId, useState } from "react";
import { SECTIONS } from "../data/content.js";

export function Nav() {
  const [active, setActive] = useState(SECTIONS[0].id);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-42% 0px -46% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = SECTIONS.find((section) => section.id === active) ?? SECTIONS[0];

  return (
    <>
      <a className="skip" href="#problem">
        Skip to the system
      </a>
      <header className="brand">
        <a href="#command">Humanity: the living planet</a>
        <span>Living Oman 2040 · December 2026</span>
      </header>
      <nav className="rail" aria-label="Exhibition sections">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={section.id === active ? "true" : undefined}
          >
            <span>{section.index}</span>
            <span>{section.label}</span>
          </a>
        ))}
      </nav>
      <div className="mobile-bar">
        <a href="#arrival">Living Oman 2040</a>
        <button type="button" aria-expanded={open} aria-controls={titleId} onClick={() => setOpen(true)}>
          {current.index} Index
        </button>
      </div>
      {open && (
        <div className="index-layer" role="presentation" onClick={() => setOpen(false)}>
          <nav
            id={titleId}
            className="index-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Sections"
            onClick={(event) => event.stopPropagation()}
          >
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={section.id === active ? "true" : undefined}
                onClick={() => setOpen(false)}
              >
                <span>{section.index}</span>
                {section.label}
              </a>
            ))}
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
