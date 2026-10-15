import { ExportBar } from "./components/ExportBar.tsx";
import { KnotEditor } from "./components/KnotEditor.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { StoryProvider } from "./state/StoryContext.tsx";

export default function App() {
  return (
    <StoryProvider>
      <div className="flex h-screen flex-col bg-paper text-ink">
        <ExportBar />
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
          <Sidebar />
          <KnotEditor />
        </div>
      </div>
    </StoryProvider>
  );
}
