import { useEffect, useState } from "react";
import { duplicateKnotNames, findKnot, knotName } from "../model/story.ts";
import { exportStory } from "../model/exportInk.ts";
import { useStory } from "../state/useStory.ts";
import { BlockList } from "./BlockList.tsx";
import { Splitter } from "./Splitter.tsx";

const INK_WIDTH_KEY = "cdb-ink-width";

function readInkWidth(): number {
  const stored = Number(localStorage.getItem(INK_WIDTH_KEY));
  return stored >= 280 && stored <= 1400 ? stored : 520;
}

export function KnotEditor() {
  const api = useStory();
  const [inkWidth, setInkWidth] = useState(readInkWidth);
  const found = findKnot(api.story, api.knotId);

  useEffect(() => {
    localStorage.setItem(INK_WIDTH_KEY, String(inkWidth));
  }, [inkWidth]);

  if (!found) return <main className="p-8 text-muted">Add a level and a knot.</main>;
  const name = knotName(found.level, found.knot);
  const clash = duplicateKnotNames(api.story).has(name);
  const files = exportStory(api.story);
  const levelFile = files.find((file) => file.path === `levels/level-${found.level.number}.ink`);
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Scene knot</p>
        <h1 className={`font-mono text-4xl leading-none break-all ${clash ? "text-danger" : "text-gold"}`}>{name}</h1>
        <p className="mt-2 text-sm text-muted">Game scenes link to this name. It is unique across the whole story.</p>
        {clash && <p className="mt-1 text-sm text-danger">Another knot already uses {name}.</p>}
        <label className="mt-4 block max-w-xs">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">Suffix</span>
          <input
            value={found.knot.suffix}
            onChange={(event) => api.setKnotSuffix(found.knot.id, event.target.value)}
            className="w-full rounded border border-line bg-panel px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-gold"
          />
        </label>
        <div className="mt-6">
          <BlockList knotId={found.knot.id} parentId={found.knot.id} blocks={found.knot.blocks} />
        </div>
      </div>
      <Splitter
        label="Resize ink panel"
        onDrag={(delta) => setInkWidth((width) => Math.min(1400, Math.max(280, width - delta)))}
      />
      <pre className="ink-view h-full min-h-0 shrink-0 overflow-auto bg-[#0c0b09] p-4 font-mono text-xs leading-5 text-ink" style={{ width: inkWidth }}>
        {levelFile?.contents}
      </pre>
    </main>
  );
}
