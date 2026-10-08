import { motion, useReducedMotion } from "framer-motion";
import { NetworkField } from "./NetworkField.jsx";

export function Arrival() {
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
      };

  const enter = () => {
    document.getElementById("problem")?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <section
      id="arrival"
      className="arrival"
      aria-labelledby="arrival-title"
      onPointerMove={(event) => {
        if (reduce) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        event.currentTarget.style.setProperty("--px", `${x * -18}px`);
        event.currentTarget.style.setProperty("--py", `${y * -12}px`);
      }}
    >
      <NetworkField />
      <div className="arrival-copy">
        <motion.p className="eyebrow" {...rise}>
          International Education Conference · Oman · December 2026
        </motion.p>
        <motion.h1 id="arrival-title" {...rise} transition={{ ...rise.transition, delay: 0.08 }}>
          Living
          <br />
          Oman
          <br />
          2040
        </motion.h1>
        <motion.p className="lede" {...rise} transition={{ ...rise.transition, delay: 0.16 }}>
          A living sustainability system for Oman 2040, designed from the way the human body manages resources.
        </motion.p>
        <motion.p className="question" {...rise} transition={{ ...rise.transition, delay: 0.24 }}>
          What if Oman 2040 could think, adapt and heal like a human body?
        </motion.p>
        <motion.button
          type="button"
          className="enter"
          onClick={enter}
          {...rise}
          transition={{ ...rise.transition, delay: 0.34 }}
        >
          Enter the system
          <i />
        </motion.button>
      </div>
    </section>
  );
}
