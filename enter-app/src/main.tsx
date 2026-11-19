import "./index.css";
import "./fs/styles/tokens.css";
import "./fs/styles/app.css";
import { createRoot } from "react-dom/client";
import "./setup";
import { bootstrapGeneratedSiteAnalytics } from "./analytics.ts";
import App from "./App.tsx";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./components/error-boundary/error-fallback";
import { reportCaughtError } from "./lib/report-caught-error";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found.");
}

bootstrapGeneratedSiteAnalytics();

createRoot(container, { onCaughtError: reportCaughtError }).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>,
);
