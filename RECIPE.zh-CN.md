# T3 Inbox

> 中文译本。给 agent 构建用的正本是 [RECIPE.md](RECIPE.md)，两者不一致时以英文为准。

Herdr App 的一个侧栏：只把仍需要你关注的 agent 以卡片放在眼前，最新动态排最前。处理完的 agent 由你手动 Settle，沉入底部安静的折叠列表；有新工作就自动回来。参照 [T3 Code](https://github.com/pingdotgg/t3code) 的 Settle 侧栏。

![T3 Inbox](preview.png)

## 规格在哪里

`mods/t3-inbox` 是 [Herdr T3 布局](https://github.com/JinJieBeWater/herdr-t3)的 Inbox 侧栏，由它的 `scripts/sync.sh` 复制到这里。外观和行为（卡片、收纳区、Settle、Snooze、拖动、动效、悬停标签与详情、键盘）以 herdr-t3 的 [Inbox 规格](https://github.com/JinJieBeWater/herdr-t3/blob/main/docs/internals/specs/inbox.md)和[视觉基准](https://github.com/JinJieBeWater/herdr-t3/blob/main/docs/internals/t3-tokens.md)为准，改动也在那里改。下面只写它单独使用时的不同。

## 单独使用

- `mod.json` 让它停靠在左侧、宽 300（`"place": "left"`），Herdr T3 里则由布局放进侧栏的 stack（`"none"`）。`keys.json` 在 `global` 里加 Settle 键：`"cmd-shift-s": "t3-inbox.settle"`。
- 布局给了就用的 props，没给时：`newMenu`（New tab 打开这个 mod；否则用自带的 `new-menu`）、`menu`（卡片的右键菜单；否则没有，因为自带的 `menu` 没有 agent 菜单）和 `home`（Settle 当前查看的 agent 后回 Home；否则照 T3 跳到下一张卡片）。
- Settle 和 Snooze 的状态是 agent 自己终端上的标签（`hc label <address> settled=<ms>:<turn>`、`snoozed=<到期 ms>`）：随终端结束，所有 mod 和窗口都读得到。收纳区折叠、筛选和上次看到的状态在 mod 的 `localStorage`；画出来的行以 `t3-inbox.rows` 共享，供布局的按键遍历。
- Herdr T3 标签栏额外做的（它自己按键的取消 Settle `t3-tabs.unsettled`、已 Settle agent 隐藏的完成点），单独使用时没有。
- 运行的程序：`hc label`；为 space 标志，在 space 所在机器上跑 `git rev-parse --show-toplevel`、`sh -c` 文件测试和 `base64`。
- Inbox 在窗格所在的机器上用 `git rev-parse` 和 `git worktree list --porcelain -z` 识别链接工作树。

## 注意

- `hc label` 写入的标签大约 0.65 秒后才出现在 `terminals()`。先把新值记为待定，让行立即移动；写入失败就撤回，并发一条错误 `notify`。慢速远程下，同一个标签的多次写入可能以任意顺序落地：有不止一次在途时保留最后一次意图，全部返回后若标签不符就再写一次。
- `terminals()[].status_ms` 只是 App 启动时的值，仅在 mod 自己看到变化前兜底。
- 记录变化时间时把 `done` 和 `idle` 视为同一状态：查看一个 done 的 agent 会让它变 idle，而查看不算新动态。
- 没有窗格的子 agent 不在 `agents()` 里，要沿 `terminals()` 的 `parent` 找。
- 卡片移走时不会触发指针离开事件：Settle / Un-settle 时清掉悬停状态。
- 悬停样式能作用到文字，作用不到 `svg`；把悬停做成状态，图标和文字才能一起变亮。
- Herdr 只对元素后续的变化做缓动：移动的行要换新 id，先在原位画一次，再放开。
- Herdr 不能用代码滚动普通列表，所以和 T3 不同，当前查看的行不会自动滚到视野内。
- `.tooltip()` 只接受字符串且用外壳自己的样式，所以用 `HoverCard`；它不会翻转，窗口底部的控件要自己向上打开。详情卡片是实色的：T3 的毛玻璃会模糊背后内容，mod 做不到。
- 不做自动 Settle。Settle 从不影响进程。

## 完成标准

- `herdr-app check mods/t3-inbox` 通过。
- 悬停已结束的 agent 出现 `✓ Settle`；点击后一秒内移入 Settled，`hc get <address> --json` 里有 `settled=<ms>:<turn>`。
- 这次 Settle 显示 `Settled 1 agent, Undo` 5 秒；Undo 恢复原样。
- 把工作中的 agent Snooze 1 小时后，它进入 Snoozed；出现权限请求时显示 Needs you，答复后再次隐藏。到点后标 `Woke` 醒来。
- 悬停卡片时，详情在旁边淡入；移到下一张卡片时，立即显示它的详情。
- `Clear` 在关闭任何窗格前，先通过 `confirm` 对话框询问。
- 给这个 agent 发新提示，它回到卡片区，标签被删掉。
- 悬停已 Settle 的行，点箭头，它回到卡片最上方。
- 已 Settle 超过 10 个时，展开的收纳区显示 10 个和 `Show N more`。
- `agent.next` 按卡片显示顺序依次切换。
