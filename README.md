# Cacophobia Dialogue Builder

A visual editor for one continuous Ink story. You never type Ink syntax. The editor writes `.ink` files. Game text is English. There are no character portraits or voice fields.

```bash
npm install
npm run dev
npm test
```

Open the URL Vite prints (usually `http://127.0.0.1:5173/`). The story is saved in this browser automatically. **Load sample** replaces it with the built-in `level1_paper` example.

## Screen

- **Left:** global facts, then levels and their knots.
- **Center:** the open knot. The large gold name is the scene link.
- **Right:** live Ink for the current level file.
- **Top:** download one file, download every file, or reload the sample.

## Facts

Facts are variables that last for the whole game, across every level.

1. **+ Fact**
2. Name it with letters, numbers, and underscores. It must start with a letter or `_`.
3. Pick a type: `str`, `num`, or `bool`.
4. Set the starting value. Strings start as `""`, numbers as `0`, booleans as `false`.
5. **×** deletes the fact.

Those become `VAR` lines in `story.ink`:

```ink
VAR reply = ""
```

Changing the type resets the starting value. A name that is not a valid identifier is kept in the editor and left out of the export.

## Levels

**+ Level** adds the next number (`level-2`, then `level-3`). Each level is its own file, `levels/level-N.ink`. `story.ink` only lists globals and `INCLUDE` lines, in level-number order.

The number field renames that level. Two levels cannot share a number. **×** on the level header deletes the level and every knot inside it.

`# level` commands offer these same `level-N` names.

## Knots

**+ Knot** adds a knot on that level. The suffix box under the title is the only part you edit. The full name is built for you:

```text
level{number}_{suffix}
```

`level` `1` and suffix `paper` is `level1_paper`. That string is the link between a game scene and this dialogue. It is shown on the knot button and as the page title. If two knots produce the same name, both buttons get a red outline and the title turns red. Rename one before you export.

**×** on a knot row deletes that knot only. The level stays. If you delete the knot you had open, the editor opens another one.

Inside a knot, every block has **Up**, **Down**, and **Delete**.

## Lines

**+ Line** adds a spoken line or narration.

- **Speaker** is free text. There is no character list. Leave it empty for narration.
- **Text** is the sentence, including its punctuation.

Export:

```ink
Unknown: She kept the paper.
She kept the paper.
```

The second form is narration.

Command buttons sit on the line. They are not a text field.

| Button | Writes | Extra |
| --- | --- | --- |
| **# Sound** | `# sound: path` | Type the audio path. You can add more than one. |
| **# Shake** | `# shake` | Once per line. |
| **# Go** | `# go: scene` | Type the scene name. Closes the dialogue. |
| **# Level** | `# level: level-1` | Pick an existing level. Closes the dialogue. |
| **# Quit** | `# quit` | Closes the dialogue. |

**×** on a command removes it. **# Go**, **# Level**, and **# Quit** can be added once each. After any of those, the exporter adds `-> END` so the line ends the conversation. The game performs the effect. This editor only stores the tag.

## Choices

**+ Choice** adds a choice. Choices that sit next to each other are one group: the player sees all of them, and one card is highlighted in gold. Click a card to edit what happens after that choice only.

- **Display text** is the label in the choice list. It is exported inside `[]`. A `]` in the label is written as `)`.
- **Speaker** and **Spoken text** are said after the player picks it. Empty speaker means the spoken line is narration.
- **Event** is an optional name such as `surprised`. The game decides what it does.

```ink
* [I'm surprised she actually kept the paper.] Mara: I'm surprised she actually kept the paper. # event: surprised
```

**Continuation** is the lines, fact changes, conditions, and further choices that belong only to this choice. They are indented under it in the Ink file. The other choices do not run them.

## Set fact

**+ Set fact** writes a fact during the dialogue. Pick a fact and a value. The value follows the fact's type.

```ink
~ reply = "surprised"
```

Create the fact on the left first. If the fact is missing, the export uses `undefined`.

## Conditions

**+ Condition** shows different blocks based on a fact.

- Each branch is a fact, a comparison (`==`, `!=`, `>`, `<`, `>=`, `<=`), and a value.
- **else** is the fallback. It is omitted from the file when it has no blocks.
- **+ Branch** adds another comparison before `else`.
- The blocks under a branch are written only for that branch.

After a choice group, the condition is a gather. It runs once, after whichever choice was taken:

```ink
- { reply == "surprised":
    Mara: I should not have said that out loud.
  - else:
    Mara: I need to hang up.
  }
```

A condition that is not after choices uses the same shape without the leading `-`.

## Export

The right-hand panel is the current level file, updated as you edit.

- A path button downloads that one file. The browser saves the file name (`story.ink`, `level-1.ink`). Put level files in a `levels/` folder next to `story.ink`.
- **Export .ink** downloads every file.

`story.ink`:

```ink
VAR reply = ""
INCLUDE levels/level-1.ink
```

Each knot ends with `-> END` unless a **# Go**, **# Level**, or **# Quit** on that path already ended it.

`npm test` checks the sample knot against the reference export.
