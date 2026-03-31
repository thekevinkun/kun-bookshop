// Import React 19's new createRoot API — this is how we mount our app to the DOM
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Import our global styles — this includes Tailwind and our CSS variables
import "./styles/globals.css";

// Import the root App component
import App from "./App.tsx";

// Find the <div id="root"> in index.html and mount our React app inside it
createRoot(document.getElementById("root")!).render(
  // StrictMode helps catch bugs during development by running checks twice
  <StrictMode>
    <App />
  </StrictMode>,
);
