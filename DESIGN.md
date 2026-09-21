# WinBrain Design System

WinBrain 的三维组织世界由四层设计决策叠起来：数值、运动、界面与资产。前三层此前只有代码，这一份文档把界面层写下来，并给出全系统的实测状态。

**这一层现在有什么：** 28 个 UI 组件的说明、变体、属性、状态、无障碍约定与代码示例；一张可视化的组件真源页 `components.html`；28 个单组件独立预览页；一份由脚本实测、不含手写数字的覆盖审计。

**这一层现在缺什么：** Token 定义完整，但界面代码里绝大多数颜色、圆角和字号是直接写死的。7 个出货页面里只有 2 个引用了 `tokens.css`。这不是「没时间做」的欠债，而是当前系统的真实形态——下面的 Audit 一节给出全部数字和优先级。

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

`source/tokens/tokens.js` 里 81 个叶子值，`TOKEN_CATALOG` 收录 40 条，其中 40 条带 CSS 变量。**原则是：重复的设计规则进 Token；一次性模型顶点、人物姿态、单个资产的坐标不进 Token。**

Token 分成八组，其中五组只服务 3D：

| 组 | 例子 | 谁在用 |
|---|---|---|
| Color | `color.canvas` `color.accent` `color.glass` | UI 与 3D 都有 |
| Typography | `type.hero.size` `type.body.size` | UI 与 3D 标签 |
| Spacing | `space.8` … `space.32` | UI |
| Radius | `radius.card` `radius.panel` `radius.dialog` | UI |
| 3D Material | `material.glass.transmission` `material.glass.ior` | 只有 3D |
| Lighting | `light.key.intensity` `light.rim.intensity` | 只有 3D |
| Camera | `camera.yaw` `camera.pitch` `camera.ortho.*` | 只有 3D |
| Layout | `layer.application.y` `layer.intelligence.y` `layer.data.y` | 只有 3D |

第五到第八组没有对应的 CSS 变量是有意的：CSS 表达不了传输率、IOR 和正交视锥。它们的消费者是 3D 运行时，通过 `source/tokens/apply.js` 在 `buildWorld()` 之前读取。

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
| `studio.html` 组件编辑器 | ❌ | 0 | 198 |
| `catalog.html` 资产总览 | ❌ | 0 | 36 |
| `tokens.html` Token 审计 | ✅ | 10 | 48 |
| `motion.html` Motion 库 | ✅ | 4 | 65 |
| `comparison.html` 原图对照 | ❌ | 0 | 29 |
| `global.html` 全局预览 | ❌ | 0 | 35 |
| **合计（7 个出货页面）** | **2 / 7** | **14** | **490** |

`components.html` 本身用了 15 处 `var()`，但它包含一份出货 CSS 的副本用于渲染预览，计入会重复计数，所以排除在合计之外。

### 5.2 被手写复制最多的 Token 值

这些不是「看起来像」，是**完全相同**的色值：

| 字面值 | 等价 Token | 出现次数 | 页面 |
|---|---|---|---|
| `#67ccff` | `color.accent` | 5 | motion.html |
| `#101720` | `color.canvas` | 4 | studio.html, catalog.html, motion.html |
| `#31445f` | `color.border` | 4 | catalog.html, motion.html |
| `#182434` | `color.panel` | 3 | catalog.html, motion.html |
| `#dce7f6` | `color.text` | 2 | catalog.html, motion.html |
| `#93a9c5` | `color.text-muted` | 2 | catalog.html, motion.html |
| `#141b25` | `color.scene-background` | 1 | studio.html |
| `#365a95` | `color.glass` | 1 | motion.html |

`catalog.html` 的卡片最典型：`border:1px solid #31445f; background:#182434; border-radius:9px` 三个值分别等于 `--wb-color-border`、`--wb-color-panel`、`--wb-radius-card`，写死在那里。改 Token 不会影响它。

编辑器还有一层影子 Token：`.studio-header` 之外，`studio.css` 的 `:root` 重新声明了 `--border` `--dim` `--surface` `--accent` 四个局部变量，和 `tokens.css` 的同名概念各走各的。

### 5.3 圆角尺度

系统里实际出现 **20 种** `border-radius` 值，Token 只定义了 3 种，实际被引用 7 次。

```
50% ×14   100% ×2   29px ×2   25px ×2   22px ×1   20px ×2   19px ×2
16px ×4   15px ×2   12px ×2   10px ×5    9px ×6    8px ×2    7px ×3
6px ×7    5px ×6    4px ×15   3px ×5     2px ×1    var(--wb-radius-card) ×7
```

其中 `16px` 就是 `tokens.js` 里的 `radius.control`——胶囊按钮和筛选胶囊都在用它，但这条 Token 没有导出。`10px`（`.motion-card`、`.timeline-card`）没有任何 Token 对应。

### 5.4 没有出口的设计值

`tokens.js` 里 81 个叶子值中，**40 个**既不在 `tokens.css` 里，也没有以同值同命名空间的条目出现在审计页。判定规则写在 `source/system/audit.js`：按名字匹配，或按「同值且同命名空间」匹配（`typography.heroSize` 与 `type.hero.size` 是同一个决策，`radius.control: 16px` 与 `space.16: 16px` 不是）。

