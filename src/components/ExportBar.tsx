import { exportStory } from "../model/exportInk.ts";
import { useStory } from "../state/useStory.ts";

function download(path: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = path.split("/").pop() ?? "story.ink";
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportBar() {
  const api = useStory();
  const files = exportStory(api.story);
  const saveAll = () => {
    files.forEach((file, index) => {
      window.setTimeout(() => download(file.path, file.contents), index * 150);
    });
  };
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Cacophobia</p>
        <h1 className="text-lg text-ink">Dialogue Builder</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {files.map((file) => (
          <button
            key={file.path}
            type="button"
            onClick={() => download(file.path, file.contents)}
            className="rounded border border-line px-2 py-1 font-mono text-xs text-muted hover:border-gold hover:text-ink"
          >
            {file.path}
          </button>
        ))}
        <button type="button" onClick={saveAll} className="rounded bg-gold px-3 py-1.5 text-sm text-paper">
          Export .ink
        </button>
        <button type="button" onClick={api.loadExample} className="text-xs text-muted hover:text-ink">
          Load sample
        </button>
      </div>
    </header>
  );
}
