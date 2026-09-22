# WinBrain Design System

WinBrain 的三维组织世界由四层设计决策叠起来：数值、运动、界面与资产。前三层此前只有代码，这一份文档把界面层写下来，并给出全系统的实测状态。

**这一层现在有什么：** 28 个 UI 组件的说明、变体、属性、状态、无障碍约定与代码示例；一张可视化的组件真源页 `components.html`；28 个单组件独立预览页；一份由脚本实测、不含手写数字的覆盖审计。

**这一层现在缺什么：** Token 定义完整，但界面代码里绝大多数颜色、圆角和字号是直接写死的。7 个出货页面里有 4 个引用了 `tokens.css`，而剩下的 `index.html` 一张就有 79 处硬编码色值。这不是「没时间做」的欠债，而是当前系统的真实形态——下面的 Audit 一节给出全部数字和优先级。

---

## 一、系统的四层

| 层 | 真源 | 生成的产物 | 管什么 |
|---|---|---|---|
| Token | `source/tokens/tokens.js` | `tokens.css`、`tokens.html` | 颜色、字号、间距、圆角、材质、灯光、相机、层级 |
| Motion | `source/motion/library.js` | `motion-manifest.json`、`motion.html` | Motion Token → Primitive → Behavior → Timeline → Trigger |
| **UI** | **`source/system/ui-registry.js`** | **`components.html`、`preview/`** | **界面组件的变体、状态、无障碍与使用约定** |
| Asset | `source/registry.js`、`assets/catalog.json` | `catalog.html` | 22 个可独立编辑的三维资产 |

四层之间是单向的：Token 层不知道谁在用它，UI 层不反过来改 Token 值。跨层引用只出现在「使用关系」上——`components.html` 会写出每个组件用了哪些 Token、哪些值是手写的；`tokens.html` 的 **USED BY** 会反向跳到使用方。

### 包内六项必需交付

| 文件 | 角色 | 维护方式 |
|---|---|---|
| `manifest.json` | 包清单：四层定义、产物清单、计数、实测审计、门禁 | `source/build-system.mjs` 生成 |
| `DESIGN.md` | 本文件：说明与决策，不承载数值 | 人工维护 |
| `tokens.css` | **设计数值真源**（CSS Custom Properties） | 由 `tokens.js` 生成 |
| `components.html` | **组件设计真源**：变体、状态、无障碍、代码 | 由 `ui-registry.js` 生成 |
| `preview/` | 28 个单组件独立预览页 + 索引 | 由 `ui-registry.js` 生成 |
| `assets/` | 22 个 GLB / 原生资产、目录、品牌图标与来源 | 编辑器导出 + `BRAND-ASSETS.md` |

`assets/` 与 `previews/` 是两个不同的目录，不要混淆：

- `assets/` —— 可导入别的三维工具的**模型文件**（GLB、`.wb3d.json`）。
- `previews/` —— 22 个资产的 **3D / Mock-3D PNG 渲染图**。
- `preview/` —— 28 个 **UI 组件**的独立 HTML 预览页。与上面两者无关。

数值只有一个出口：`tokens.css`。组件样本、预览页、后续框架实现都从这里取值，不新开第二条真源路线。

---

## 二、Token 层

`source/tokens/tokens.js` 里 83 个叶子值，`TOKEN_CATALOG` 收录 54 条，其中 54 条带 CSS 变量。**原则是：重复的设计规则进 Token；一次性模型顶点、人物姿态、单个资产的坐标不进 Token。**

Token 分成八组，其中五组只服务 3D：

| 组 | 例子 | 谁在用 |
|---|---|---|
| Color | `color.canvas` `color.accent` `color.glass` | UI 与 3D 都有 |
| Typography | `type.hero.size` `type.body.size` | UI 与 3D 标签 |
| Spacing | `space.8` … `space.32` | UI |
| Radius | `radius.control` `radius.card` `radius.panel` `radius.dialog` | UI |
| 3D Material | `material.glass.transmission` `material.glass.ior` | 只有 3D |
| Lighting | `light.key.intensity` `light.rim.intensity` | 只有 3D |
| Camera | `camera.yaw` `camera.pitch` `camera.ortho.*` | 只有 3D |
| Layout | `layer.application.y` `layer.intelligence.y` `layer.data.y` | 只有 3D |

