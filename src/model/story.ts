import { createId } from "./ids.ts";
import type {
  Block,
  ChoiceBlock,
  Command,
  ConditionalBlock,
  Fact,
  FactType,
  Knot,
  Level,
  LineBlock,
  SetFactBlock,
  Story,
} from "./types.ts";

export function knotName(level: Level, knot: Knot): string {
  const suffix = knot.suffix.trim() || "untitled";
  return `level${level.number}_${suffix}`;
}

export function levelSlug(level: Level): string {
  return `level-${level.number}`;
}

export function isIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function findLevel(story: Story, levelId: string): Level | undefined {
  return story.levels.find((level) => level.id === levelId);
}

export function findKnot(story: Story, knotId: string): { level: Level; knot: Knot } | undefined {
  for (const level of story.levels) {
    const knot = level.knots.find((item) => item.id === knotId);
    if (knot) return { level, knot };
  }
  return undefined;
}

export function duplicateKnotNames(story: Story): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const level of story.levels) {
    for (const knot of level.knots) {
      const name = knotName(level, knot);
      if (seen.has(name)) dupes.add(name);
      seen.add(name);
    }
  }
  return dupes;
}

export function factById(story: Story, factId: string): Fact | undefined {
  return story.facts.find((fact) => fact.id === factId);
}

function mapBlockTree(blocks: Block[], id: string, fn: (block: Block) => Block | null): Block[] {
  const next: Block[] = [];
  for (const block of blocks) {
    if (block.id === id) {
      const replaced = fn(block);
      if (replaced) next.push(replaced);
      continue;
    }
    if (block.type === "choice") {
      next.push({ ...block, continuation: mapBlockTree(block.continuation, id, fn) });
      continue;
    }
    if (block.type === "conditional") {
      next.push({
        ...block,
        branches: block.branches.map((branch) => ({
          ...branch,
          body: mapBlockTree(branch.body, id, fn),
        })),
      });
      continue;
    }
    next.push(block);
  }
  return next;
}

function insertInto(blocks: Block[], parentId: string, create: (blocks: Block[]) => Block[]): Block[] | null {
  let changed = false;
  const next = blocks.map((block) => {
    if (changed) return block;
    if (block.type === "choice") {
      if (block.id === parentId) {
        changed = true;
        return { ...block, continuation: create(block.continuation) };
      }
      const continuation = insertInto(block.continuation, parentId, create);
      if (continuation) {
        changed = true;
        return { ...block, continuation };
      }
    }
    if (block.type === "conditional") {
      if (block.branches.some((branch) => branch.id === parentId)) {
        changed = true;
        return {
          ...block,
          branches: block.branches.map((branch) =>
            branch.id === parentId ? { ...branch, body: create(branch.body) } : branch,
          ),
        };
      }
      let nestedHit = false;
      const branches = block.branches.map((branch) => {
        const body = insertInto(branch.body, parentId, create);
        if (!body) return branch;
        nestedHit = true;
        return { ...branch, body };
      });
      if (nestedHit) {
        changed = true;
        return { ...block, branches };
      }
    }
    return block;
  });
  return changed ? next : null;
}

function updateKnotBlocks(story: Story, knotId: string, blocks: Block[]): Story {
  return {
    ...story,
    levels: story.levels.map((level) => ({
      ...level,
      knots: level.knots.map((knot) => (knot.id === knotId ? { ...knot, blocks } : knot)),
    })),
  };
}

function editKnot(story: Story, knotId: string, fn: (blocks: Block[]) => Block[]): Story {
  const found = findKnot(story, knotId);
  if (!found) return story;
  return updateKnotBlocks(story, knotId, fn(found.knot.blocks));
}

export function insertBlock(story: Story, parentId: string, block: Block): Story {
  const asKnot = findKnot(story, parentId);
  if (asKnot) return editKnot(story, parentId, (blocks) => [...blocks, block]);

  return {
    ...story,
    levels: story.levels.map((level) => ({
      ...level,
      knots: level.knots.map((knot) => {
        const blocks = insertInto(knot.blocks, parentId, (items) => [...items, block]);
        return blocks ? { ...knot, blocks } : knot;
      }),
    })),
  };
}

export function removeBlock(story: Story, knotId: string, blockId: string): Story {
  return editKnot(story, knotId, (blocks) => mapBlockTree(blocks, blockId, () => null));
}

export function replaceBlock(story: Story, knotId: string, blockId: string, block: Block): Story {
  return editKnot(story, knotId, (blocks) => mapBlockTree(blocks, blockId, () => block));
}

