import { useState, type ReactNode } from "react";
import type { CompareOp } from "../model/types.ts";
import { factById } from "../model/story.ts";
import type { Block, ChoiceBlock, Command, ConditionalBlock, LineBlock, SetFactBlock } from "../model/types.ts";
import { useStory } from "../state/useStory.ts";
import { AddBar } from "./AddBar.tsx";
import { Area, FactValueInput, IconButton, Label, TextInput } from "./fields.tsx";

const OPS: CompareOp[] = ["==", "!=", ">", "<", ">=", "<="];

export function BlockList({
  knotId,
  parentId,
  blocks,
}: {
  knotId: string;
  parentId: string;
  blocks: Block[];
}) {
  const story = useStory();
  const groups = groupBlocks(blocks);
  return (
    <div className="space-y-3">
      {groups.map((group) =>
        group.kind === "choices" ? (
          <ChoiceGroup key={group.blocks[0].id} knotId={knotId} choices={group.blocks} />
        ) : (
          <BlockCard key={group.block.id} knotId={knotId} block={group.block} />
        ),
      )}
      <AddBar
        onLine={() => story.addLine(parentId)}
        onChoice={() => story.addChoice(parentId)}
        onFact={() => story.addSetFact(parentId)}
        onCondition={() => story.addConditional(parentId)}
      />
    </div>
  );
}

function groupBlocks(blocks: Block[]): Array<{ kind: "choices"; blocks: ChoiceBlock[] } | { kind: "one"; block: Block }> {
  const groups: Array<{ kind: "choices"; blocks: ChoiceBlock[] } | { kind: "one"; block: Block }> = [];
  for (const block of blocks) {
    const previous = groups[groups.length - 1];
    if (block.type === "choice" && previous?.kind === "choices") previous.blocks.push(block);
    else if (block.type === "choice") groups.push({ kind: "choices", blocks: [block] });
    else groups.push({ kind: "one", block });
  }
  return groups;
}

function CardFrame({
  title,
  knotId,
  blockId,
  children,
  highlighted = false,
}: {
  title: string;
  knotId: string;
  blockId: string;
  children: ReactNode;
  highlighted?: boolean;
}) {
  const story = useStory();
  return (
    <section className={`rounded-lg border bg-panel p-3 ${highlighted ? "border-gold" : "border-line"}`}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs uppercase tracking-wider text-gold">{title}</h3>
        <div className="flex gap-1">
          <IconButton title="Move up" onClick={() => story.moveItem(knotId, blockId, -1)}>
            Up
          </IconButton>
          <IconButton title="Move down" onClick={() => story.moveItem(knotId, blockId, 1)}>
            Down
          </IconButton>
          <IconButton title="Delete" onClick={() => story.removeItem(knotId, blockId)}>
            Delete
          </IconButton>
        </div>
      </header>
      {children}
    </section>
  );
}

function BlockCard({ knotId, block }: { knotId: string; block: Block }) {
  if (block.type === "line") return <LineCard knotId={knotId} block={block} />;
  if (block.type === "setFact") return <SetFactCard knotId={knotId} block={block} />;
  if (block.type === "conditional") return <ConditionalCard knotId={knotId} block={block} />;
  return null;
}

function LineCard({ knotId, block }: { knotId: string; block: LineBlock }) {
  const story = useStory();
  const patch = (next: Partial<LineBlock>) => story.updateLine(knotId, { ...block, ...next });
  return (
    <CardFrame title={block.speaker.trim() ? "Line" : "Narration"} knotId={knotId} blockId={block.id}>
      <div className="grid gap-2">
        <label>
          <Label>Speaker</Label>
          <TextInput value={block.speaker} placeholder="Empty = narration" onChange={(speaker) => patch({ speaker })} />
        </label>
        <label>
          <Label>Text</Label>
          <Area value={block.text} placeholder="Line text" onChange={(text) => patch({ text })} />
        </label>
        <Commands knotId={knotId} block={block} />
      </div>
    </CardFrame>
  );
}

function Commands({ knotId, block }: { knotId: string; block: LineBlock }) {
  const story = useStory();
  const levels = story.story.levels.slice().sort((a, b) => a.number - b.number);
  const has = (type: Command["type"]) => block.commands.some((command) => command.type === type);
  const buttons: Array<[Command["type"], string]> = [
    ["sound", "Sound"],
    ["shake", "Shake"],
    ["go", "Go"],
    ["level", "Level"],
    ["quit", "Quit"],
  ];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {buttons.map(([type, label]) => (
          <button
            key={type}
            type="button"
            disabled={type !== "sound" && has(type)}
            onClick={() => story.addLineCommand(knotId, block, type)}
            className="rounded border border-line px-2 py-1 text-xs text-muted enabled:hover:border-gold enabled:hover:text-ink disabled:opacity-40"
          >
            # {label}
          </button>
        ))}
      </div>
      {block.commands.map((command) => (
        <div key={command.id} className="flex items-center gap-2">
          <span className="w-14 font-mono text-xs text-gold">#{command.type}</span>
          {command.type === "sound" && (
            <TextInput
              mono
              value={command.path}
              placeholder="audio/path"
              onChange={(path) => story.updateCommand(knotId, block, { ...command, path })}
            />
          )}
          {command.type === "go" && (
            <TextInput
              mono
              value={command.scene}
              placeholder="scene"
              onChange={(scene) => story.updateCommand(knotId, block, { ...command, scene })}
            />
          )}
          {command.type === "level" && (
            <select
              value={command.level}
              onChange={(event) => story.updateCommand(knotId, block, { ...command, level: event.target.value })}
              className="w-full rounded border border-line bg-paper px-2 py-1.5 font-mono text-sm text-ink"
            >
              <option value="">level</option>
              {levels.map((level) => (
                <option key={level.id} value={`level-${level.number}`}>
                  level-{level.number}
                </option>
              ))}
            </select>
          )}
          {(command.type === "shake" || command.type === "quit") && (
            <span className="text-xs text-muted">{command.type === "quit" ? "Closes dialogue" : "Camera shake"}</span>
          )}
          <IconButton title="Remove command" onClick={() => story.removeCommand(knotId, block, command.id)}>
            ×
          </IconButton>
        </div>
      ))}
    </div>
  );
}