第五到第八组同样会生成 CSS 变量——`tokens.css` 里能看到 `--wb-camera-yaw`、`--wb-material-glass-ior` 之类。它们进变量表是为了「所有设计值只有一个出口」，不是因为页面要用：CSS 表达不了传输率、IOR 和正交视锥，真正的消费者是 3D 运行时，通过 `source/tokens/apply.js` 在 `buildWorld()` 之前读取。

### 命名约定

`<组>.<对象>.<细节>`，全小写点分。CSS 变量加 `--wb-` 前缀，点换成短横线：`color.tube-glass` → `--wb-color-tube-glass`。

---

## 三、Motion 层

当前真实运行的动效只有 4 个 Behavior、4 个 Primitive、6 个 Motion Token、1 条 Timeline。它们由 `source/motion/library.js` 描述，`motion.html` 用纯 CSS 动画复现预览——文档页因此不依赖 three.js，可以离线打开。

关键约定：**Asset 定义「谁可以动」，Motion 定义「怎么动」，Timeline 只做编排。** 一个资产不自带全局时钟。

---

## 四、UI 组件层

28 个组件分 6 组，全部记在 `source/system/ui-registry.js`。每个组件有七项必填内容，`components.html` 会逐项渲染，`manifest.json` 会逐项打分：

| 检查项 | 说明 |
|---|---|
| Description | 它是什么、什么时候用 |
| Variants | 变体，以及每种变体的适用场景和选择器 |
| Props / Properties | 可调属性、类型、默认值、含义（含 CSS 自定义属性） |
| States | 默认、悬停、选中、禁用、聚焦等状态下的视觉与行为 |
| Accessibility | role、键盘路径、读屏播报 |
| Guidance | Do / Don't 各至少一条 |
| Code Example | 可直接粘贴的 HTML |

当前 **28 / 28 全部通过**。

### 预览是怎么渲染的

`components.html` 和 `preview/` 里的每一个组件，都是用**出货中的真实样式表**现场渲染的，不是另画一遍：

1. `source/system/css-scope.js` 读 `source/shell.html`、`source/editor/studio.css`、`source/build-*.mjs` 里的 `<style>`；
2. 只保留该组件登记过的选择器对应的规则；
3. 给每条选择器加 `:where(.ds-stage--<stage>.ds-pv-<组件>)` 前缀——`:where()` 权重为 0，所以原有层叠顺序完全不变；
4. 舞台按三种上下文渲染：**文档页**、**首页场景**（1536 × 1024 内按比例缩放）、**编辑器**。

这样做的好处是预览**不可能与产品漂移**：改了 `studio.css`，预览页下次构建自动跟着变。代价是文档页的样式表里带了一份出货 CSS，所以它是审计工具而不是被审计对象。

有四条边界必须守住，它们都是本次开发中真实踩过的坑：

- **作用域要落到单个组件，不能只到「舞台种类」。** `.swatch`（Token 审计）和 `.preview>span`（资产总览）都描述「预览框里的一个 span」，两张页面上永远不会同时出现；合并到一个作用域后，权重更高的那条会赢。作用域因此是 `:where(.ds-stage--<stage>.ds-pv-<组件>)`。
- **不同上下文的基础规则不能互相借。** 首页的 `body` 是 `#f4f5f8`，文档页的 `body` 是 `var(--wb-color-text)`；`body[data-mode="studio"]` 只属于编辑器。跨上下文借用会让某个舞台静默继承另一张页面的颜色。`SURFACE_FILES` 就是这条规则的实现。
- **没有样式表的文件不能当 CSS 解析。** `source/home.js` 里的花括号会被解析成一个吞掉整张样式表的假规则。
- **正则剥 `@font-face` 会连带吞掉后面的样式表。** base64 字体数据交给解析器当普通 at-rule 跳过即可。

---

## 五、Audit · 实测结果

全部由 `source/system/audit.js` 从出货文件读取，没有手写数字。

### 5.1 Token 采用率

