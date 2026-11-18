import { openOverlay, props, run } from "herdr";
import { placeOf } from "./project.js";
import { ownStatus, stillSettled } from "./tree.js";

// Clear needs the core's settled label, even when the shelf already shows a pending Settle.
function clearTargets(view, { put, viewing, f, sp, ps, term, all, kids }) {
  const tabNow = f?.tab ?? sp.find(s => s.active)?.tabs.find(c => c.active)?.id;
  const byPane = new Map(ps.map(p => [p.pane, p]));
  return put.filter(a => {
    if (!a.pane || viewing(a) || a.tab === tabNow) return false;
    const p = byPane.get(a.pane), k = term.get(a.address);
    if (p?.terminal !== a.address || p.tab !== a.tab || !k) return false;
    if (view.pending.settled[a.address] !== undefined) return false;
    return stillSettled(k, ownStatus(a.status, a.address, all), kids.get(a.address));
  });
}

function closeSettled(doomed, { sp, ps }) {
  if (!doomed.length) return;
  const gone = new Set(doomed.map(a => a.pane));
  for (const s of sp) {
    const targets = doomed.filter(a => a.space === s.id);
    if (!targets.length) continue;
    const tabs = new Set(s.tabs.map(c => c.id));
    // The space stays: pane.close refuses its last pane. Make a shell tab in its current folder first.
    if (ps.filter(p => tabs.has(p.tab)).every(p => gone.has(p.pane))) {
      run("tab.new", { space: s.id, folder: placeOf(s, ps), focus: false });
    }
    for (const a of targets) run("pane.close", { pane: a.pane });
  }
}

export function canClearSettled(view, model) {
  return clearTargets(view, model).length > 0;
}

export function requestClear(view, cx) {
  const targets = clearTargets(view, view.compute(cx)).map(a => [a.address, a.pane]);
  if (!targets.length) return;
  view.hot = null; // The dialog covers it, before the pointer can report leaving it.
  const ask = {
    title: `Close ${targets.length} terminal${targets.length === 1 ? "" : "s"}?`,
    detail: "This ends the terminals of your settled agents. The tab you're on stays.",
    yes: "Close",
    // The address/pane pairs live only with this dialog, including in the standalone Inbox.
    command: { name: `t3-inbox.clear:${JSON.stringify(targets)}` },
  };
  // The layout's T3 dialog is t3-actions'; published alone (no `home` prop) this mod has only the shipped one.
  openOverlay(props()?.home ? { mod: "t3-actions", kind: "dialog", frame: "none", width: 512, props: { actions: "confirm", ...ask } }
    : { mod: "confirm", kind: "dialog", props: ask });
}

export function confirmClear(view, answer, cx) {
  let targets;
  try { targets = new Map(JSON.parse(answer)); } catch { return; }
  if (!targets.size) return;
  const model = view.compute(cx);
  closeSettled(clearTargets(view, model).filter(a => targets.get(a.address) === a.pane), model);
}
