import Experience from "./nabd/Experience.jsx";
import Home from "./nabd/Home.jsx";
import { currentRoute } from "./nabd/site.js";

export default function App() {
  return currentRoute() === "/experience" ? <Experience /> : <Home />;
}