| 页面 | 链接 `tokens.css` | `var(--wb-*)` 次数 | 硬编码色值 |
|---|---|---|---|
| `index.html` 三维首页 | ❌ | 0 | 79 |
| `studio.html` 组件编辑器 | ✅ | 8 | 192 |
| `catalog.html` 资产总览 | ✅ | 7 | 30 |
| `tokens.html` Token 审计 | ✅ | 12 | 47 |
| `motion.html` Motion 库 | ✅ | 17 | 50 |
| `comparison.html` 原图对照 | ❌ | 0 | 29 |
| `global.html` 全局预览 | ❌ | 0 | 35 |
| **合计（7 个出货页面）** | **4 / 7** | **44** | **462** |

`components.html` 是这套审计自己的载体：它用 16 处 `var()`，但它同时内嵌了一份出货 CSS 的副本用于渲染预览。把它计入会让每一条尺度和每一处字面值都被重复统计，并用自己的 `var()` 抬高整体采用率。因此上表把它单列，**色值、圆角与手写复制的合计都只用左边 7 个出货页面**。

**462 不是 462 个待办。** 去重后全站只有 **323 种色值**，其中 284 种（87.9%）只出现一次——那是三维场景的一次性色，抽象成 Token 只会得到同样数量的、只用一次的 Token。真正可机械处理的，是下面那一小类：**逐字节等于某条既有 Token 的手写副本**。

### 5.2 手写复制的 Token 值：已清零

上一版这里列着 8 处逐字节复制，分布在 `catalog.html`、`motion.html` 与 `studio.html`。现在全部改为 `var()` 引用，**颜色字面值复制实测为 0**。

同一把尺子量到圆角时还剩 **9 处**。它们不是一类，按来源分开才看得清：

| 来源 | 次数 | 为什么还没改 |
|---|---|---|
| `source/shell.html` 的 `9px` `16px` `19px` `20px` | 8 | 同一份文件同时供给 `index.html` 与 `studio.html`：后者能解析 `var()`，前者不能，而改一处两个页面都变 |
| `comparison.html` 的 `9px` | 1 | 没有任何 CSP 拦它，只是没链接 `tokens.css`；它属于哪一层是 §5.7 第 6 条的事 |

上一版这里写的是「11 处，全部经由 `source/shell.html`」。**那句话是错的**，而且错得会掩盖工作量：另外 3 处分别在 `source/editor/studio.css`、`source/build-tokens.mjs` 与 `comparison.html`，前两个页面本来就加载 `tokens.css`，把它们记成「被首页 CSP 挡住」等于用一条不成立的 blockage 盖住两个一行就能改的地方。这两处已改为 `var()`——`studio.css` 的品牌标 `9px` → `radius.card`，`tokens.html` 的筛选胶囊 `16px` → `radius.control`——棘轮上限随之从 11 降到 9。

剩下那 8 处确实卡在一个已实测的事实上：

> `index.html` 拒绝加载 `tokens.css`。它的 CSP 是 `style-src 'unsafe-inline'`，没有 `'self'`，Chromium 直接拦掉同源样式表——控制台原话：`Loading the stylesheet ... violates the following Content Security Policy directive: "style-src 'unsafe-inline'"`。实测时 `var(--wb-color-accent)` 解析成继承值 `rgb(244, 245, 248)`，不是 `#67ccff`。

**但内联是通的，所以这里没有一个需要拍板的安全取舍。** 同一条 CSP 允许内联 `<style>`（`'unsafe-inline'` 就是这个意思），而 `source/build.mjs` 已经在用这条路把 `scene.js` 和参考图放进 `index.html`。在同一张页面上注入真正的 `tokens.css` 文本后实测：`var(--wb-color-accent)` → `rgb(103, 204, 255)`，`var(--wb-radius-control)` → `16px`，CSP 拒绝消息 **0 条**。代价是 1.7 KB（`tokens.css`）加在 1784 KB 的单文件首页上，约 0.1%。

不过它解开的也只是这 8 处圆角。`index.html` 的 79 处颜色字面值里，**逐字节等于既有 Token 的是 0 处**——那多是三维场景的一次性色（§5.1 的 323 种色值里 284 种只出现一次）。「把首页接进 Token 层」不等于「首页也能清掉 79 处」，这是两件事。

改动是**可证明无视觉变化**的，不是「看起来一样」：

