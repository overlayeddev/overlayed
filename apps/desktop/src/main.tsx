// shim some stuff
import "core-js/actual/promise";

import { LazyStore } from "@tauri-apps/plugin-store";
import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App";
import { HashRouter } from "react-router-dom";
import "./styles.css";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import * as Sentry from "@sentry/react";
import { useConfigValue } from "./hooks/use-config-value";

Sentry.init({
  dsn: "https://c44ea5eb3278afec8dde67f040b051c8@o4506462955503616.ingest.us.sentry.io/4507379579289600",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/api.overlayed\.dev\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

function Test() {
  const { value: opacity, setValue: setOpacity } = useConfigValue("opacity");

  return (
    <div style={{ background: "#000", color: "white" }}>
      <h1>Test</h1>
      <p>Opacity: {opacity}</p>
      <button onClick={() => setOpacity(opacity - 0.1)}>Increase Opacity</button>
    </div>
  );
}

// create a context for the store
const store = new LazyStore("config.json");
export const StoreContext = React.createContext<LazyStore>(store);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <StoreContext.Provider value={store}>
            {/* <App /> */}
            <Test />
          </StoreContext.Provider>
        </ThemeProvider>
      </TooltipProvider>
    </HashRouter>
  </React.StrictMode>
);
