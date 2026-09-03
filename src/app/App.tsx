import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { HubPage } from "./pages/HubPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CalculatorsToolkitTool } from "../tools/calculators-toolkit/CalculatorsToolkitTool";
import { CountTool } from "../tools/count/CountTool";
import { DevToolkitTool } from "../tools/dev-toolkit/DevToolkitTool";
import { QrToolkitTool } from "../tools/qr-toolkit/QrToolkitTool";
import { TextToolkitTool } from "../tools/text-toolkit/TextToolkitTool";
import { TimeTool } from "../tools/time/TimeTool";
import { findTool } from "../tools/registry";
import { useRouteSeo } from "../core/seo/useRouteSeo";
import { useAppStore } from "../stores/appStore";

function ToolRoute() {
  const { toolId = "" } = useParams();
  const tool = findTool(toolId);
  // Unknown ids and tools that are still only a manifest both go home rather than
  // dead-ending a visitor on a "coming soon" screen.
  if (!tool?.implemented) return <Navigate to="/" replace />;
  if (tool.id === "count") return <CountTool />;
  if (tool.id === "time") return <TimeTool />;
  if (tool.id === "dev-toolkit") return <DevToolkitTool />;
  if (tool.id === "text-toolkit") return <TextToolkitTool />;
  if (tool.id === "calculators-toolkit") return <CalculatorsToolkitTool />;
  if (tool.id === "qr-toolkit") return <QrToolkitTool />;
  return <Navigate to="/" replace />;
}
export function App() {
  const initialize = useAppStore((s) => s.initialize);
  const ready = useAppStore((s) => s.ready);
  useRouteSeo();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  if (!ready)
    return (
      <div className="app-loading" aria-label="Loading TinyTools">
        <span className="brand-mark">T</span>
      </div>
    );
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/tools" element={<HubPage view="tools" />} />
        <Route path="/discover" element={<Navigate to="/tools" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tools/multi-count" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/goal-counter" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/event-tally" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/people-counter" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/lap-counter" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/click-logger" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/session-counter" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/daily-counter" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/counter-board" element={<Navigate to="/tools/count" replace />} />
        <Route path="/tools/:toolId" element={<ToolRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