- 每个被替换的字面值都**逐字节等于**它换上的那条 Token；
- `tokens.css` 是一个纯 `:root` 自定义属性块，没有任何元素选择器，所以给它加 `<link>` 不可能影响布局；
- `source/review/verify-design-system.py` 的 32 项 `getComputedStyle` 对比在改动前后都是 **32 / 32**。

#### 编辑器影子 Token：上一版的建议是错的

`studio.css` 的 `:root` 里有四个局部变量，上一版建议「并回 `tokens.css`」。照字面做会把编辑器重新上色——其中三个和同名全局 Token 的**值并不相同**：

| 局部变量 | 值 | 与同名全局 Token 的关系 | 实际处理 |
|---|---|---|---|
| `--surface` | `#141b25` | 等于 `color.scene-background` | 零处 `var()` 引用，删除 |
| `--accent` | `#9dbeff` | **不等于** `color.accent`（`#67ccff`） | 零处 `var()` 引用，删除 |
| `--border` | `#28313f` | **不等于** `color.border`（`#31445f`） | 提升为 `color.divider`，4 处引用改 `var()` |
| `--dim` | `#8d9aab` | **不等于** `color.text-muted`（`#93a9c5`） | 提升为 `color.text-dim`，1 处引用改 `var()` |

真正的问题是**命名撞车**：`--border` / `--accent` 看起来像全局 Token 的别名，值却不同，读代码的人一定会猜错。现在这四条声明全部消失，值从 `tokens.js` 流到 `tokens.css`，编辑器视觉不变。

`--border` 与 `--dim` 提升后仍是**编辑器专用值**，与全局同级 Token 不同。编辑器是否应该比站点更深，是一个尚未决定的设计问题——本文件只保证不再有第二条真源。

这一步还暴露了一个已经存在的缺陷：`studio.css` 补上了 `var(--wb-*)` 之后，`studio.html` 并没有加载 `tokens.css`，7 处引用全部解析为空。**给 `studio.html` 补 `<link>` 是这一步的必要条件，不是附带改动。**

### 5.3 圆角尺度

系统里实际出现 **21 种** `border-radius` 值，Token 定义了 4 种（补录 `radius.control` 后），在 7 个出货页面里圆角 Token 共被引用 **7 次**（`var(--wb-radius-card)` 6 次、`var(--wb-radius-control)` 1 次）。

```
var(--wb-radius-card) ×6   var(--wb-radius-control) ×1   100% ×2   50% ×14
29px ×2   25px ×2   22px ×1   20px ×2   19px ×2   16px ×2   15px ×2
12px ×4   10px ×5    9px ×3    8px ×6    7px ×3    6px ×8    5px ×6
4px ×8    3px ×5    2px ×1
```

`16px` 就是 `radius.control`——胶囊按钮和筛选胶囊一直在手写它，现在筛选胶囊改用 `var()` 了。`10px`（`.motion-card`、`.timeline-card`）仍没有任何 Token 对应。

注意 `50% ×14` 与 `100% ×2` 是圆和胶囊，不是尺度决策。真正的临时值约 17 个，且多为 2–5px 的小件。这一步需要逐页看图，是纯观感工作，不适合和数值迁移混在一起做。

### 5.4 没有出口的设计值

`tokens.js` 里 83 个叶子值中，**28 个**既不在 `tokens.css` 里，也没有以同值同命名空间的条目出现在审计页。

判定规则写在 `source/system/audit.js`：按名字匹配，或按「同值且同命名空间」匹配（`typography.heroSize` 与 `type.hero.size` 是同一个决策，`radius.control: 16px` 与 `space.16: 16px` 不是）。

这 28 个全部是 3D 值：

| 组 | 数量 | 例子 |
|---|---|---|
| 3D Material | 10 | `material.default.clearcoat` `material.glass.thickness` `material.tubeGlass.*` |
| Lighting | 9 | `lighting.hemisphere.*` `lighting.{key,rim,front}.color/position` |
| Camera | 7 | `camera.ortho.*` `camera.target` |
| Rendering | 2 | `rendering.pixelRatioMin/Max` |

**UI 四组（Color / Typography / Spacing / Radius）已经没有任何出口缺口。**

上一版这里有 12 个，其中 7 个被描述成「纯 UI 决策」。那个判断只对了一部分——按**真实消费者**核对之后：

