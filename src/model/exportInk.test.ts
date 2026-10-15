import { describe, expect, it } from "vitest";
import { exportStory } from "./exportInk.ts";
import { createCommand, exampleStory } from "./story.ts";
import type { LineBlock, Story } from "./types.ts";

const PAPER = `=== level1_paper ===
Unknown: She kept the paper.
* [I'm surprised she actually kept the paper.] Mara: I'm surprised she actually kept the paper. # event: surprised
    ~ reply = "surprised"
    Unknown: Then you already know why she hid it.
* [They moved fast to cover this one.] Mara: They moved fast to cover this one. # event: cover_up
    ~ reply = "cover"
    Unknown: Faster than the last time.
- { reply == "surprised":
    Mara: I should not have said that out loud.
  - else:
    Mara: I need to hang up.
  }
-> END
`;

describe("exportStory", () => {
  it("matches the paper knot reference", () => {
    const files = exportStory(exampleStory());
    expect(files.map((file) => file.path)).toEqual(["story.ink", "levels/level-1.ink"]);
    expect(files[0].contents).toBe('VAR reply = ""\nINCLUDE levels/level-1.ink\n');
    expect(files[1].contents).toBe(PAPER);
  });

  it("closes the dialogue after go, level, and quit", () => {
    const line: LineBlock = {
      id: "line",
      type: "line",
      speaker: "",
      text: "The line dies.",
      commands: [createCommand("shake"), { id: "go", type: "go", scene: "hallway" }],
    };
    line.commands[0] = { id: "shake", type: "shake" };
    const story: Story = {
      facts: [],
      levels: [{ id: "l", number: 2, knots: [{ id: "k", suffix: "hall", blocks: [line] }] }],
    };
    const level = exportStory(story).find((file) => file.path === "levels/level-2.ink");
    expect(level?.contents).toBe(
      ["=== level2_hall ===", "The line dies. # shake # go: hallway", "-> END", ""].join("\n"),
    );
  });
});
