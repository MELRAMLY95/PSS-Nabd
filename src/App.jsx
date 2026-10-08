import Experience from "./nabd/Experience.jsx";
import Home from "./nabd/Home.jsx";

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return path === "/experience" ? <Experience /> : <Home />;
}