| 值 | 真实消费者 | 处理 |
|---|---|---|
| `color.panelElevated` | 4 张文档页的页头背景，值被手写 | 补 `css:`，页面改用 `var()` |
| `radius.control` / `space.4` / `space.48` | UI 大量手写（4px 一项就有约 45 处） | 补 `css:` |
| `type.familyUi` / `type.layerTitleWeight` | 值被手写进 CSS，但**没有任何代码读这个键** | 补 `css:`，供后续接管 |
| `accentBlue` / `accentViolet` / `sceneClear` / `silver` / `white` / `black` | 只在 `source/core.js` 与 `.wb3d.json` | 仅入册，不新增 UI 使用者 |

补录后 `TOKEN_CATALOG` 收录 54 条，其中 54 条带 CSS 变量。

### 5.5 命名一致性

| 角色 | 现有写法 | 状态 |
|---|---|---|
| 选中态 | `.active` + `aria-pressed` / `aria-current` | ✅ 已统一 |
| 页面头部 | `.header`（首页）/ `.studio-header`（编辑器）/ `header`（文档页裸元素） | ⬜ 三处三种 |
| 分区小标签 | `.eyebrow` / `.stage-eyebrow` / `.kind` / `.token-meta` | ⬜ 四种写法，字号 9/10/11px、字距 1.4/1.5/2px、五种蓝色 |
| 徽标圆角 | `.version-tag` 4px / `.item-version` 3px | ⬜ 两处不一致 |

选中态不是纯风格问题：`.active` 读屏收不到，`aria-pressed` / `aria-current` 能。但**「选中」在不同控件上需要的属性并不相同**，一把梭是错的：

| 控件 | 属性 | 为什么 |
|---|---|---|
| 首页导航项 | `aria-current="page"` | 导航里「当前所在」正是该属性定义的语义 |
| 编辑器视图切换 / 筛选胶囊 | `aria-pressed` | 容器已是 `role="group"`，按钮是切换按钮 |
| 编辑器组件行 | `aria-pressed` | 宽 100% 的 `<button>`，同一时刻只有一个为真 |

这四处现在都是「`.active` 负责样式、ARIA 属性负责语义」，**CSS 一行没改**——所以这一步同样不产生视觉变化。`components.html` 里对应组件的 Preview、Accessibility 与 Code Example 也已同步到出货代码的真实写法。

### 5.6 棘轮：防止清单重新长回来

上面的数字都会被 `npm run verify:system` 核对，但那只能证明**文档没腐烂**，并不能阻止数字本身变大。所以 `source/system/check-docs.mjs` 末尾有四条棘轮：

| 棘轮 | 当前 / 上限 | 为什么不是 0 |
|---|---|---|
| 手写复制的颜色字面值（应被 `var()` 取代） | 0 / 0 | — |
| 手写复制的圆角字面值 | 9 / 9 | 8 处来自 `source/shell.html`（同一份文件供给两张页面，其中 `index.html` 解析不了 `var()`），1 处在 `comparison.html`（§5.2） |
| 没有出口的 UI 设计值 | 0 / 0 | — |
| 审计看不见的页面副本里手写的 Token 值 | 0 / 0 | — |

圆角那一行**钉死在 9**，且单位是出现次数而不是「有几种不同的值」——按种类计数的话，同一个值被复制任意多次都不会触发，那就不叫棘轮了。上限从 11 降到 9 不是因为尺子变松：尺子、单位、判定规则都没动，是那 3 处被错误归因的字面值里有 2 处真的改掉了。

第四条棘轮是**为一次真实的漏网加的**。`components.html` 因为内嵌了所有出货 CSS 的副本而被审计跳过，这个排除对合计是对的，但顺带让 `source/build-system.mjs` 里那份手写的 `.ds-page` 页面副本完全无人测量——那里一直写着 `border-radius: 16px`，也就是 `radius.control`。它一直没被发现，直到 `tokens.html` 改用 `var()`：副本的特异性更高，于是预览其实一直跟着副本走，而不是跟着 Token 走。这件事 `audit.js` 看不到（`instrument: true` 被排除），32/32 的样式一致性也看不到（副本和 Token 解析出来都是 16px）。现在这条棘轮禁止那份副本里出现等于既有 Token 的字面值——颜色和圆角都算，当前两项都是 0。

