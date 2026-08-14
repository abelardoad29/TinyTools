import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { HubPage } from "./pages/HubPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ToolPlaceholder } from "./pages/ToolPlaceholder";
import { CountTool } from "../tools/count/CountTool";
import { findTool } from "../tools/registry";
import { canUseTool, useAppStore } from "../stores/appStore";

function ToolRoute({ owned }: { owned: ReturnType<typeof useAppStore.getState>["owned"] }) {
  const { toolId = "" } = useParams();
  const tool = findTool(toolId);
  if (!tool) return <Navigate to="/" replace />;
  const unlocked = canUseTool(tool.free, tool.entitlement, owned);
  if (tool.id === "count" && unlocked) return <CountTool />;
  return <ToolPlaceholder tool={tool} locked={!unlocked} />;
}
export function App() {
  const initialize = useAppStore((s) => s.initialize);
  const ready = useAppStore((s) => s.ready);
  const owned = useAppStore((s) => s.owned);
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
    <AppLayout owned={owned}>
      <Routes>
        <Route path="/" element={<HubPage owned={owned} />} />
        <Route path="/tools" element={<HubPage owned={owned} view="tools" />} />
        <Route path="/discover" element={<HubPage owned={owned} view="discover" />} />
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
        <Route path="/tools/:toolId" element={<ToolRoute owned={owned} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
