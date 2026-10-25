import { useEffect } from "react";
import { PrototypeCity } from "./PrototypeCity.jsx";
import "./bodyhall.css";

export default function PrototypePage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Our prototype · Sustainable Oman 2040";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="city-screen">
      <PrototypeCity />
    </main>
  );
}
