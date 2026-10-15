import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createId } from "../model/ids.ts";
import {
  createChoice,
  createCommand,
  createConditional,
  createLine,
  createSetFact,
  defaultInitial,
  showcaseStory,
  findKnot,
  insertBlock,
  moveBlock,
  nextLevelNumber,
  removeBlock,
  replaceBlock,
} from "../model/story.ts";
import type { Block, FactType, LineBlock, Story } from "../model/types.ts";
import { StoryContext, type StoryApi } from "./story-context.ts";

const STORAGE_KEY = "cacophobia-dialogue-builder";

function loadStory(): Story {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return showcaseStory();
    const parsed = JSON.parse(raw) as Story;
    if (!parsed.levels?.length) return showcaseStory();
    return parsed;
  } catch {
    return showcaseStory();
  }
}

function firstKnot(story: Story): string {
  return story.levels[0]?.knots[0]?.id ?? "";
}

export function StoryProvider({ children }: { children: ReactNode }) {
  const [story, setStory] = useState<Story>(loadStory);
  const [knotId, setKnotId] = useState(() => firstKnot(loadStory()));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(story));
  }, [story]);

  const activeKnotId = findKnot(story, knotId) ? knotId : firstKnot(story);

  const api = useMemo<StoryApi>(() => {
    const patchLine = (id: string, block: LineBlock) => setStory((current) => replaceBlock(current, id, block.id, block));
    return {
      story,
      knotId: activeKnotId,
      selectKnot: setKnotId,
      addLevel: () =>
        setStory((current) => ({
          ...current,
          levels: [
            ...current.levels,
            { id: createId(), number: nextLevelNumber(current), knots: [{ id: createId(), suffix: "start", blocks: [] }] },
          ],
        })),
      setLevelNumber: (levelId, number) =>
        setStory((current) => {
          if (!Number.isInteger(number) || number < 1) return current;
          if (current.levels.some((level) => level.id !== levelId && level.number === number)) return current;
          return {
            ...current,
            levels: current.levels.map((level) => (level.id === levelId ? { ...level, number } : level)),
          };
        }),
      removeLevel: (levelId) =>
        setStory((current) => ({ ...current, levels: current.levels.filter((level) => level.id !== levelId) })),
      addKnot: (levelId) =>
        setStory((current) => ({
          ...current,
          levels: current.levels.map((level) =>
            level.id === levelId
              ? { ...level, knots: [...level.knots, { id: createId(), suffix: "knot", blocks: [] }] }
              : level,
          ),
        })),
      setKnotSuffix: (id, suffix) =>
        setStory((current) => ({
          ...current,
          levels: current.levels.map((level) => ({
            ...level,
            knots: level.knots.map((knot) =>
              knot.id === id ? { ...knot, suffix: suffix.replace(/[^A-Za-z0-9_]/g, "") } : knot,
            ),
          })),
        })),
      removeKnot: (id) =>
        setStory((current) => ({
          ...current,
          levels: current.levels.map((level) => ({
            ...level,
            knots: level.knots.filter((knot) => knot.id !== id),
          })),
        })),
      addFact: () =>
        setStory((current) => ({
          ...current,
          facts: [...current.facts, { id: createId(), name: "fact", type: "string", initial: "" }],
        })),
      updateFact: (factId, patch) =>
        setStory((current) => ({
          ...current,
          facts: current.facts.map((fact) => {
            if (fact.id !== factId) return fact;
            const type = (patch.type ?? fact.type) as FactType;
            const next = { ...fact, ...patch, type };
            if (patch.type && patch.type !== fact.type) next.initial = defaultInitial(patch.type);
            return next;
          }),
        })),
      removeFact: (factId) =>
        setStory((current) => ({ ...current, facts: current.facts.filter((fact) => fact.id !== factId) })),
      addLine: (parentId) => setStory((current) => insertBlock(current, parentId, createLine())),
      addChoice: (parentId) => setStory((current) => insertBlock(current, parentId, createChoice())),
      addSetFact: (parentId) =>
        setStory((current) => insertBlock(current, parentId, createSetFact(current.facts[0]?.id ?? ""))),
      addConditional: (parentId) =>
        setStory((current) => insertBlock(current, parentId, createConditional(current.facts[0]?.id ?? ""))),
      removeItem: (id, blockId) => setStory((current) => removeBlock(current, id, blockId)),
      moveItem: (id, blockId, direction) => setStory((current) => moveBlock(current, id, blockId, direction)),
      updateLine: patchLine,
      updateChoice: (id, blockId, patch) =>
        setStory((current) => {
          const found = findKnot(current, id);
          if (!found) return current;
          const block = findBlock(found.knot.blocks, blockId);
          if (!block || block.type !== "choice") return current;
          return replaceBlock(current, id, blockId, { ...block, ...patch });
        }),
      updateSetFact: (id, blockId, patch) =>
        setStory((current) => {
          const found = findKnot(current, id);
          if (!found) return current;
          const block = findBlock(found.knot.blocks, blockId);
          if (!block || block.type !== "setFact") return current;
          return replaceBlock(current, id, blockId, { ...block, ...patch });
        }),
      updateBranch: (id, blockId, branchId, patch) =>
        setStory((current) => {
          const found = findKnot(current, id);
          if (!found) return current;
          const block = findBlock(found.knot.blocks, blockId);
          if (!block || block.type !== "conditional") return current;
          return replaceBlock(current, id, blockId, {
            ...block,
            branches: block.branches.map((branch) => (branch.id === branchId ? { ...branch, ...patch } : branch)),
          });
        }),
      addCondition: (id, blockId) =>
        setStory((current) => {
          const found = findKnot(current, id);
          if (!found) return current;
          const block = findBlock(found.knot.blocks, blockId);
          if (!block || block.type !== "conditional") return current;
          const branch = {
            id: createId(),
            kind: "if" as const,
            factId: current.facts[0]?.id ?? "",
            op: "==" as const,
            value: "",
            body: [],
          };
          const elseIndex = block.branches.findIndex((item) => item.kind === "else");
          const branches = block.branches.slice();
          branches.splice(elseIndex === -1 ? branches.length : elseIndex, 0, branch);
          return replaceBlock(current, id, blockId, { ...block, branches });
        }),
      removeBranch: (id, blockId, branchId) =>
        setStory((current) => {
          const found = findKnot(current, id);
          if (!found) return current;
          const block = findBlock(found.knot.blocks, blockId);
          if (!block || block.type !== "conditional") return current;
          const target = block.branches.find((branch) => branch.id === branchId);
          const ifCount = block.branches.filter((branch) => branch.kind === "if").length;
          if (!target || target.kind !== "if" || ifCount < 2) return current;
          return replaceBlock(current, id, blockId, {
            ...block,
            branches: block.branches.filter((branch) => branch.id !== branchId),
          });
        }),
      addLineCommand: (id, block, type) => {
        if (block.commands.some((command) => command.type === type && type !== "sound")) return;
        patchLine(id, { ...block, commands: [...block.commands, createCommand(type)] });
      },
      updateCommand: (id, block, command) =>
        patchLine(id, {
          ...block,
          commands: block.commands.map((item) => (item.id === command.id ? command : item)),
        }),
      removeCommand: (id, block, commandId) =>
        patchLine(id, { ...block, commands: block.commands.filter((command) => command.id !== commandId) }),
      loadExample: () => {
        const sample = showcaseStory();
        setStory(sample);
        setKnotId(firstKnot(sample));
      },
    };
  }, [story, activeKnotId]);

  return <StoryContext.Provider value={api}>{children}</StoryContext.Provider>;
}

function findBlock(blocks: Block[], id: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === "choice") {
      const nested = findBlock(block.continuation, id);
      if (nested) return nested;
    }
    if (block.type === "conditional") {
      for (const branch of block.branches) {
        const nested = findBlock(branch.body, id);
        if (nested) return nested;
      }
    }
  }
  return undefined;
}

