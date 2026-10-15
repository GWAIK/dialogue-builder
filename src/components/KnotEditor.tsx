import { duplicateKnotNames, findKnot, knotName } from "../model/story.ts";
import { exportStory } from "../model/exportInk.ts";
import { useStory } from "../state/useStory.ts";
import { BlockList } from "./BlockList.tsx";

export function KnotEditor() {
  const api = useStory();
  const found = findKnot(api.story, api.knotId);
  if (!found) return <main className="p-8 text-muted">Add a level and a knot.</main>;
  const name = knotName(found.level, found.knot);
  const clash = duplicateKnotNames(api.story).has(name);
  const files = exportStory(api.story);
  const levelFile = files.find((file) => file.path === `levels/level-${found.level.number}.ink`);
  return (
    <main className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[1fr_380px]">
      <div className="min-h-0 overflow-y-auto p-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Scene knot</p>
        <h1 className={`font-mono text-4xl leading-none ${clash ? "text-danger" : "text-gold"}`}>{name}</h1>
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
      <pre className="min-h-0 overflow-auto border-t border-line bg-[#0c0b09] p-4 font-mono text-xs leading-5 text-ink xl:border-t-0 xl:border-l">
        {levelFile?.contents}
      </pre>
    </main>
  );
}
