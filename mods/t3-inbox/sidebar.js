export function sidebarParts(root) {
  let rail = root?.id === "sidebar" ? root : undefined;
  let stack = root?.id === "sidebar-lists" ? root : undefined;
  for (const child of root?.children ?? []) {
    const found = sidebarParts(child);
    rail ??= found.rail;
    stack ??= found.stack;
    if (rail && stack) break;
  }
  return { rail, stack };
}

// Where the sidebar's toggle stands, as T3's: one place whether the sidebar shows or not (the brand bar's first button, else the
// tab row's). Past the macOS window buttons when the layout draws them (traffic lights x 66 on: the last ends 52 past x, then
// 14, all screen points, unzoomed), less 4 logical; else 8 in.
export function toggleLeft(w, root, zoom = 1) {
  const lights = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights;
  return lights ? (root.traffic_lights[0] + 66) / zoom - 4 : 8;
}