function SetFactCard({ knotId, block }: { knotId: string; block: SetFactBlock }) {
  const story = useStory();
  const fact = factById(story.story, block.factId);
  return (
    <CardFrame title="Set fact" knotId={knotId} blockId={block.id}>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <Label>Fact</Label>
          <select
            value={block.factId}
            onChange={(event) => story.updateSetFact(knotId, block.id, { factId: event.target.value })}
            className="w-full rounded border border-line bg-paper px-2 py-1.5 font-mono text-sm text-ink"
          >
            <option value="">Select</option>
            {story.story.facts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Label>Value</Label>
          <FactValueInput
            fact={fact}
            value={block.value}
            onChange={(value) => story.updateSetFact(knotId, block.id, { value })}
          />
        </label>
      </div>
    </CardFrame>
  );
}

function ConditionalCard({ knotId, block }: { knotId: string; block: ConditionalBlock }) {
  const story = useStory();
  return (
    <CardFrame title="Condition" knotId={knotId} blockId={block.id}>
      <div className="space-y-3">
        {block.branches.map((branch) => {
          const fact = factById(story.story, branch.factId);
          return (
            <div key={branch.id} className="rounded border border-line p-2">
              {branch.kind === "else" ? (
                <p className="mb-2 font-mono text-xs text-gold">else</p>
              ) : (
                <div className="mb-2 flex items-start gap-2">
                <div className="grid min-w-0 flex-1 grid-cols-[1fr_88px_1fr] gap-2">
                  <select
                    value={branch.factId}
                    onChange={(event) =>
                      story.updateBranch(knotId, block.id, branch.id, { factId: event.target.value })
                    }
                    className="rounded border border-line bg-paper px-2 py-1.5 font-mono text-sm text-ink"
                  >
                    <option value="">fact</option>
                    {story.story.facts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={branch.op}
                    onChange={(event) =>
                      story.updateBranch(knotId, block.id, branch.id, { op: event.target.value as CompareOp })
                    }
                    className="rounded border border-line bg-paper px-2 py-1.5 font-mono text-sm text-ink"
                  >
                    {OPS.map((op) => (
                      <option key={op}>{op}</option>
                    ))}
                  </select>
                  <FactValueInput
                    fact={fact}
                    value={branch.value}
                    onChange={(value) => story.updateBranch(knotId, block.id, branch.id, { value })}
                  />
                </div>
                {block.branches.filter((item) => item.kind === "if").length > 1 && (
                  <button
                    type="button"
                    title="Delete branch"
                    aria-label="Delete branch"
                    onClick={() => story.removeBranch(knotId, block.id, branch.id)}
                    className="shrink-0 rounded px-1.5 py-1 text-xs text-muted hover:bg-paper hover:text-danger"
                  >
                    ×
                  </button>
                )}
                </div>
              )}
              <BlockList knotId={knotId} parentId={branch.id} blocks={branch.body} />
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => story.addCondition(knotId, block.id)}
          className="text-xs text-muted hover:text-ink"
        >
          + Branch
        </button>
      </div>
    </CardFrame>
  );
}

function ChoiceGroup({ knotId, choices }: { knotId: string; choices: ChoiceBlock[] }) {
  const [highlighted, setHighlighted] = useState(choices[0]?.id ?? "");
  const active = choices.some((choice) => choice.id === highlighted) ? highlighted : choices[0]?.id;
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wider text-muted">Choices</p>
      {choices.map((choice) => (
        <ChoiceCard
          key={choice.id}
          knotId={knotId}
          block={choice}
          highlighted={choice.id === active}
          onHighlight={() => setHighlighted(choice.id)}
        />
      ))}
    </div>
  );
}

function ChoiceCard({
  knotId,
  block,
  highlighted,
  onHighlight,
}: {
  knotId: string;
  block: ChoiceBlock;
  highlighted: boolean;
  onHighlight: () => void;
}) {
  const story = useStory();
  return (
    <div onFocus={onHighlight}>
      <CardFrame title="Choice" knotId={knotId} blockId={block.id} highlighted={highlighted}>
        <div className="grid gap-2" onClick={onHighlight}>
          <label>
            <Label>Display text</Label>
            <TextInput
              value={block.displayText}
              placeholder="Shown in the choice list"
              onChange={(displayText) => story.updateChoice(knotId, block.id, { displayText })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <Label>Speaker</Label>
              <TextInput
                value={block.speaker}
                placeholder="Empty = narration"
                onChange={(speaker) => story.updateChoice(knotId, block.id, { speaker })}
              />
            </label>
            <label>
              <Label>Event</Label>
              <TextInput
                mono
                value={block.event}
                placeholder="surprised"
                onChange={(event) => story.updateChoice(knotId, block.id, { event })}
              />
            </label>
          </div>
          <label>
            <Label>Spoken text</Label>
            <Area
              value={block.spokenText}
              placeholder="Said after this choice"
              onChange={(spokenText) => story.updateChoice(knotId, block.id, { spokenText })}
            />
          </label>
          {highlighted && (
            <div className="border-t border-line pt-3">
              <Label>Continuation</Label>
              <BlockList knotId={knotId} parentId={block.id} blocks={block.continuation} />
            </div>
          )}
        </div>
      </CardFrame>
    </div>
  );
}