export function moveBlock(story: Story, knotId: string, blockId: string, direction: -1 | 1): Story {
  const move = (blocks: Block[]): Block[] => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index !== -1) {
      const target = index + direction;
      if (target < 0 || target >= blocks.length) return blocks;
      const copy = blocks.slice();
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    }
    return blocks.map((block) => {
      if (block.type === "choice") return { ...block, continuation: move(block.continuation) };
      if (block.type === "conditional") {
        return {
          ...block,
          branches: block.branches.map((branch) => ({ ...branch, body: move(branch.body) })),
        };
      }
      return block;
    });
  };
  return editKnot(story, knotId, move);
}

export function createLine(): LineBlock {
  return { id: createId(), type: "line", speaker: "", text: "", commands: [] };
}

export function createChoice(): ChoiceBlock {
  return {
    id: createId(),
    type: "choice",
    displayText: "",
    speaker: "",
    spokenText: "",
    event: "",
    continuation: [],
  };
}

export function createSetFact(factId = ""): SetFactBlock {
  return { id: createId(), type: "setFact", factId, value: "" };
}

export function createConditional(factId = ""): ConditionalBlock {
  return {
    id: createId(),
    type: "conditional",
    branches: [
      { id: createId(), kind: "if", factId, op: "==", value: "", body: [] },
      { id: createId(), kind: "else", factId: "", op: "==", value: "", body: [] },
    ],
  };
}

export function createCommand(type: Command["type"]): Command {
  const id = createId();
  switch (type) {
    case "sound":
      return { id, type, path: "" };
    case "shake":
      return { id, type };
    case "go":
      return { id, type, scene: "" };
    case "level":
      return { id, type, level: "" };
    case "quit":
      return { id, type };
  }
}

export function emptyStory(): Story {
  const levelId = createId();
  const knotId = createId();
  return {
    facts: [],
    levels: [{ id: levelId, number: 1, knots: [{ id: knotId, suffix: "start", blocks: [] }] }],
  };
}

export function exampleStory(): Story {
  const reply: Fact = { id: "fact-reply", name: "reply", type: "string", initial: "" };
  const surprised: ChoiceBlock = {
    id: "choice-surprised",
    type: "choice",
    displayText: "I'm surprised she actually kept the paper.",
    speaker: "Mara",
    spokenText: "I'm surprised she actually kept the paper.",
    event: "surprised",
    continuation: [
      { id: "set-surprised", type: "setFact", factId: reply.id, value: "surprised" },
      {
        id: "line-hid",
        type: "line",
        speaker: "Unknown",
        text: "Then you already know why she hid it.",
        commands: [],
      },
    ],
  };
  const cover: ChoiceBlock = {
    id: "choice-cover",
    type: "choice",
    displayText: "They moved fast to cover this one.",
    speaker: "Mara",
    spokenText: "They moved fast to cover this one.",
    event: "cover_up",
    continuation: [
      { id: "set-cover", type: "setFact", factId: reply.id, value: "cover" },
      {
        id: "line-faster",
        type: "line",
        speaker: "Unknown",
        text: "Faster than the last time.",
        commands: [],
      },
    ],
  };
  const conditional: ConditionalBlock = {
    id: "cond-reply",
    type: "conditional",
    branches: [
      {
        id: "branch-surprised",
        kind: "if",
        factId: reply.id,
        op: "==",
        value: "surprised",
        body: [
          {
            id: "line-aloud",
            type: "line",
            speaker: "Mara",
            text: "I should not have said that out loud.",
            commands: [],
          },
        ],
      },
      {
        id: "branch-else",
        kind: "else",
        factId: "",
        op: "==",
        value: "",
        body: [
          {
            id: "line-hangup",
            type: "line",
            speaker: "Mara",
            text: "I need to hang up.",
            commands: [],
          },
        ],
      },
    ],
  };
  return {
    facts: [reply],
    levels: [
      {
        id: "level-1",
        number: 1,
        knots: [
          {
            id: "knot-paper",
            suffix: "paper",
            blocks: [
              {
                id: "line-kept",
                type: "line",
                speaker: "Unknown",
                text: "She kept the paper.",
                commands: [],
              },
              surprised,
              cover,
              conditional,
            ],
          },
        ],
      },
    ],
  };
}

export function nextLevelNumber(story: Story): number {
  return story.levels.reduce((max, level) => Math.max(max, level.number), 0) + 1;
}

export function defaultInitial(type: FactType): string {
  if (type === "number") return "0";
  if (type === "boolean") return "false";
  return "";
}