失败信息会直接说明怎么处理：新值要么改用 `var()`、要么补 `TOKEN_CATALOG` 出口，**要么把这个上限连同理由一起调高**。调高上限是允许的，但必须写理由——否则棘轮就变成了装饰。

### 5.7 优先级行动

1. **把 `tokens.css` 内联进 `index.html`（不是放宽 CSP）。** 这一条不需要拍板，因为那个安全取舍并不存在：同一条 CSP 允许内联 `<style>`，`build.mjs` 已经这样内联 `scene.js` 和参考图，实测注入后 `var()` 正常解析、CSP 拒绝 0 条（§5.2）。做它是为了解开 `source/shell.html` 那 8 处圆角，**不是**为了那 79 处颜色字面值——其中逐字节等于既有 Token 的为 0。成本约 0.1% 体积。建议与下面第 2 条合并成一次改动：内联只是让值可换，换成什么要等圆角尺度定下来。
2. **收敛圆角尺度。** 21 种降到 5–6 种（如 3/5/9/16/20/50%），先决定 `10px` 归到 `9px` 还是新增 `radius.card-elevated`。纯观感工作，需要看图。
3. **统一小标签命名**为一个组件（见 `preview/eyebrow.html`），四套写法合并。
4. **统一页面头部命名**，三处变一处。
5. **决定编辑器专用 Token 的去留**：`color.divider` / `color.text-dim` 现在是合法的独立 Token，但「编辑器为什么比站点更深」还没有答案。
6. **给 `comparison.html` / `global.html` 补 `<link>`**，或明确承认它们是临时页、不进入 Token 体系。这一条现在有具体代价：`comparison.html` 的 `9px` 就是 §5.2 那 9 处中的 1 处，而它并没有 CSP 挡着，只是没链接。

## 六、贡献规则

**加一个新 UI 组件：**

1. 在 `source/system/ui-registry.js` 登记，七项内容缺一不可；
2. 运行 `cd source && npm run build`；
3. 运行 `npm run verify:system`。它会先断言本文件的数字，所以组件数量一变，第 3 步会先失败并指出该改哪一句——这是有意的，别绕过它。

**改一个组件的样式：** 直接改出货样式表（`shell.html` / `studio.css` / `build-*.mjs`）。预览会在下次构建时自动跟上，**不要**去改 `components.html`——它是产物。

**改设计数值：** 只改 `source/tokens/tokens.js`。不要在任何页面里新写一个「差不多」的值；如果现有 Token 不够用，先加 Token 再用。**加 Token 时必须同时决定它的消费者**：值被页面手写，就顺手改成 `var()`；只在 3D 运行时里用，就只入册不铺开，并在 §5.4 的表格里记一行。

**改选中态：** `.active` 只管样式，语义交给 ARIA。先查 §5.5 的表决定用 `aria-pressed` 还是 `aria-current`，再同步 `ui-registry.js` 里该组件的 Preview、Accessibility 与 Code Example——`components.html` 是组件设计真源，它写着「当前选中没有 aria-pressed 可读」而产品里已经有了，就是真源在说谎。

**棘轮失败时：** 不要直接调高上限。先问「这个新值该不该有出口」；确实不该有的（例如一次性场景色），再把上限和理由一起写进 `check-docs.mjs`。

**不要做的事：**

- 不要在 `components.html` 或 `preview/` 里手写样式副本——那会立刻产生漂移，而且审计页的设计目的就是证明「预览 = 产品」。
- 不要在 `ui-registry.js` 里写没有在出货代码中出现过的组件。文档描述的是已经存在的界面。
- 不要手工编辑 `manifest.json`、`components.html`、`tokens.css`、`preview/`。

---

## 七、重新生成与验证

```sh
cd source
npm ci
npm run build          # 生成 index / studio / catalog / tokens / motion / components / manifest / preview
```

`npm run build` 会写上一层的 `index.html`、`studio.html`、`catalog.html`、`tokens.css`、`tokens.html`、`motion.html`、`motion-manifest.json`、`components.html`、`manifest.json` 和 `preview/`。CI（`.github/workflows/build-generated-pages.yml`）在 `source/**` 变更后会自动重跑并提交这些产物。

### 验证