这 40 个值按组分布：

| 组 | 数量 | 例子 |
|---|---|---|
| Color | 7 | `color.panelElevated` `color.accentBlue` `color.accentViolet` `color.silver` `color.white` `color.black` `color.sceneClear` |
| Typography | 2 | `typography.familyUi` `typography.layerTitleWeight` |
| Spacing | 2 | `spacing.4` `spacing.48` |
| Radius | 1 | `radius.control` |
| 3D Material | 9 | `material.default.clearcoat` `material.silver.*` `material.white.*` `material.glass.metalness/thickness` `material.tubeGlass.*` |
| Rendering | 2 | `rendering.pixelRatioMin/Max` |
| Lighting | 11 | `lighting.hemisphere.*` `lighting.{key,rim,front}.color/position` |
| Camera | 6 | `camera.ortho.left/right/top/bottom/near/far` `camera.target` |

3D 类的值不出现在 CSS 里是设计使然（见第二节）。但 Color、Typography、Spacing、Radius 这四组的 **12 个**值是纯 UI 决策，它们应该出现在 `tokens.css` 里。

### 5.5 命名一致性

同一个角色出现了多种命名：

| 角色 | 现有写法 | 位置 |
|---|---|---|
| 页面头部 | `.header`（首页）/ `.studio-header`（编辑器）/ `header`（文档页裸元素） | 三处三种 |
| 分区小标签 | `.eyebrow` / `.stage-eyebrow` / `.kind` / `.token-meta` | 四种写法，字号 9/10/11px、字距 1.4/1.5/2px、五种蓝色 |
| 选中态 | `.active`（多数）/ `[aria-pressed="true"]`（首页控制按钮） | 两套约定 |
| 徽标圆角 | `.version-tag` 4px / `.item-version` 3px | 两处不一致 |

`.active` 与 `aria-pressed` 并存不是纯风格问题：前者读屏收不到，后者能。

### 5.6 优先级行动

1. **把 12 个纯 UI 值加进 `TOKEN_CATALOG`**（Color 7、Typography 2、Spacing 2、Radius 1）。它们是已经存在的决策，只是没有出口；加进去不动任何视觉。
2. **让 `catalog.html` 与 `motion.html` 改用 `var()`。** `motion.html` 已经 `<link>` 了 `tokens.css`，只差把 8 处字面值换掉；`catalog.html` 要先加 `<link>`。改完之后上表 8 处手写复制全部消失，这是收益最直接的一步。
3. **收敛圆角尺度。** 20 种降到 5–6 种（如 3/5/9/16/20/50%），先决定 `10px` 归到 `9px` 还是新增 `radius.card-elevated`。
4. **统一小标签命名**为一个组件（见 `preview/eyebrow.html`），四套写法合并。
5. **给 `.active` 补上 `aria-pressed` 或 `aria-current`**，让选中状态对读屏可见。`components.html` 每个组件的 Accessibility 一栏已经逐条记下了缺什么。
6. **编辑器消除影子 Token**：把 `studio.css` 的 `:root` 四个局部变量并回 `tokens.css`。

---

## 六、贡献规则

**加一个新 UI 组件：**

1. 在 `source/system/ui-registry.js` 登记，七项内容缺一不可；
2. 运行 `cd source && npm run build`；
3. 运行 `npm run verify:system`，确认 28 → 29 个组件块、独立预览页同步增加。

**改一个组件的样式：** 直接改出货样式表（`shell.html` / `studio.css` / `build-*.mjs`）。预览会在下次构建时自动跟上，**不要**去改 `components.html`——它是产物。

**改设计数值：** 只改 `source/tokens/tokens.js`。不要在任何页面里新写一个「差不多」的值；如果现有 Token 不够用，先加 Token 再用。

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
python3 -m http.server 8791 --bind 127.0.0.1   # 或 npm 运行目录下的任意静态服务
cd source && npx playwright install chromium    # 首次
npm run verify:system -- --port 8791
```

`source/review/verify-design-system.mjs` 驱动真实 Chromium，做四件事，结果写入 `design-system-verification.json`：

1. **加载**：6 个页面 + 28 个独立预览页全部返回 200 且舞台有实际尺寸；
2. **样式一致性**：16 组「同一组件在出货页面 vs 在预览里」的 `getComputedStyle` 逐属性对比，**每个组件同时验证 `components.html` 与 `preview/<组件>.html` 两个落点**，共 32 项；
3. **自身样式覆盖**：28 个组件的 markup 里用到的每一个 class，都必须在它自己的预览页里有对应规则——防止登记选择器时漏掉某个变体，让预览静默失去样式；
4. **运行时**：无 JavaScript 错误、无外部网络请求、`tokens.css` 的变量可解析。

最近一次结果：**46 项检查全部通过，样式一致性 32 / 32，0 个 JavaScript 错误，0 个外部请求。**

这套对比是真会失败的——本次开发过程中它先后抓出了「`@font-face` 正则吞掉整张样式表」「JS 源码被当作 CSS 解析」「跨上下文基础规则串台」「`.swatch` 与 `.preview>span` 撞车」「Token 卡片漏登记变体选择器」五个真实缺陷，每一个都会让预览悄悄偏离产品。

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
