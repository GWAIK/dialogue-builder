import { factById, isIdentifier, knotName, levelSlug } from "./story.ts";
import type {
  Block,
  ChoiceBlock,
  Command,
  ConditionalBlock,
  ConditionBranch,
  Fact,
  FactType,
  InkFile,
  Level,
  LineBlock,
  SetFactBlock,
  Story,
} from "./types.ts";

function pad(indent: number): string {
  return " ".repeat(indent);
}

export function inkLiteral(type: FactType, raw: string): string {
  if (type === "number") {
    const value = Number(raw);
    return Number.isFinite(value) ? String(value) : "0";
  }
  if (type === "boolean") return raw === "true" ? "true" : "false";
  return `"${raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function formatCommand(command: Command): string {
  switch (command.type) {
    case "sound":
      return `# sound: ${command.path}`;
    case "shake":
      return "# shake";
    case "go":
      return `# go: ${command.scene}`;
    case "level":
      return `# level: ${command.level}`;
    case "quit":
      return "# quit";
  }
}

function closesDialogue(commands: Command[]): boolean {
  return commands.some((command) => command.type === "go" || command.type === "level" || command.type === "quit");
}

function formatSpeech(speaker: string, text: string): string {
  const name = speaker.trim();
  if (!name && !text) return "";
  if (!name) return text;
  return `${name}: ${text}`;
}

function conditionText(story: Story, branch: ConditionBranch): string {
  const fact = factById(story, branch.factId);
  const name = fact && isIdentifier(fact.name) ? fact.name : "undefined";
  const type = fact?.type ?? "string";
  return `${name} ${branch.op} ${inkLiteral(type, branch.value)}`;
}

function exportSequence(blocks: Block[], indent: number, story: Story): string[] {
  const lines: string[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (block.type === "choice") {
      while (index < blocks.length && blocks[index].type === "choice") {
        lines.push(...exportChoice(blocks[index] as ChoiceBlock, indent, story));
        index += 1;
      }
      while (index < blocks.length && blocks[index].type !== "choice") {
        lines.push(...exportBlock(blocks[index], indent, story, true));
        index += 1;
      }
      continue;
    }
    lines.push(...exportBlock(block, indent, story, false));
    index += 1;
  }
  return lines;
}

function exportChoice(block: ChoiceBlock, indent: number, story: Story): string[] {
  const speech = formatSpeech(block.speaker, block.spokenText);
  let head = `${pad(indent)}* [${block.displayText.replaceAll("]", ")")}]`;
  if (speech) head += ` ${speech}`;
  if (block.event.trim()) head += ` # event: ${block.event.trim()}`;
  return [head, ...exportSequence(block.continuation, indent + 4, story)];
}

function exportBlock(block: Block, indent: number, story: Story, gather: boolean): string[] {
  switch (block.type) {
    case "line":
      return exportLine(block, indent, gather);
    case "setFact":
      return exportSetFact(block, indent, story, gather);
    case "conditional":
      return exportConditional(block, indent, story, gather);
    case "choice":
      return exportChoice(block, indent, story);
  }
}

function exportLine(block: LineBlock, indent: number, gather: boolean): string[] {
  const speech = formatSpeech(block.speaker, block.text);
  const tags = block.commands.map(formatCommand).join(" ");
  let text = speech;
  if (tags) text = text ? `${text} ${tags}` : tags;
  const prefix = gather ? "- " : "";
  const lines = [`${pad(indent)}${prefix}${text}`];
  if (closesDialogue(block.commands)) lines.push(`${pad(indent)}-> END`);
  return lines;
}

function exportSetFact(block: SetFactBlock, indent: number, story: Story, gather: boolean): string[] {
  const fact = factById(story, block.factId);
  const name = fact && isIdentifier(fact.name) ? fact.name : "undefined";
  const type = fact?.type ?? "string";
  const prefix = gather ? "- " : "";
  return [`${pad(indent)}${prefix}~ ${name} = ${inkLiteral(type, block.value)}`];
}

function exportConditional(block: ConditionalBlock, indent: number, story: Story, gather: boolean): string[] {
  const ifs = block.branches.filter((branch) => branch.kind === "if");
  const elses = block.branches.filter((branch) => branch.kind === "else" && branch.body.length > 0);
  if (ifs.length === 0) return [];
  const prefix = gather ? "- " : "";
  const lines = [`${pad(indent)}${prefix}{ ${conditionText(story, ifs[0])}:`];
  lines.push(...exportSequence(ifs[0].body, indent + 4, story));
  const alts = [...ifs.slice(1), ...elses];
  for (const branch of alts) {
    const label = branch.kind === "else" ? "else" : conditionText(story, branch);
    lines.push(`${pad(indent + 2)}- ${label}:`);
    lines.push(...exportSequence(branch.body, indent + 4, story));
  }
  lines.push(`${pad(alts.length > 0 ? indent + 2 : indent)}}`);
  return lines;
}

function exportLevel(level: Level, story: Story): string {
  return level.knots.map((knot) => exportKnot(level, knot, story)).join("\n\n");
}

function exportKnot(level: Level, knot: Level["knots"][number], story: Story): string {
  const lines = [`=== ${knotName(level, knot)} ===`, ...exportSequence(knot.blocks, 0, story)];
  if (lines[lines.length - 1] !== "-> END") lines.push("-> END");
  return lines.join("\n");
}

function exportVars(facts: Fact[]): string[] {
  return facts
    .filter((fact) => isIdentifier(fact.name))
    .map((fact) => `VAR ${fact.name} = ${inkLiteral(fact.type, fact.initial)}`);
}

export function exportStory(story: Story): InkFile[] {
  const levels = story.levels.slice().sort((a, b) => a.number - b.number);
  const storyLines = [
    ...exportVars(story.facts),
    ...levels.map((level) => `INCLUDE levels/${levelSlug(level)}.ink`),
  ];
  const files: InkFile[] = [{ path: "story.ink", contents: `${storyLines.join("\n")}\n` }];
  for (const level of levels) {
    const body = exportLevel(level, story);
    files.push({
      path: `levels/${levelSlug(level)}.ink`,
      contents: body ? `${body}\n` : "",
    });
  }
  return files;
}
