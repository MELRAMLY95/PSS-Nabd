import BodyHall from "./exhibit/BodyHall.jsx";
import PrototypePage from "./exhibit/PrototypePage.jsx";
import Experience from "./nabd/Experience.jsx";
import Home from "./nabd/Home.jsx";
import { currentRoute } from "./nabd/site.js";

export default function App() {
  const route = currentRoute();
  if (route === "/experience") return <Experience />;
  if (route === "/body") return <BodyHall />;
  if (route === "/prototype") return <PrototypePage />;
  return <Home />;
}
