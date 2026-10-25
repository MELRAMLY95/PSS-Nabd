import { useEffect, useRef, useState } from "react";
import { startLabMusic } from "./labMusic.js";

export function LabMusic() {
  const [on, setOn] = useState(false);
  const stopRef = useRef(null);

  useEffect(() => () => stopRef.current?.(), []);

  function toggle() {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
      setOn(false);
      return;
    }
    stopRef.current = startLabMusic();
    setOn(true);
  }

  return (
    <button type="button" className={`hul-music${on ? " is-on" : ""}`} aria-pressed={on} onClick={toggle}>
      {on ? "Music on" : "Music off"}
    </button>
  );
}
