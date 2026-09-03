import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AppErrorBoundary } from "./app/AppErrorBoundary";
import "./design-system/tokens.css";
import "./index.css";
import "./app/app.css";
import "./components/counter/counter.css";
import "./tools/time/time.css";
import "./tools/dev-toolkit/dev-toolkit.css";
import "./tools/text-toolkit/text-toolkit.css";
import "./tools/calculators-toolkit/calculators-toolkit.css";
import "./tools/qr-toolkit/qr-toolkit.css";
import "./tools/image-toolkit/image-toolkit.css";
import "./tools/pdf-toolkit/pdf-toolkit.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
