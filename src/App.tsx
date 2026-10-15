import { useEffect, useState } from "react";
import { ExportBar } from "./components/ExportBar.tsx";
import { KnotEditor } from "./components/KnotEditor.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { Splitter } from "./components/Splitter.tsx";
import { StoryProvider } from "./state/StoryContext.tsx";

const SIDEBAR_KEY = "cdb-sidebar-open";
const SIDEBAR_WIDTH_KEY = "cdb-sidebar-width";

function readWidth(): number {
  const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  return stored >= 200 && stored <= 560 ? stored : 280;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== "0");
  const [sidebarWidth, setSidebarWidth] = useState(readWidth);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  return (
    <StoryProvider>
      <div className="flex h-screen min-w-0 flex-col bg-paper text-ink">
        <ExportBar />
        <div className="flex min-h-0 min-w-0 flex-1">
          {sidebarOpen ? (
            <>
              <div className="h-full min-h-0 shrink-0" style={{ width: sidebarWidth }}>
                <Sidebar onHide={() => setSidebarOpen(false)} />
              </div>
              <Splitter
                label="Resize facts panel"
                onDrag={(delta) => setSidebarWidth((width) => Math.min(560, Math.max(200, width + delta)))}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="w-8 shrink-0 border-r border-line bg-panel text-xs tracking-widest text-muted [writing-mode:vertical-rl] hover:text-ink"
            >
              Show facts
            </button>
          )}
          <KnotEditor />
        </div>
      </div>
    </StoryProvider>
  );
}
