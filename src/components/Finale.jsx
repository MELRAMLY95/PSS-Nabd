import { useEffect, useRef, useState } from "react";
import { useSystem } from "../simulation/SystemContext.jsx";
import { useInView } from "../systems/useInView.js";

const STEPS = [
  ["brain"],
  ["brain", "heart"],
  ["brain", "heart", "kidneys"],
  ["brain", "heart", "kidneys", "lungs"],
  ["brain", "heart", "kidneys", "lungs", "liver"],
  ["brain", "heart", "kidneys", "lungs", "liver", "skin"],
];

export function Finale() {
  const ref = useRef(null);
  const inView = useInView(ref, "-10%");
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(-1);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { decision } = useSystem();

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setStep(8);
      return undefined;
    }
    setStep(0);
    const timers = STEPS.map((_, index) => window.setTimeout(() => setStep(index + 1), 700 * (index + 1)));
    timers.push(window.setTimeout(() => setStep(7), 700 * 7));
    timers.push(window.setTimeout(() => setStep(8), 700 * 8.4));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [inView, run, reduce]);

  return (
    <section id="finale" className="section finale" ref={ref} aria-labelledby="finale-title">
      <p className="kicker">
        <span>15</span>
        <span>Balance</span>
      </p>
      <div className={`finale-copy ${step >= 7 ? "is-on" : ""}`}>
        <p>If the human body can survive by working as one interconnected system,</p>
        <p className={step >= 8 ? "is-on" : ""}>why shouldn’t our future do the same?</p>
      </div>
      <h2 id="finale-title" className={step >= 8 ? "is-on" : ""}>
        Living Oman 2040
      </h2>
      <p className={`tag ${step >= 8 ? "is-on" : ""}`}>Learn from how the body works. Design a more resilient Oman.</p>
      <p className="prose">
        Your Oman 2040 — resilience {Math.round(decision.resilience)}. {decision.verdict}
      </p>
      <button type="button" onClick={() => setRun((value) => value + 1)}>
        Replay the sequence
      </button>
    </section>
  );
}
