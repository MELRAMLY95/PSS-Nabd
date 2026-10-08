import { useEffect, useState } from "react";
import { useSystem } from "../simulation/SystemContext.jsx";

export function Atmosphere() {
  const { sim } = useSystem();
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.phase = sim.phase;
  }, [sim.phase]);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? window.scrollY / max : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="vessel" aria-hidden="true">
      <span style={{ transform: `scaleY(${Math.max(0.06, scroll)})` }} />
    </div>
  );
}
