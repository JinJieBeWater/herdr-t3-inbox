# T3 Inbox

A sidebar for Herdr App that keeps only the agents still asking for your attention in sight, as cards, newest news first. Agents you are done with are settled by hand and sink into a quiet, folded list at the bottom; any new work brings them back. Modeled on the Settle sidebar of [T3 Code](https://github.com/pingdotgg/t3code).

![T3 Inbox](preview.png)

## Where it's specified

`mods/t3-inbox` is the [Herdr T3 layout](https://github.com/JinJieBeWater/herdr-t3)'s Inbox sidebar, copied here by its `scripts/sync.sh`. Its look and behaviour (cards, shelves, Settle, Snooze, drag, motion, hover labels and details, keyboard) are herdr-t3's [Inbox spec](https://github.com/JinJieBeWater/herdr-t3/blob/main/docs/internals/specs/inbox.md) and [visual tokens](https://github.com/JinJieBeWater/herdr-t3/blob/main/docs/internals/t3-tokens.md); change them there. What follows is only how it differs on its own.

## On its own

- `mod.json` docks it on the left, 300 wide (`"place": "left"`), where Herdr T3's places it in its sidebar stack (`"none"`). `keys.json` adds the Settle key in `global`: `"cmd-shift-s": "t3-inbox.settle"`.
- Props it takes when a layout gives them, else: `newMenu` (New tab in… opens that mod; else the shipped `new-menu`), `menu` (a card's right-click menu; else none, as the shipped `menu` has no agent's) and `home` (settling the agent in view goes back to Home; else, as T3, to the next card).
- Settled and snoozed state are terminal labels on the agent itself (`hc label <address> settled=<ms>:<turn>`, `snoozed=<wake ms>`): they end with the terminal, and every mod and window can read them. Shelf folding, the filter and the last seen states are in the mod's `localStorage`; the rows as drawn are shared as `t3-inbox.rows` for a layout's keys to walk them.
- What Herdr T3's tab bar adds, its own key's returns (`t3-tabs.unsettled`) and the settled agent's hidden done dot, isn't there alone.
- Programs: `hc label`; for space marks, on the space's machine, `git rev-parse --show-toplevel`, `sh -c` file tests and `base64`.
- Inbox uses `git rev-parse` and `git worktree list --porcelain -z` on the pane's machine to identify linked checkouts.

## Watch out

- A label written with `hc label` takes about 0.65s to come back in `terminals()`. Keep the new value as pending so the row moves at once; drop it on failure and show an error `notify`. On a slow remote, writes to one label can land in any order: while more than one is out, keep the last intent and, once all have answered, write it again if the label says otherwise.
- `terminals()[].status_ms` is only as of the app's start; it is a fallback until the mod sees a change itself.
- Treat `done` and `idle` as one when tracking change times: looking at a done agent turns it idle, and looking is not news.
- Sub-agents without a pane aren't in `agents()`; walk `terminals()` by `parent` for them.
- A card moves away without a pointer-leave event: clear the hover state on Settle / Un-settle.
- A hover style reaches text but not an `svg`; keep hover as state so icon and label brighten together.
- Herdr eases only later changes to an element: a row that moves gets a new id, is drawn once where it was, then let go.
- Herdr can't scroll a plain list from code, so unlike T3 the row in view isn't scrolled into view.
- `.tooltip()` takes only a string in the shell's own style, hence a `HoverCard`; it doesn't flip, so what sits at the window's bottom must open upward itself. The details card is solid: T3's glass blurs what's behind it, and a mod can't.
- No auto-settle. Settling never touches the process.

## Done when

- `herdr-app check mods/t3-inbox` passes.
- A finished agent shows `✓ Settle` on hover; clicking moves it to Settled within a second and `hc get <address> --json` shows `settled=<ms>:<turn>`.
- That Settle shows `Settled 1 agent, Undo` for 5s; Undo puts it back as it was.
- Snoozing a working agent for 1 hour moves it to Snoozed; a permission prompt shows it as Needs you, and answering it hides it again. Due, it wakes marked `Woke`.
- Hovering a card fades its details in beside it; moving to the next card shows that one's at once.
- Sending that agent a new prompt brings it back to the cards and removes the label.
- Hovering a settled row and clicking the arrow puts it on top of the cards.
- With 11+ settled agents, the open shelf shows 10 and `Show N more`.
- `agent.next` walks the cards in their shown order.
