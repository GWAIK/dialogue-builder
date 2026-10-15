export type FactType = "string" | "number" | "boolean";

export type CompareOp = "==" | "!=" | ">" | "<" | ">=" | "<=";

export interface Fact {
  id: string;
  name: string;
  type: FactType;
  initial: string;
}

export type Command =
  | { id: string; type: "sound"; path: string }
  | { id: string; type: "shake" }
  | { id: string; type: "go"; scene: string }
  | { id: string; type: "level"; level: string }
  | { id: string; type: "quit" };

export interface LineBlock {
  id: string;
  type: "line";
  speaker: string;
  text: string;
  commands: Command[];
}

export interface SetFactBlock {
  id: string;
  type: "setFact";
  factId: string;
  value: string;
}

export interface ConditionBranch {
  id: string;
  kind: "if" | "else";
  factId: string;
  op: CompareOp;
  value: string;
  body: Block[];
}

export interface ConditionalBlock {
  id: string;
  type: "conditional";
  branches: ConditionBranch[];
}

export interface ChoiceBlock {
  id: string;
  type: "choice";
  displayText: string;
  speaker: string;
  spokenText: string;
  event: string;
  continuation: Block[];
}

export type Block = LineBlock | SetFactBlock | ConditionalBlock | ChoiceBlock;

export interface Knot {
  id: string;
  suffix: string;
  blocks: Block[];
}

export interface Level {
  id: string;
  number: number;
  knots: Knot[];
}

export interface Story {
  facts: Fact[];
  levels: Level[];
}

export interface InkFile {
  path: string;
  contents: string;
}
