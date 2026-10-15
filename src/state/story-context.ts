import { createContext } from "react";
import type { Block, Command, Fact, LineBlock, Story } from "../model/types.ts";

export interface StoryApi {
  story: Story;
  knotId: string;
  selectKnot: (knotId: string) => void;
  addLevel: () => void;
  setLevelNumber: (levelId: string, number: number) => void;
  removeLevel: (levelId: string) => void;
  addKnot: (levelId: string) => void;
  setKnotSuffix: (knotId: string, suffix: string) => void;
  removeKnot: (knotId: string) => void;
  addFact: () => void;
  updateFact: (factId: string, patch: Partial<Pick<Fact, "name" | "type" | "initial">>) => void;
  removeFact: (factId: string) => void;
  addLine: (parentId: string) => void;
  addChoice: (parentId: string) => void;
  addSetFact: (parentId: string) => void;
  addConditional: (parentId: string) => void;
  removeItem: (knotId: string, blockId: string) => void;
  moveItem: (knotId: string, blockId: string, direction: -1 | 1) => void;
  updateLine: (knotId: string, block: LineBlock) => void;
  updateChoice: (
    knotId: string,
    blockId: string,
    patch: Partial<Pick<Block & { type: "choice" }, "displayText" | "speaker" | "spokenText" | "event">>,
  ) => void;
  updateSetFact: (knotId: string, blockId: string, patch: { factId?: string; value?: string }) => void;
  updateBranch: (
    knotId: string,
    blockId: string,
    branchId: string,
    patch: { factId?: string; op?: "==" | "!=" | ">" | "<" | ">=" | "<="; value?: string },
  ) => void;
  addCondition: (knotId: string, blockId: string) => void;
  removeBranch: (knotId: string, blockId: string, branchId: string) => void;
  addLineCommand: (knotId: string, block: LineBlock, type: Command["type"]) => void;
  updateCommand: (knotId: string, block: LineBlock, command: Command) => void;
  removeCommand: (knotId: string, block: LineBlock, commandId: string) => void;
  loadExample: () => void;
}

export const StoryContext = createContext<StoryApi | null>(null);