```sh
python3 -m http.server 8791 --bind 127.0.0.1   # 或项目目录下的任意静态服务
pip install playwright && playwright install chromium   # 首次
cd source && npm run verify:system -- --port 8791
```

`npm run verify:system` 跑两步：先由 `source/system/check-docs.mjs` 重新跑一遍审计、断言本文件里每一个引用到的实测数字都与它对得上（文档里的数字同样会腐烂；只有组件数量那一条是拿 `manifest.json` 核的），再跑 §5.6 的四条棘轮，再由 `source/review/verify-design-system.py` 驱动真实 Chromium 做五件事，结果写入 `design-system-verification.json`：

1. **加载**：6 个页面 + 28 个独立预览页全部返回 200 且舞台有实际尺寸；
2. **样式一致性**：16 组「同一组件在出货页面 vs 在预览里」的 `getComputedStyle` 逐属性对比，**每个组件同时验证 `components.html` 与 `preview/<组件>.html` 两个落点**，共 32 项；
3. **自身样式覆盖**：28 个组件的 markup 里用到的每一个 class，都必须在它自己的预览页里有对应规则——防止登记选择器时漏掉某个变体，让预览静默失去样式；
4. **内部链接**：`components.html` 与 29 个 `preview/` 页面上的 37 条内部链接逐条实际请求，全部必须返回 200；
5. **运行时**：无 JavaScript 错误、无外部网络请求、`tokens.css` 的变量可解析。

最近一次结果：**47 项检查全部通过，样式一致性 32 / 32，0 个 JavaScript 错误，0 个外部请求。**

这套对比是真会失败的——它先后抓出了八个真实缺陷，每一个都会让预览悄悄偏离产品：

1. 剥 `@font-face` 的正则连带吞掉了后面的整张样式表；
2. `source/home.js` 被当作 CSS 解析，一个假规则吃掉了剩余全部规则；
3. 文档页的基础规则串进首页舞台，让预览继承了另一张页面的 `body` 颜色；
4. `.swatch`（Token 审计）与 `.preview>span`（资产总览）在共享作用域里撞车；
5. Token 卡片漏登记两个变体选择器，卡片自己的预览框渲染成无样式；
6. `preview/` 里的跨页导航用了根相对路径，从子目录打开全部 404——这是后加的链接检查抓到的；
7. 给 `tokens.html` 的筛选胶囊补 ARIA 时改动了内联脚本，少了一个右括号，整页脚本停止执行（`missing ) after argument list`）。样式一致性 32 / 32 依然全过——**只比样式是抓不到脚本挂掉的**，这条是靠控制台错误检查兜住的。
8. `source/build-system.mjs` 的 `.ds-page` 副本里写死 `border-radius:16px`，特异性高过组件的 `var()` 规则，于是预览一直跟着副本走而不是跟着 Token 走。32 / 32 同样全过，因为两边算出来都是 16px——**等值比较看不见「这条规则根本没生效」**。

第 8 条给出的方法是：别比等值，**把 Token 挪走再看像素跟不跟**。实测把 `--wb-radius-control` 改成 `3px`，`tokens.html`、`components.html` 与 `preview/filter-chip.html` 的筛选胶囊全部变成 `3px`；把旧的字面值规则放回去，预览就停在 `16px` 不动。这条探测（以及 §5.6 第四条棘轮）才是这类缺陷的通用检出手段，等值对比不是。

截图落在 `design-system-review/`。

### 页面清单

| 文件 | 在线 | 说明 |
|---|---|---|
| `components.html` | https://liush2yuxjtu.github.io/winbrain-3d-component-studio/components.html | 组件设计真源与可视化预览（28 个组件） |
| `preview/index.html` | https://liush2yuxjtu.github.io/winbrain-3d-component-studio/preview/ | 28 个单组件独立预览页 |
| `manifest.json` | https://liush2yuxjtu.github.io/winbrain-3d-component-studio/manifest.json | 包清单与实测审计 |
| `tokens.html` | https://liush2yuxjtu.github.io/winbrain-3d-component-studio/tokens.html | Token 审计与使用方反查 |
| `motion.html` | https://liush2yuxjtu.github.io/winbrain-3d-component-studio/motion.html | Motion 库 |
| `catalog.html` | https://liush2yuxjtu.github.io/winbrain-3d-component-studio/catalog.html | 22 个三维资产 |
