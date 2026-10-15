import { duplicateKnotNames, knotName, levelSlug } from "../model/story.ts";
import { useStory } from "../state/useStory.ts";
import { TextInput } from "./fields.tsx";

export function Sidebar() {
  const api = useStory();
  const dupes = duplicateKnotNames(api.story);
  const levels = api.story.levels.slice().sort((a, b) => a.number - b.number);
  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto border-r border-line bg-panel p-4">
      <section>
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-muted">Facts</h2>
          <button type="button" className="text-xs text-gold" onClick={api.addFact}>
            + Fact
          </button>
        </header>
        <div className="space-y-2">
          {api.story.facts.map((fact) => (
            <div key={fact.id} className="grid grid-cols-[1fr_72px_auto] gap-1">
              <TextInput
                mono
                value={fact.name}
                onChange={(name) => api.updateFact(fact.id, { name: name.replace(/[^A-Za-z0-9_]/g, "") })}
              />
              <select
                value={fact.type}
                onChange={(event) =>
                  api.updateFact(fact.id, { type: event.target.value as "string" | "number" | "boolean" })
                }
                className="rounded border border-line bg-paper px-1 text-xs text-ink"
              >
                <option value="string">str</option>
                <option value="number">num</option>
                <option value="boolean">bool</option>
              </select>
              <button type="button" className="text-xs text-muted" onClick={() => api.removeFact(fact.id)}>
                ×
              </button>
              <div className="col-span-3">
                {fact.type === "boolean" ? (
                  <select
                    value={fact.initial === "true" ? "true" : "false"}
                    onChange={(event) => api.updateFact(fact.id, { initial: event.target.value })}
                    className="w-full rounded border border-line bg-paper px-2 py-1 text-xs text-ink"
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : (
                  <TextInput
                    mono
                    value={fact.initial}
                    placeholder="initial"
                    onChange={(initial) => api.updateFact(fact.id, { initial })}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-muted">Levels</h2>
          <button type="button" className="text-xs text-gold" onClick={api.addLevel}>
            + Level
          </button>
        </header>
        {levels.map((level) => (
          <div key={level.id} className="rounded border border-line p-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs text-muted">{levelSlug(level)}.ink</span>
              <input
                type="number"
                min={1}
                value={level.number}
                onChange={(event) => api.setLevelNumber(level.id, Number(event.target.value))}
                className="w-14 rounded border border-line bg-paper px-1 py-0.5 font-mono text-xs text-ink"
              />
              <button type="button" className="ml-auto text-xs text-muted" onClick={() => api.removeLevel(level.id)}>
                ×
              </button>
            </div>
            <div className="space-y-1">
              {level.knots.map((knot) => {
                const name = knotName(level, knot);
                const selected = knot.id === api.knotId;
                return (
                  <div key={knot.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => api.selectKnot(knot.id)}
                      className={`min-w-0 flex-1 truncate rounded px-2 py-1 text-left font-mono text-sm ${
                        selected ? "bg-gold text-paper" : "text-ink hover:bg-paper"
                      } ${dupes.has(name) ? "outline outline-1 outline-danger" : ""}`}
                    >
                      {name}
                    </button>
                    <button
                      type="button"
                      title={`Delete ${name}`}
                      aria-label={`Delete ${name}`}
                      onClick={() => api.removeKnot(knot.id)}
                      className="shrink-0 rounded px-1.5 py-1 text-xs text-muted hover:bg-paper hover:text-danger"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <button type="button" className="mt-2 text-xs text-muted" onClick={() => api.addKnot(level.id)}>
              + Knot
            </button>
          </div>
        ))}
      </section>
    </aside>
  );
}
