// WinBrain UI Design System — component registry.
// This is the structured source of truth for the *interface* layer of the system.
// It documents components that already exist in the shipping pages; it does not invent them.
// Every value below was read from the real stylesheet named in `sources`.
//
// Layers of the whole system:
//   Token layer      -> source/tokens/tokens.js  -> tokens.css
//   Motion layer     -> source/motion/library.js -> motion.html
//   UI layer         -> this file                -> components.html
//   Asset layer      -> source/registry.js       -> catalog.html
//
// Stage kinds:
//   "docs"   the documentation page chrome, position independent
//   "home"   the 1536x1024 homepage scene, components are absolutely placed
//   "studio" the editor chrome, needs the body[data-mode="studio"] context

export const UI_SYSTEM = {
  schema: "winbrain.ui-system/v1",
  version: "1.0.0",
  stages: {
    docs: {
      label: "文档页",
      note: "在 74px 页面头部下的普通内容流里渲染，不需要页面上下文。",
    },
    home: {
      label: "首页场景",
      note: "在 1536 × 1024 的 .scene 内按原坐标绝对定位渲染，预览按比例缩放。",
    },
    studio: {
      label: "编辑器",
      note: "在 body[data-mode=\"studio\"] 的字体与底色上下文中渲染。",
    },
  },
  groups: [
    { id: "navigation", name: "导航", description: "页面之间、视图之间和层之间的移动。" },
    { id: "actions", name: "操作", description: "触发保存、切换、导入和打开。" },
    { id: "forms", name: "表单", description: "数字、颜色、开关和搜索输入。" },
    { id: "surfaces", name: "容器", description: "承载内容的面板、卡片和分区。" },
    { id: "feedback", name: "反馈", description: "结果、状态与阻塞提示。" },
    { id: "display", name: "数据展示", description: "把 Token、资产和预览画成可读的形状。" },
  ],
  components: [
    // ---------------------------------------------------------------- navigation
    {
      id: "page-header",
      name: "Page Header",
      group: "navigation",
      stage: "docs",
      summary: "文档页顶部的 74px 固定头部：品牌、跨页导航、右侧工具。",
      description:
        "tokens.html、catalog.html、motion.html 共用的页面头。左侧是 WinBrain 品牌与页面对照标签，右侧是跨页导航链接。头部 sticky 固定在顶部，滚过长内容时保持可达。catalog.html 的版本不 sticky，其余一致。",
      sources: ["source/build-tokens.mjs", "source/build-motion.mjs", "source/build-catalog.mjs"],
      selectors: ["header", "header strong", "header strong span", "nav", "nav a"],
      variants: [
        { name: "Sticky", useWhen: "长列表页（Tokens、Motion），滚动时导航保持在视口内", selector: "header" },
        { name: "Static", useWhen: "catalog.html，页面较短且希望头部随内容滚走", selector: "header" },
      ],
      props: [
        { property: "height", type: "length", default: "74px", description: "桌面高度；760px 以下改为 min-height:70px 的自动高度。" },
        { property: "padding", type: "length", default: "0 4.5vw", description: "左右内边距随视口宽度变化。" },
        { property: "background", type: "color", default: "#161f2b", description: "比画布 #101720 略亮的实心底，保证滚动时不透出内容。" },
        { property: "z-index", type: "number", default: "5", description: "高于内容，低于 Studio 的 toast（99）。" },
      ],
      states: [
        { state: "Default", visual: "1px #31445f 底边框，品牌字 21px/600，副标签 12px #8da4c4 带左侧分隔线", behavior: "—" },
        { state: "Narrow (≤760px)", visual: "高度自动、内边距 15px 22px，副标签隐藏，导航间距收到 12px", behavior: "换行而非横向滚动" },
      ],
      a11y: {
        role: "banner（原生 header）",
        keyboard: "内部链接按 DOM 顺序 Tab 可达，focus-visible 为 2px accent 描边",
        screenReader: "品牌链接朗读为 “WinBrain”，页面标签作为相邻文本朗读",
      },
      dos: ["品牌区始终链接回 index.html", "跨页导航放右侧，最多 5 项", "副标签只在有意义的页面对照时使用"],
      donts: ["不要在头部内放会改变状态的按钮（用 Studio 的 header-actions）", "不要把 header 高度改到 74px 以下再放两行文字"],
      tokens: [],
      hardcoded: ["#161f2b", "#2c3a4c", "#405372", "#8da4c4", "#aabedb", "74px", "21px", "12px"],
      example: `<header>
  <a href="index.html"><strong>WinBrain<span>DESIGN TOKEN AUDIT</span></strong></a>
  <nav><a href="catalog.html">Assets</a><a href="studio.html">Studio</a></nav>
</header>`,
      markup: `<header><a href="#"><strong>WinBrain<span>DESIGN SYSTEM</span></strong></a><nav><a href="#">Tokens</a><a href="#">Motion</a><a href="#">Assets</a><a href="#">Studio</a></nav></header>`,
    },
    {
      id: "nav-item",
      name: "Nav Item",
      group: "navigation",
      stage: "home",
      summary: "首页顶部的导航按钮，当前项渲染为 25px 圆角胶囊。",
      description:
        "首页 .nav 里的按钮，可带 19px 图标。选中态不是颜色变化而是形状变化：未选中项是透明背景的文字按钮，当前项变成有底色的胶囊。这样在复杂的三维背景上，位置感比颜色更可靠。",
      sources: ["source/shell.html"],
      selectors: [".header", ".nav", ".nav button", ".nav .active", ".icon"],
      variants: [
        { name: "Default", useWhen: "未选中的页面项", selector: ".nav button" },
        { name: "Active", useWhen: "当前页面或当前打开的对话框", selector: ".nav .active" },
      ],
      props: [
        { property: "height", type: "length", default: "40px", description: "按钮高度，图标用 vertical-align:middle 对齐。" },
        { property: "gap", type: "length", default: "34px（导航）/ 10px（图标与文字）", description: "项间距与项内间距是两套值。" },
        { property: "border-radius", type: "length", default: "25px", description: "仅选中态生效。" },
        { property: "aria-pressed / .active", type: "state", default: "—", description: "源码用 class 表达选中，未使用 aria-current。" },
      ],
      states: [
        { state: "Default", visual: "无背景，文字 14px #f4f5f8（继承 body）", behavior: "hover 无背景变化" },
        { state: "Active", visual: "background #282f43，border-radius 25px，min-width 94px 居中，padding 0 24px", behavior: "—" },
        { state: "Focus", visual: "outline 2px #a6d6ff，offset 6px", behavior: "键盘可达" },
      ],
      a11y: {
        role: "button（原生 <button>），容器 nav 带 aria-label",
        keyboard: "Tab 进入，Enter/Space 触发；focus-visible 有 6px 外扩描边以免贴住胶囊边界",
        screenReader: "由文本内容朗读；图标 svg 无 title，不重复朗读",
      },
      dos: ["选中态同时改变形状与背景，避免只靠颜色", "图标统一 19px、stroke 1.4、currentColor"],
      donts: ["不要用 <a> 假装按钮再补 role", "不要在导航项之间混用不同图标尺寸"],
      tokens: [],
      hardcoded: ["#282f43", "#a6d6ff", "25px", "40px", "34px", "19px"],
      example: `<button class="active" data-home>Home</button>
<button data-open="chat"><svg class="icon">…</svg>AI Chat</button>`,
      markup: `<header class="header"><nav class="nav" aria-label="Main navigation"><button class="active" data-home>Home</button><button data-open="chat"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>AI Chat</button><button data-open="data"><svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>Data</button></nav></header>`,
    },
    {
      id: "mode-switch",
      name: "Mode Switch",
      group: "navigation",
      stage: "studio",
      summary: "编辑器里的三段式视图切换：整页构图 / 独立 3D / Mock-3D 对齐。",
      description:
        "互斥的分段控件。未选中项是文字，选中项抬起到 #3a4a64 并带 1px 4px 阴影，用极轻的立面差表达“当前挡位”，而不是用高饱和色。整体容器比按钮深一档（#1c2430 对 #10151d 的页面底）。",
      sources: ["source/editor/studio.css", "source/editor/studio-shell.html"],
      selectors: [".mode-switch", ".mode-switch button", ".mode-switch button.active"],
      variants: [
        { name: "Default", useWhen: "编辑器顶部工具栏", selector: ".mode-switch" },
      ],
      props: [
        { property: "padding", type: "length", default: "4px（容器）/ 7px 12px（按钮）", description: "容器内边距就是胶囊的呼吸空间。" },
        { property: "gap", type: "length", default: "3px", description: "按钮间距，比容器内边距小，形成连续轨道。" },
        { property: "border-radius", type: "length", default: "7px（容器）/ 4px（按钮）", description: "两层圆角不成比例，按钮更方。" },
        { property: "white-space", type: "keyword", default: "nowrap", description: "≤1180px 时收小字号而不换行。" },
      ],
      states: [
        { state: "Default", visual: "按钮 11px #8fa0b6，透明背景", behavior: "hover 继承全局 button:hover 的 #2b394d" },
        { state: "Active", visual: "background #3a4a64，文字 #e6efff，box-shadow 0 1px 4px #0004", behavior: "切换 body[data-view]" },
        { state: "Narrow (≤1180px)", visual: "按钮 padding 收到 7px 6px，字号 10px", behavior: "—" },
      ],
      a11y: {
        role: "无 role=tablist；是三个普通 button，由 class 表达选中",
        keyboard: "Tab 逐个进入，Enter/Space 切换",
        screenReader: "朗读按钮文字；当前挡位没有 aria-selected / aria-pressed 可读",
      },
      dos: ["容器比页面底深或浅一档，让轨道可见", "选中态用立面差 + 轻微阴影，不用高饱和填充"],
      donts: ["不要在同一个 switch 里混放图标项和文字项", "不要把按钮数超过 4 个（已是编辑器宽度的极限）"],
      tokens: [],
      hardcoded: ["#1c2430", "#2c3849", "#3a4a64", "#8fa0b6", "#e6efff", "7px", "4px", "3px"],
      example: `<div class="mode-switch">
  <button data-view="mock">Mock-3D 对齐</button>
  <button data-view="asset" class="active">独立 3D</button>
  <button data-view="page">整页构图</button>
</div>`,
      markup: `<div class="mode-switch"><button data-view="mock">Mock-3D 对齐</button><button data-view="asset" class="active">独立 3D</button><button data-view="page">整页构图</button></div>`,
    },

    // ---------------------------------------------------------------- actions
    {
      id: "explore-button",
      name: "Explore Button",
      group: "actions",
      stage: "home",
      summary: "首页主行动按钮，29px 圆角胶囊，224 × 55。",
      description:
        "首页唯一的主动作。等宽胶囊里文字左对齐、箭头右对齐，中间留白由 space-between 撑开。默认背景 #0b101770 是半透明的，让三维场景透出来；hover 时才升起底色并加一层冷光晕，暗示“可以进入”。",
      sources: ["source/shell.html"],
      selectors: [".explore", ".explore:hover", ".explore .icon"],
      variants: [
        { name: "Default", useWhen: "首页 hero 的“Explore WinBrain”", selector: ".explore" },
      ],
      props: [
        { property: "width / height", type: "length", default: "224px / 55px", description: "固定尺寸，保证在 281px 宽的 hero 栏里不换行。" },
        { property: "border", type: "border", default: "1px solid #919eb0", description: "比文字暗的灰蓝描边，是按钮在暗场景里的主要轮廓。" },
        { property: "border-radius", type: "length", default: "29px", description: "完整胶囊。" },
        { property: "aria-expanded", type: "boolean", default: "false", description: "控制 .controls 视角工具的展开状态。" },
      ],
      states: [
        { state: "Default", visual: "background #0b101770（半透明），1px #919eb0 边框", behavior: "点击展开视角工具" },
        { state: "Hover", visual: "background #25384e，box-shadow 0 0 25px #6599ff30", behavior: "过渡 0.2s" },
        { state: "Focus", visual: "outline 2px #a6d6ff，offset 6px", behavior: "键盘可达" },
      ],
      a11y: {
        role: "button，带 aria-expanded",
        keyboard: "Enter/Space 切换；展开后焦点移到 .controls 内的第一个控件",
        screenReader: "朗读 “Explore WinBrain”，展开状态由 aria-expanded 播报",
      },
      dos: ["保持 aria-expanded 与实际可见性同步", "hover 只加冷光晕，不要改变文字位置"],
      donts: ["不要在同一屏放第二个同权重胶囊按钮", "不要去掉 1px 边框（在三维背景上会失去轮廓）"],
      tokens: ["type.hero.size"],
      hardcoded: ["#919eb0", "#0b101770", "#25384e", "#6599ff30", "29px", "224px", "55px"],
      example: `<button class="explore" data-explore aria-expanded="false">
  Explore WinBrain<svg class="icon">…</svg>
</button>`,
      markup: `<section class="hero"><button class="explore" data-explore aria-expanded="false">Explore WinBrain<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h13M12 5l7 7-7 7"/></svg></button></section>`,
    },
    {
      id: "control-button",
      name: "Control Button",
      group: "actions",
      stage: "home",
      summary: "首页视角工具里的小胶囊按钮，16px 圆角，带 aria-pressed 开关态。",
      description:
        "一组可切换的视图开关（自动旋转、模型线框、暂停光流）。这是全站唯一把“按下”状态写进 aria-pressed 的控件，因此样式规则也直接挂在属性选择器上——状态和语义是同一条规则，不会漂移。",
      sources: ["source/shell.html"],
      selectors: [
        ".controls",
        ".controls p",
        ".control-buttons",
        ".control-buttons button",
        ".control-buttons button:hover",
        '.control-buttons button[aria-pressed="true"]',
      ],
      variants: [
        { name: "Toggle", useWhen: "有开/关两态的视图开关，带 aria-pressed", selector: '.control-buttons button[aria-pressed]' },
        { name: "Action", useWhen: "一次性动作（初始视角、进入编辑器），无 aria-pressed", selector: ".control-buttons button" },
      ],
      props: [
        { property: "padding", type: "length", default: "7px 11px", description: "小尺寸胶囊。" },
        { property: "border-radius", type: "length", default: "16px", description: "对应 tokens.js 里的 radius.control，但该 Token 未导出到 tokens.css。" },
        { property: "border", type: "border", default: "1px solid #a7c3ea2c", description: "约 17% 透明度的冷色描边。" },
        { property: "background", type: "color", default: "#14213460", description: "约 38% 透明度的深蓝，浮在三维场景上方。" },
        { property: "aria-pressed", type: "boolean", default: "false", description: "开/关状态，驱动选中样式。同时存在一个 hover 规则，两条规则共用同一样式块。" },
      ],
      states: [
        { state: "Default", visual: "半透明深蓝底 + 17% 冷色描边，文字 11px #b5c9e1", behavior: "点击切换" },
        { state: "Hover", visual: "与按下态相同：#335da081 底、#fff 字、#a5c6ff80 边", behavior: "过渡 0.2s" },
        { state: "Pressed (aria-pressed=true)", visual: "同 Hover", behavior: "保持到再次点击" },
        { state: "Hidden (父级 .controls)", visual: "父级默认 opacity:0 / visibility:hidden / translateY(6px)", behavior: "Explore 展开或父级 :focus-within 时恢复" },
      ],
      a11y: {
        role: "button，切换型带 aria-pressed",
        keyboard: "Tab 可达；.controls 的 :focus-within 会让隐藏的工具条重新出现，键盘用户不会掉进不可见区域",
        screenReader: "朗读按钮文字与 “pressed / not pressed”",
      },
      dos: ["开/关类开关必须带 aria-pressed 并让样式依赖该属性", "整组开关用 flex-wrap 兜住窄屏"],
      donts: ["不要用 .active class 表达开关状态（同一页面已有两套选中约定）", "不要把 .controls 的隐藏做成 display:none，否则键盘无法唤起"],
      tokens: ["radius.control（未导出）"],
      hardcoded: ["#a7c3ea2c", "#14213460", "#335da081", "#a5c6ff80", "#b5c9e1", "16px"],
      example: `<div class="control-buttons">
  <button id="rotate" aria-pressed="false">自动旋转</button>
</div>`,
      markup: `<div class="controls is-open" style="opacity:1;visibility:visible;transform:none"><p>拖动旋转 · 滚轮缩放<br>点击物体，探索每一层</p><div class="control-buttons"><button>初始视角</button><button aria-pressed="false">自动旋转</button><button aria-pressed="true">模型线框</button><button aria-pressed="false">暂停光流</button></div></div>`,
    },
    {
      id: "primary-button",
      name: "Primary Button",
      group: "actions",
      stage: "studio",
      summary: "编辑器里唯一的高对比实心按钮：“保存并应用到首页”。",
      description:
        "整个系统只有这一处使用亮底深字的反向配色，因此它的稀缺性本身就是层级信号。亮蓝白底 #bad1ff 配深蓝字 #17243b，在 #151c26 的头部里是页面上最亮的一块。",
      sources: ["source/editor/studio.css"],
      selectors: [".primary", ".primary:hover"],
      variants: [
        { name: "Primary", useWhen: "整页只有一个：保存并应用布局", selector: ".primary" },
      ],
      props: [
        { property: "padding", type: "length", default: "10px 15px", description: "比同页次级按钮（9px 4px）更厚。" },
        { property: "border-radius", type: "length", default: "6px", description: "不是 tokens.css 里的任一圆角值。" },
        { property: "font-weight", type: "number", default: "600", description: "同页其他按钮均为默认字重。" },
      ],
      states: [
        { state: "Default", visual: "background #bad1ff，文字 #17243b，1px #d0dfff 边", behavior: "写入 localStorage 并广播" },
        { state: "Hover", visual: "background #d4e3ff", behavior: "—" },
        { state: "Disabled", visual: "opacity 0.45，cursor:wait", behavior: "保存进行中" },
      ],
      a11y: {
        role: "button",
        keyboard: "Enter/Space；保存结果通过 #toast 播报",
        screenReader: "朗读 “保存并应用到首页”；结果用 toast 文本，未使用 aria-live",
      },
      dos: ["每屏只保留一个 .primary", "保存中禁用并改 cursor，避免重复写入"],
      donts: ["不要把 .file-button 也刷成亮底（导入是次级动作）", "不要用 .primary 承载破坏性操作"],
      tokens: [],
      hardcoded: ["#bad1ff", "#17243b", "#d0dfff", "#d4e3ff", "6px"],
      example: `<button class="primary" id="save">保存并应用到首页</button>`,
      markup: `<button class="primary" id="save">保存并应用到首页</button>`,
    },
    {
      id: "secondary-button",
      name: "Secondary Button",
      group: "actions",
      stage: "studio",
      summary: "编辑器的成对操作按钮：导出 JSON / 保存模型 PNG、重置 / 恢复。",
      description:
        "两列等宽网格里的次级按钮。深底 #1e2a3b + 描边，与 .primary 形成明确的层级差。因为成对出现，宽度由 1fr 1fr 决定，不设置各自宽度。",
      sources: ["source/editor/studio.css"],
      selectors: [".two-buttons", ".two-buttons button", ".two-buttons button:hover", ".two-buttons .compact"],
      variants: [
        { name: "Default", useWhen: "成对的次级动作", selector: ".two-buttons button" },
        { name: "Compact", useWhen: "同上但用 <span class=compact> 的只读单元（如“适合窗口”）", selector: ".two-buttons .compact" },
      ],
      props: [
        { property: "grid-template-columns", type: "track-list", default: "1fr 1fr", description: "两列等宽。" },
        { property: "gap", type: "length", default: "7px", description: "与圆角 5px 接近，视觉上不散开。" },
        { property: "padding", type: "length", default: "9px 4px", description: "水平内边距很小，靠 text-align 居中而不是 padding。" },
      ],
      states: [
        { state: "Default", visual: "background #1e2a3b，1px #3b4b62 边，文字 10px #b0c5e1", behavior: "—" },
        { state: "Hover", visual: "background #2d405c", behavior: "过渡 0.12s（继承全局 button）" },
        { state: "Global hover fallback", visual: "未被 .two-buttons button:hover 覆盖时落到全局 button:hover 的 #2b394d", behavior: "两套 hover 值不一致" },
      ],
      a11y: {
        role: "button",
        keyboard: "Tab 顺序与视觉顺序一致",
        screenReader: "由文字朗读；无图标",
      },
      dos: ["成对使用，两列等宽", "文字尽量控制在 6 个汉字以内以适配 4px 水平内边距"],
      donts: ["不要在 .two-buttons 里放超过 2 个按钮", "不要用第 3 套 hover 底色（当前已存在 #2b394d 与 #2d405c 两套）"],
      tokens: [],
      hardcoded: ["#3b4b62", "#1e2a3b", "#2d405c", "#b0c5e1", "#2b394d", "5px", "7px"],
      example: `<div class="two-buttons">
  <button id="export">导出 JSON</button>
  <button id="reset">恢复默认</button>
</div>`,
      markup: `<div class="two-buttons"><button id="export">导出 JSON</button><button id="reset">恢复默认</button></div>`,
    },
    {
      id: "file-button",
      name: "File Button",
      group: "actions",
      stage: "studio",
      summary: "通栏的导入 / 导出按钮，比次级按钮更重一档的蓝底。",
      description:
        "占满检查器宽度的按钮，用于“导入模型”和“导出 GLB”。真实 input[type=file] 被 display:none 藏起，由 label.file-button 代理点击。底色 #253753 是页面里唯一的中饱和蓝面，用来区分“会和文件系统交互”的动作。",
      sources: ["source/editor/studio.css"],
      selectors: [".full-button", ".file-button", ".file-button:hover"],
      variants: [
        { name: "File (label)", useWhen: "代理隐藏的文件选择框", selector: ".file-button" },
        { name: "Full (a/button)", useWhen: "下载或纯动作，不需要文件选择", selector: ".full-button" },
      ],
      props: [
        { property: "width", type: "length", default: "100%", description: "通栏。" },
        { property: "padding", type: "length", default: "9px", description: "比 .two-buttons 更厚，因为只有一列。" },
        { property: "cursor", type: "keyword", default: "pointer", description: "label 代理必须显式设置，否则不显示手型。" },
      ],
      states: [
        { state: "Default", visual: "1px #3d506c 边，圆角 5px；.file-button 另加 #253753 底", behavior: "—" },
        { state: "Hover", visual: "background #30486b", behavior: "仅 .file-button 定义" },
        { state: "Disabled", visual: "继承全局 button:disabled 的 opacity 0.45", behavior: "—" },
      ],
      a11y: {
        role: "label 代理 input[type=file]；.full-button 为 button 或 a",
        keyboard: "label 默认不可 Tab。需由关联控件或外层 button 承担键盘入口",
        screenReader: "朗读 label 文本；隐藏的 input 不可聚焦",
      },
      dos: ["label.file-button 的 for 必须指向被隐藏的 input id", "通栏按钮每列最多 3 个"],
      donts: ["不要把 file-button 和 .primary 并排（两个都抢注意力）", "不要移除 cursor:pointer，否则看起来不可点"],
      tokens: [],
      hardcoded: ["#3d506c", "#253753", "#30486b", "#b9cde8", "5px"],
      example: `<label class="file-button" for="import">导入 GLB / 原生资产</label>
<input id="import" type="file" accept=".glb,.json">`,
      markup: `<label class="file-button" for="import-demo">导入 GLB / 原生资产</label><input id="import-demo" type="file" style="display:none"><a class="full-button" href="#">导出 GLB ↓</a>`,
    },
    {
      id: "text-button",
      name: "Text Button",
      group: "actions",
      stage: "studio",
      summary: "最轻的一档动作：还原颜色、恢复选中组件。",
      description:
        "10px 以下的无边框文字按钮，用于某个字段旁边的“还原”。它不参与层级竞争，只在用户已经决定要撤销时才被找到。",
      sources: ["source/editor/studio.css"],
      selectors: [".text-button", ".color-row button", ".panel-heading button"],
      variants: [
        { name: "Block", useWhen: "独占一行的还原动作", selector: ".text-button" },
        { name: "Inline", useWhen: "跟在颜色选择器后面的“还原”", selector: ".color-row button" },
        { name: "Heading action", useWhen: "分区标题右侧的批量动作", selector: ".panel-heading button" },
      ],
      props: [
        { property: "font-size", type: "length", default: "9px（.text-button / .color-row）", description: "系统里最小的字号档。" },
        { property: "padding", type: "length", default: "4px 6px", description: "带 3px 圆角的 hover 反馈区。" },
      ],
      states: [
        { state: "Default", visual: "无边框无底色，颜色 #91a8c8", behavior: "—" },
        { state: "Hover", visual: "继承全局 button:hover 的 #2b394d 底", behavior: "—" },
      ],
      a11y: {
        role: "button",
        keyboard: "Tab 可达；因字号 9px，是系统里最容易被忽略的可聚焦目标",
        screenReader: "由文字朗读，无 aria-label 补充",
      },
      dos: ["只承载可逆的轻动作", "保持靠近它作用的字段"],
      donts: ["不要用它承载“删除”类不可逆操作", "不要在 9px 字号下只放图标"],
      tokens: [],
      hardcoded: ["#91a8c8", "#2b394d", "9px"],
      example: `<button class="text-button" id="restore-color">还原颜色</button>`,
      markup: `<div class="color-row"><label>组件色<input type="color" value="#9dbeff"></label><button>还原</button></div>`,
    },

    // ---------------------------------------------------------------- forms
    {
      id: "search-field",
      name: "Search Field",
      group: "forms",
      stage: "studio",
      summary: "带前置放大镜的搜索输入，用于过滤组件列表和文档页内容。",
      description:
        "三处用法同构：左手边的放大镜是绝对定位的 <span>，输入框用 padding-left:32px 为它让位。背景比容器再深一档（#0f1722 对 #151c26），让输入区看起来是凹进去的。",
      sources: ["source/editor/studio.css", "source/build-tokens.mjs", "source/build-motion.mjs"],
      selectors: [
        "input[type=\"search\"]",
        "input[type=\"search\"]:focus",
        ".library-search",
        ".library-search > span",
        ".library-search input",
        ".search",
      ],
      variants: [
        { name: "Library (with icon)", useWhen: "编辑器左侧组件库过滤", selector: ".library-search" },
        { name: "Plain", useWhen: "文档页过滤（Tokens / Motion / Catalog）", selector: "input[type=\"search\"]" },
      ],
      props: [
        { property: "border-radius", type: "length", default: "5px（编辑器）/ 6px（文档页）", description: "两处不一致。" },
        { property: "padding", type: "length", default: "8px（编辑器）/ 12px 14px（文档页）", description: "编辑器更紧凑。" },
        { property: "font-size", type: "length", default: "11px（编辑器）/ 12px（文档页）", description: "—" },
      ],
      states: [
        { state: "Default", visual: "1px #323d4d 边，底 #101720，圆角 5px", behavior: "输入即过滤，无提交按钮" },
        { state: "Focus", visual: "边框变 #90b5f6，outline:none", behavior: "文档页另有 2px accent outline" },
        { state: "Empty result", visual: "由页面显示“没有匹配的 Token”空状态", behavior: "—" },
      ],
      a11y: {
        role: "searchbox（input[type=search]）",
        keyboard: "Tab 进入；Escape 在部分浏览器清空",
        screenReader: "编辑器版无 label，仅靠 placeholder；文档页版带 aria-label",
      },
      dos: ["必须有 aria-label 或可见 label", "过滤是即时的，不要加提交按钮"],
      donts: ["不要依赖 placeholder 当唯一标签", "不要在编辑器版和文档页版之间再引入第三种尺寸"],
      tokens: [],
      hardcoded: ["#323d4d", "#101720", "#90b5f6", "#0f1722", "#162232", "#3a4d67", "5px", "6px"],
      example: `<label class="library-search">
  <span>⌕</span>
  <input id="filter" type="search" aria-label="过滤组件" placeholder="过滤组件…">
</label>`,
      markup: `<label class="library-search"><span>⌕</span><input id="filter" type="search" aria-label="过滤组件" placeholder="过滤组件…"></label>`,
    },
    {
      id: "number-field",
      name: "Number Field",
      group: "forms",
      stage: "studio",
      summary: "检查器里的数值输入，等宽数字对齐。",
      description:
        "位置、缩放、旋转都用它。字号 12px 比同页标签（10px）大，因为读数才是用户真正在盯的东西。font-variant-numeric:tabular-nums 让数字在连续微调时不左右跳动。",
      sources: ["source/editor/studio.css"],
      selectors: [
        "input[type=\"number\"]",
        "input[type=\"number\"]:focus",
        ".two-fields",
        ".three-fields",
        ".two-fields label",
        ".three-fields label",
        ".two-fields input",
        ".three-fields input",
        ".wide-field",
        ".wide-field span",
        ".wide-field input",
      ],
      variants: [
        { name: "Two columns", useWhen: "X / Y 这类成对数值", selector: ".two-fields" },
        { name: "Three columns", useWhen: "X / Y / Z 或 SX / SY / SZ", selector: ".three-fields" },
        { name: "Wide", useWhen: "独占一行并带右侧单位说明", selector: ".wide-field" },
      ],
      props: [
        { property: "gap", type: "length", default: "9px（two）/ 7px（three）", description: "列数越多间距越紧。" },
        { property: "padding", type: "length", default: "8px 7px", description: "—" },
        { property: "font-variant-numeric", type: "keyword", default: "tabular-nums", description: "数字等宽，微调时不抖动。" },
      ],
      states: [
        { state: "Default", visual: "1px #323d4d 边，底 #101720，文字 12px #d4e2f6", behavior: "支持方向键步进" },
        { state: "Focus", visual: "边框 #90b5f6，outline:none", behavior: "—" },
        { state: "Label", visual: "10px #7e94b1，位于输入上方 6px", behavior: "点击不聚焦输入（未用 for/id 绑定）" },
      ],
      a11y: {
        role: "spinbutton",
        keyboard: "方向键增减；Tab 在字段间移动",
        screenReader: "编辑器用裸 <label> 包裹但未建立 for/id 关联，部分读屏无法朗读字段名",
      },
      dos: ["数值输入固定用 tabular-nums", "标签放在输入框上方而不是行内"],
      donts: ["不要给数值加 placeholder（默认值应来自真实状态）", "不要在 three-fields 里塞非等宽语义的字段"],
      tokens: [],
      hardcoded: ["#323d4d", "#101720", "#90b5f6", "#d4e2f6", "#7e94b1", "9px", "7px"],
      example: `<div class="three-fields">
  <label>X<input type="number" step="0.1" value="0"></label>
  <label>Y<input type="number" step="0.1" value="0"></label>
  <label>Z<input type="number" step="0.1" value="0"></label>
</div>`,
      markup: `<div class="three-fields"><label>X<input type="number" step="0.1" value="0"></label><label>Y<input type="number" step="0.1" value="0"></label><label>Z<input type="number" step="0.1" value="0"></label></div>`,
    },
    {
      id: "checkbox",
      name: "Checkbox",
      group: "forms",
      stage: "studio",
      summary: "13px 的原生复选框，accent-color 统一为冷蓝。",
      description:
        "没有自绘：直接用系统控件，只用 accent-color:#9ebcff 统一勾选色。尺寸压到 13px 以匹配 10px 的标签文字，避免原生控件在密集检查器里显得过大。",
      sources: ["source/editor/studio.css"],
      selectors: ["input[type=\"checkbox\"]", ".check-row", ".small-check"],
      variants: [
        { name: "Row", useWhen: "分区里的开关行，如“锁定等比缩放”", selector: ".check-row" },
        { name: "Inline small", useWhen: "紧跟在标题后的 9px 小开关", selector: ".small-check" },
      ],
      props: [
        { property: "width / height", type: "length", default: "13px", description: "原生尺寸约 13–16px，此处显式压到 13px。" },
        { property: "accent-color", type: "color", default: "#9ebcff", description: "唯一一处让原生控件继承品牌色的写法。" },
        { property: "margin", type: "length", default: "0", description: "间距交给父级 flex gap。" },
      ],
      states: [
        { state: "Unchecked", visual: "原生空框，系统描边", behavior: "—" },
        { state: "Checked", visual: "填充 #9ebcff", behavior: "立即作用于三维场景" },
        { state: "Focus", visual: "outline 2px，offset 2px", behavior: "键盘可达" },
      ],
      a11y: {
        role: "checkbox",
        keyboard: "Space 切换",
        screenReader: "由 label 文本朗读；已用包裹式 label，关联成立",
      },
      dos: ["用 accent-color 统一品牌色，不要自绘", "包裹式 label 让整行可点"],
      donts: ["不要为了视觉把原生框改成 div", "不要在同一页面使用两种勾选尺寸"],
      tokens: [],
      hardcoded: ["#9ebcff", "13px"],
      example: `<label class="check-row">
  <input type="checkbox" id="lock" checked>锁定等比缩放
</label>`,
      markup: `<label class="check-row"><input type="checkbox" id="lock" checked>锁定等比缩放</label><label class="small-check"><input type="checkbox">显示参考图</label>`,
    },
    {
      id: "color-field",
      name: "Color Field",
      group: "forms",
      stage: "studio",
      summary: "原生取色器，26 × 23，无边框，带同行“还原”。",
      description:
        "组件着色用的原生 input[type=color]。刻意去掉边框和内边距，让色块本身就是控件；右侧固定一个 9px 的“还原”文字按钮，构成“改—撤”的完整闭环。",
      sources: ["source/editor/studio.css"],
      selectors: [".color-row", ".color-row label", ".color-row input", ".color-row button"],
      variants: [
        { name: "Row", useWhen: "检查器的“组件色”一行", selector: ".color-row" },
      ],
      props: [
        { property: "width / height", type: "length", default: "26px / 23px", description: "比原生默认更窄，需要显式设置。" },
        { property: "border / padding", type: "keyword", default: "0 / 0", description: "完全去掉，靠色块本身当控件。" },
        { property: "justify-content", type: "keyword", default: "space-between", description: "标签靠左，还原按钮靠右。" },
      ],
      states: [
        { state: "Default", visual: "裸色块 + 左侧 10px 标签", behavior: "点击打开系统取色器" },
        { state: "Changed", visual: "无独立视觉反馈；改动由左侧列表的 .changed 圆点统一表达", behavior: "实时改材质颜色" },
      ],
      a11y: {
        role: "原生 color input",
        keyboard: "Enter 打开系统取色器，方向键调值",
        screenReader: "由包裹式 label 朗读“组件色”",
      },
      dos: ["改动反馈统一交给组件列表的 .changed 圆点", "始终并排放一个还原入口"],
      donts: ["不要在同一个检查器里放多个取色器（当前只允许一个组件色）", "不要给色块加边框和圆角（会与原生控件边缘冲突）"],
      tokens: [],
      hardcoded: ["26px", "23px"],
      example: `<div class="color-row">
  <label>组件色<input type="color" id="tint" value="#9dbeff"></label>
  <button id="clear-tint">还原</button>
</div>`,
      markup: `<div class="color-row"><label>组件色<input type="color" value="#9dbeff"></label><button>还原</button></div>`,
    },
    {
      id: "nudge-pad",
      name: "Nudge Pad",
      group: "forms",
      stage: "studio",
      summary: "方向键步进键盘，1 / 10 / 0.1 像素三档。",
      description:
        "十字排列的微调控件：上下左右四个方向键，中间显示当前步长。步长由键盘修饰键决定（默认 1px，Shift 10px，Alt 0.1px），界面上的按钮与快捷键是同一条规则的两种入口。",
      sources: ["source/editor/studio.css"],
      selectors: [".nudge-pad", ".nudge-pad > div", ".nudge-pad span", ".nudge-pad button"],
      variants: [
        { name: "Default", useWhen: "Mock-3D 对齐模式下的位置微调", selector: ".nudge-pad" },
      ],
      props: [
        { property: "gap", type: "length", default: "3px", description: "两级 gap（行内 3px、行间 3px）。" },
        { property: "button size", type: "length", default: "30px × 23px", description: "比高度更宽，因为箭头字形偏窄。" },
        { property: "step display", type: "length", default: "33px 宽，9px monospace", description: "固定宽度避免步长数字变化时整行位移。" },
      ],
      states: [
        { state: "Default", visual: "1px #38485e 边，圆角 4px，文字 #b7cae5", behavior: "每次点击移动一个步长" },
        { state: "Hover", visual: "继承全局 button:hover 的 #2b394d", behavior: "需长按重复，无连发实现" },
        { state: "Step readout", visual: "中间 9px monospace，如 “1 px”", behavior: "随修饰键改变" },
      ],
      a11y: {
        role: "四个 button + 一个只读读数",
        keyboard: "按钮 Tab 可达；画布本身支持方向键，这是冗余入口",
        screenReader: "按钮用箭头字符，未提供 aria-label，读屏会朗读字形名",
      },
      dos: ["读数区固定宽度", "步长档位与键盘修饰键保持一致：1 / 10 / 0.1"],
      donts: ["不要给箭头按钮用图标字体（当前是文本箭头）", "不要让读数随步长变化而改变行高"],
      tokens: [],
      hardcoded: ["#38485e", "#b7cae5", "#7d92ae", "30px", "23px", "33px", "4px"],
      example: `<div class="nudge-pad">
  <div><button data-nudge="up">↑</button></div>
  <div><button data-nudge="left">←</button><span>1 px</span><button data-nudge="right">→</button></div>
  <div><button data-nudge="down">↓</button></div>
</div>`,
      markup: `<div class="nudge-pad"><div><button>↑</button></div><div><button>←</button><span>1 px</span><button>→</button></div><div><button>↓</button></div></div>`,
    },

    // ---------------------------------------------------------------- surfaces
    {
      id: "token-card",
      name: "Token Card",
      group: "surfaces",
      stage: "docs",
      summary: "Token 审计页的卡片，左预览右元数据的两栏结构。",
      description:
        "整个系统里 token 采用率最高的组件：外框、底、圆角都走 var(--wb-*)。左侧 108px 的预览栏固定，右侧自适应，因此不同长度的值名和值都不会撑破栅格。",
      sources: ["source/build-tokens.mjs"],
      selectors: [
        ".grid",
        ".token-card",
        ".preview",
        ".token-copy",
        ".token-meta",
        ".token-card h2",
        ".value-row",
        ".value-row code",
        ".copy",
        ".css-name",
        ".usage",
        ".usage strong",
        ".usage a",
        ".usage a:hover",
        // The two preview variants are part of this card; without them listed here the
        // card's own preview box renders unstyled in a per-component scope.
        ".swatch",
        ".metric-preview",
        ".metric-preview i",
      ],
      variants: [
        { name: "Color", useWhen: "type=color，左侧显示 62px 圆形色板", selector: ".swatch" },
        { name: "Metric", useWhen: "尺寸、数值、弧度等非颜色 Token", selector: ".metric-preview" },
      ],
      props: [
        { property: "grid-template-columns", type: "track-list", default: "108px 1fr", description: "预览列固定，内容列自适应；430px 以下改为单列。" },
        { property: "border / background / border-radius", type: "token", default: "var(--wb-color-border) / var(--wb-color-panel) / var(--wb-radius-card)", description: "本组件是 token 采用率的正面样本。" },
        { property: "min-height", type: "length", default: "174px", description: "保证同排卡片等高。" },
      ],
      states: [
        { state: "Default", visual: "1px 边框 + #182434 底 + 9px 圆角", behavior: "—" },
        { state: "Filtered out", visual: "由 [hidden] 规则 display:none 移除", behavior: "搜索或分类不匹配" },
        { state: "Copy", visual: "点击“复制”后按钮文字变为“已复制”，1200ms 后还原为“复制”", behavior: "写入剪贴板；失败时文字改为“选择值复制”，同样 1200ms 后还原" },
      ],
      a11y: {
        role: "article",
        keyboard: "复制按钮 Tab 可达；USED BY 链接可跳转到使用方",
        screenReader: "标题朗读为 Token id；复制按钮有 aria-label",
      },
      dos: ["预览列固定宽度，让多张卡片纵向对齐", "USED BY 必须给出真实的跳转目标"],
      donts: ["不要让值文本撑破右列（需 overflow-wrap:anywhere）", "不要在卡片里放超过两类元数据"],
      tokens: ["color.border", "color.panel", "radius.card", "type.body.size"],
      hardcoded: ["#0e1723", "#2c405a", "#142133", "#0f1926", "#2d4058", "#58718f", "108px", "174px"],
      example: `<article class="token-card">
  <div class="preview"><span class="swatch" style="--swatch:#67CCFF"></span></div>
  <div class="token-copy">
    <div class="token-meta"><span>Color</span><code>color</code></div>
    <h2>color.accent</h2>
    <div class="value-row"><code>#67CCFF</code><button class="copy">复制</button></div>
  </div>
</article>`,
      markup: `<div class="grid"><article class="token-card"><div class="preview"><span class="swatch" style="--swatch:#67CCFF"></span></div><div class="token-copy"><div class="token-meta"><span>Color</span><code>color</code></div><h2>color.accent</h2><div class="value-row"><code>#67CCFF</code><button class="copy" data-copy="#67CCFF">复制</button></div><p class="css-name">--wb-color-accent</p><div class="usage"><strong>USED BY</strong><a href="#">app.chat</a><a href="#">app.workbench</a></div></div></article><article class="token-card"><div class="preview"><span class="metric-preview"><i style="width:72px"></i></span></div><div class="token-copy"><div class="token-meta"><span>Spacing</span><code>dimension</code></div><h2>space.24</h2><div class="value-row"><code>24px</code><button class="copy" data-copy="24px">复制</button></div><p class="css-name">--wb-space-24</p><div class="usage"><strong>USED BY</strong><a href="#">catalog</a><a href="#">studio</a></div></div></article></div>`,
    },
    {
      id: "asset-card",
      name: "Asset Card",
      group: "surfaces",
      stage: "docs",
      summary: "资产总览页的卡片：预览图、ID、名称、版本徽标与三组外链。",
      description:
        "catalog.html 的主卡片。悬停时边框变亮并整体上移 2px，是系统里唯一使用位移反馈的卡片。卡片底部用一条分隔线把“打开方式”和“下载”分成两块。",
      sources: ["source/build-catalog.mjs"],
      selectors: [
        ".grid",
        "article",
        "article:hover",
        ".preview img",
        ".preview>span",
        ".card-body",
        ".component-id",
        "h3",
        "h3 b",
        ".open-links",
        ".open-links a:hover",
        ".asset-links",
        ".asset-links a:hover",
      ],
      variants: [
        { name: "With motion", useWhen: "资产有 Motion Behavior 时额外给出跳转链接", selector: ".open-links .motion-link" },
        { name: "Plain", useWhen: "无 Motion 的静态资产", selector: ".open-links" },
      ],
      props: [
        { property: "border-radius", type: "length", default: "9px", description: "等于 --wb-radius-card，但此处写死。" },
        { property: "background", type: "color", default: "#182434", description: "等于 --wb-color-panel，但此处写死。" },
        { property: "transition", type: "time", default: "border-color .15s, transform .15s", description: "悬停抬升 2px。" },
      ],
      states: [
        { state: "Default", visual: "1px #31445f 边（= --wb-color-border）", behavior: "—" },
        { state: "Hover", visual: "border-color #7197ca，transform translateY(-2px)", behavior: "0.15s 过渡" },
        { state: "Filtered out", visual: "[hidden] 移除；整节若无匹配则整节隐藏", behavior: "搜索过滤" },
      ],
      a11y: {
        role: "article；预览图是可点的 <a>",
        keyboard: "每张卡内约 7 个链接依次 Tab 可达；卡片本身不可聚焦",
        screenReader: "预览图有中文 alt；ID 与名称分两处朗读",
      },
      dos: ["预览图必须带描述性 alt", "下载链接统一放在底部分隔线以下"],
      donts: ["不要让整卡可点同时又保留内部 7 个链接（点击区会互相抢夺）"],
      tokens: ["color.border", "color.panel", "radius.card"],
      hardcoded: ["#31445f", "#182434", "#7197ca", "#0e1723", "9px"],
      example: `<article data-search="app.chat AI Chat">
  <a class="preview" href="studio.html?component=app.chat&amp;view=asset">
    <img src="previews/app.chat.png" alt="AI Chat的代码生成模型预览" loading="lazy">
    <span>3D · 可旋转</span>
  </a>
  <div class="card-body">
    <span class="component-id">app.chat</span>
    <h3>AI Chat<b>V5</b></h3>
    <div class="open-links"><a href="…">独立 3D ↗</a></div>
    <div class="asset-links"><a href="assets/app.chat.glb" download>GLB 资产 ↓</a></div>
  </div>
</article>`,
      markup: `<div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><article><a class="preview" href="#"><img src="previews/platform.application.png" alt="应用层平台的代码生成模型预览"><span>3D · 可旋转</span></a><div class="card-body"><span class="component-id">platform.application</span><h3>应用层平台<b>V5</b></h3><div class="open-links"><a href="#">Mock-3D 对齐 ↗</a><a href="#">独立 3D ↗</a></div><div class="asset-links"><a href="#">GLB 资产 ↓</a><a href="#">原生资产 ↓</a><a href="#">3D PNG ↓</a></div></div></article><article><a class="preview" href="#"><img src="previews/actor.ai-agents.png" alt="AI 机器人的代码生成模型预览"><span>3D · 可旋转</span></a><div class="card-body"><span class="component-id">actor.ai-agents</span><h3>AI 机器人<b>V5</b></h3><div class="open-links"><a href="#">独立 3D ↗</a><a class="motion-link" href="#">Motion · robot.idle ↗</a></div><div class="asset-links"><a href="#">GLB 资产 ↓</a><a href="#">原生资产 ↓</a></div></div></article></div>`,
    },
    {
      id: "motion-card",
      name: "Motion Card",
      group: "surfaces",
      stage: "docs",
      summary: "Motion 库的行为卡：左侧动画预览，右侧 Primitive / Trigger / Token 关系。",
      description:
        "用纯 CSS 动画复现行为本身的预览（浮动、沿路径、上升、环绕），左侧 180px 是动画舞台，右侧是结构化关系。这样做的好处是预览不依赖 three.js，文档页可以离线打开。",
      sources: ["source/build-motion.mjs"],
      selectors: [
        ".behavior-grid",
        ".motion-card",
        ".motion-preview",
        ".motion-preview.robot i",
        ".motion-preview.robot b",
        ".motion-preview.packet:before",
        ".motion-preview.packet i",
        ".motion-preview.rise:before",
        ".motion-preview.rise:after",
        ".motion-preview.rise i",
        ".motion-preview.rise b",
        ".motion-preview.orbit:before",
        ".motion-preview.orbit b",
        ".motion-preview.orbit i",
        ".motion-copy",
        ".motion-copy h2",
        ".motion-copy p",
        "dl",
        "dl div",
        "dt",
        "dd",
        ".token-links",
        ".token-links strong",
        ".token-links a",
        ".usage a",
        "footer",
        "footer a",
      ],
      variants: [
        { name: "robot", useWhen: "actor.ai-agents 的上下浮动", selector: ".motion-preview.robot" },
        { name: "packet", useWhen: "structure.connections 的沿路径光点", selector: ".motion-preview.packet" },
        { name: "rise", useWhen: "world.atmosphere 的上升数据点", selector: ".motion-preview.rise" },
        { name: "orbit", useWhen: "camera.auto-orbit 的环绕", selector: ".motion-preview.orbit" },
      ],
      props: [
        { property: "grid-template-columns", type: "track-list", default: "180px 1fr", description: "500px 以下改为单列，预览缩到 145px 高。" },
        { property: "min-height (preview)", type: "length", default: "250px", description: "保证四种预览高度一致。" },
        { property: "border-radius", type: "length", default: "10px", description: "10px 不在任何圆角 Token 里，是孤值。" },
      ],
      states: [
        { state: "Running", visual: "四个 @keyframes：bob / packet / rise / orbit", behavior: "无限循环" },
        { state: "Reduced motion", visual: "@media (prefers-reduced-motion:reduce) 下 animation:none", behavior: "动画全部停止" },
        { state: "Filtered out", visual: "[hidden] 移除", behavior: "搜索过滤" },
      ],
      a11y: {
        role: "article；预览区带 aria-hidden=\"true\"",
        keyboard: "卡片内的 Token 与资产链接 Tab 可达",
        screenReader: "预览被显式排除，只朗读 id、描述、Primitive、Trigger 与关系",
      },
      dos: ["预览区必须 aria-hidden，避免装饰性动画进入读屏", "必须实现 prefers-reduced-motion 降级"],
      donts: ["不要让预览依赖在线资源或 three.js", "不要给预览加声音或自动播放"],
      tokens: [],
      hardcoded: ["#31445f", "#182434", "#0d1723", "#2d415d", "#121d2b", "#c7daf3", "10px", "180px", "250px"],
      example: `<article class="motion-card">
  <div class="motion-preview orbit" aria-hidden="true"><i></i><b></b></div>
  <div class="motion-copy">
    <div class="eyebrow">Camera / BEHAVIOR</div>
    <h2>camera.auto-orbit</h2>
    <p>用户开启自动旋转后，相机围绕组织世界缓慢旋转。</p>
    <dl><div><dt>Primitive</dt><dd>orbitYaw</dd></div><div><dt>Trigger</dt><dd>ui.auto-rotate</dd></div></dl>
  </div>
</article>`,
      markup: `<div class="behavior-grid" style="grid-template-columns:1fr"><article class="motion-card"><div class="motion-preview orbit" aria-hidden="true"><i></i><b></b></div><div class="motion-copy"><div class="eyebrow">Camera / BEHAVIOR</div><h2>camera.auto-orbit</h2><p>用户开启自动旋转后，相机围绕组织世界缓慢旋转。</p><dl><div><dt>Primitive</dt><dd>orbitYaw</dd></div><div><dt>Trigger</dt><dd>ui.auto-rotate</dd></div></dl><div class="token-links"><strong>TOKENS</strong><a href="#">motion.speed.camera-orbit</a></div><div class="usage"><strong>USED BY</strong><a href="#">home.reference-view ↗</a></div></div></article><article class="motion-card"><div class="motion-preview packet" aria-hidden="true"><i></i></div><div class="motion-copy"><div class="eyebrow">Data Flow / BEHAVIOR</div><h2>connection.packet-flow</h2><p>协作层光点沿项目、专家、AI Agent 与员工之间的曲线循环移动。</p><dl><div><dt>Primitive</dt><dd>followPath</dd></div><div><dt>Trigger</dt><dd>ambient.loop</dd></div></dl><div class="token-links"><strong>TOKENS</strong><a href="#">motion.speed.packet-progress</a></div><div class="usage"><strong>USED BY</strong><a href="#">structure.connections ↗</a></div></div></article></div>`,
    },
    {
      id: "small-card",
      name: "Small Card",
      group: "surfaces",
      stage: "docs",
      summary: "四列栅格里的最小信息卡：Primitive、Motion Token、Trigger。",
      description:
        "和 token-card 同类但更矮更密，用于四列排布。顶部一个 9px 的 kind 标签声明卡片类型，中间是 id，下面是一句描述或一个读数。",
      sources: ["source/build-motion.mjs"],
      selectors: [".small-grid", ".small-card", ".small-card h3", ".small-card code", ".small-card p", ".kind", ".metric", ".metric b", ".metric span", ".mini-links", ".mini-links a"],
      variants: [
        { name: "Primitive", useWhen: "描述一个最小运动积木及其通道", selector: ".small-card" },
        { name: "Motion Token", useWhen: "展示一个运动数值与单位", selector: ".metric" },
        { name: "Trigger", useWhen: "描述一个启动条件", selector: ".small-card" },
      ],
      props: [
        { property: "min-height", type: "length", default: "150px", description: "保证四列等高。" },
        { property: "padding", type: "length", default: "16px", description: "—" },
        { property: "border-radius", type: "length", default: "9px", description: "等于 --wb-radius-card。" },
      ],
      states: [
        { state: "Default", visual: "1px #31445f 边 + #182434 底", behavior: "—" },
        { state: "Narrow", visual: "≤1100px 两列，≤500px 单列", behavior: "—" },
      ],
      a11y: {
        role: "article",
        keyboard: "内部 mini-links 可 Tab",
        screenReader: "kind 标签是纯文本，会与标题连续朗读",
      },
      dos: ["同一排卡片保持等高", "kind 标签用 9px 大写字母间距 1.4px"],
      donts: ["不要在 small-card 里嵌超过三级标题", "不要把长段落放进四列卡"],
      tokens: [],
      hardcoded: ["#31445f", "#182434", "#9bb9df", "#d8e9ff", "150px", "9px"],
      example: `<article class="small-card">
  <span class="kind">PRIMITIVE</span>
  <h3>followPath</h3>
  <code>position.xyz</code>
  <p>沿 Curve 的 0–1 进度循环移动。</p>
</article>`,
      markup: `<div class="small-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><article class="small-card"><span class="kind">PRIMITIVE</span><h3>followPath</h3><code>position.xyz</code><p>沿 Curve 的 0–1 进度循环移动。</p></article><article class="small-card"><span class="kind">MOTION TOKEN · SPEED</span><h3>motion.speed.packet-progress</h3><div class="metric"><b>0.16</b><span>path/s</span></div></article><article class="small-card"><span class="kind">TRIGGER</span><h3>ui.auto-rotate</h3><p>用户点击自动旋转按钮后启停。</p></article></div>`,
    },
    {
      id: "component-list-item",
      name: "Component List Item",
      group: "surfaces",
      stage: "studio",
      summary: "编辑器左侧组件列表的一行：图标、名称、改动圆点与版本号。",
      description:
        "一行里压缩了四类信息：家族图标（按 family 换色）、名称、是否被改过（金色 4px 圆点）、以及资产版本。选中态用左侧 2px 内阴影条 + 底色，而不是整行高亮，因为列表项很密。",
      sources: ["source/editor/studio.css"],
      selectors: [
        "#component-list",
        ".library-category",
        ".component-item",
        ".component-item.active",
        ".component-item:hover",
        ".component-glyph",
        ".component-item[data-family=\"actor\"] .component-glyph",
        ".component-item[data-family=\"data\"] .component-glyph",
        ".component-item .edit-dot",
        ".component-item.changed .edit-dot",
        ".component-item .item-version",
      ],
      variants: [
        { name: "Application family", useWhen: "应用层组件，图标 #91b9f6", selector: ".component-glyph" },
        { name: "Actor family", useWhen: "智能角色，图标 #bb9ff5", selector: '.component-item[data-family="actor"] .component-glyph' },
        { name: "Data family", useWhen: "业务对象，图标 #9cbec7", selector: '.component-item[data-family="data"] .component-glyph' },
        { name: "Changed", useWhen: "该组件已被编辑过，显示金色圆点", selector: ".component-item.changed" },
      ],
      props: [
        { property: "padding", type: "length", default: "9px 10px", description: "行高 21px 图标 + 上下各 9px。" },
        { property: "border-radius", type: "length", default: "5px", description: "选中底色用 5px 圆角。" },
        { property: "margin", type: "length", default: "2px 0", description: "相邻行之间留 4px 视觉缝。" },
      ],
      states: [
        { state: "Default", visual: "透明底，文字 11px #c0ccdd", behavior: "点击选中组件" },
        { state: "Hover", visual: "background #223148", behavior: "—" },
        { state: "Active", visual: "background #293d5c，文字 #e8f1ff，inset 2px 0 #b0ceff 左侧条", behavior: "绑定检查器" },
        { state: "Changed", visual: "右侧 4px 金色圆点 opacity 从 0 变 1", behavior: "保存后清除" },
      ],
      a11y: {
        role: "button（宽 100% 的 <button>）",
        keyboard: "Tab 逐行；方向键未接管",
        screenReader: "朗读名称；版本号 .item-version 是相邻文本会被一并读出；改动状态无文本替代",
      },
      dos: ["改动状态用圆点而不是改变整行颜色", "按 family 给图标换色，让类别在密集列表里可扫"],
      donts: ["不要用颜色深浅表达选中（已有左侧条承担）", "不要让版本徽标和改动圆点同时占位（都用 margin-left:auto）"],
      tokens: [],
      hardcoded: ["#293d5c", "#b0ceff", "#223148", "#c0ccdd", "#ccab69", "#91b9f6", "#bb9ff5", "#9cbec7", "5px", "21px"],
      example: `<button class="component-item active" data-family="actor" data-id="actor.experts">
  <span class="component-glyph">◆</span>专家
  <span class="edit-dot"></span>
</button>`,
      markup: `<div id="component-list" style="padding:0"><div class="library-category"><span>智能角色</span><span>4</span></div><button class="component-item" data-family="actor"><span class="component-glyph">◆</span>项目团队</button><button class="component-item active changed" data-family="actor"><span class="component-glyph">◆</span>专家<span class="edit-dot"></span></button><button class="component-item" data-family="data"><span class="component-glyph">▣</span>Documents<span class="item-version">V5</span></button></div>`,
    },
    {
      id: "explore-layer-card",
      name: "Layer Card",
      group: "surfaces",
      stage: "home",
      summary: "首页右侧的三张层卡：应用层 / 智能中枢 / 数据底座。",
      description:
        "竖直堆叠的三张卡，每张左侧有一条 1px 竖线和一个小圆点。卡片本身没有背景，靠这条线把三层串成一个序列；选中和悬停时用 drop-shadow 发光而不是换底色，这样不会遮住后面的三维场景。",
      sources: ["source/shell.html"],
      selectors: [
        ".layers",
        ".layer",
        ".layer:before",
        '.layer[data-layer="3"]',
        '.layer[data-layer="2"]',
        '.layer[data-layer="1"]',
        ".layer-heading",
        ".layer-number",
        ".layer h2",
        ".layer .copy",
        ".layer p",
        ".layer ul",
        ".layer:hover",
        ".layer.selected",
      ],
      variants: [
        { name: "Application (03)", useWhen: "顶层，应用与行动", selector: '.layer[data-layer="3"]' },
        { name: "Intelligence (02)", useWhen: "中层，人与智能体协作", selector: '.layer[data-layer="2"]' },
        { name: "Data (01)", useWhen: "底层，业务数字孪生", selector: '.layer[data-layer="1"]' },
      ],
      props: [
        { property: "position", type: "keyword", default: "absolute，left:1256px top:134px 的 .layers 内", description: "三张卡各自 top：0 / 246px / 525px。" },
        { property: "border-left", type: "border", default: "1px solid #778294", description: "序列的主轴。" },
        { property: "padding-left", type: "length", default: "19px", description: "文字与轴线的距离。" },
      ],
      states: [
        { state: "Default", visual: "无底色，左侧 1px 轴线 + 5px 圆点，filter 无", behavior: "点击选中该层" },
        { state: "Hover", visual: "filter:drop-shadow(0 0 7px #91c9ff80)，轴线变 #b7e5ff", behavior: "0.2s 过渡" },
        { state: "Selected", visual: "与 Hover 相同规则（.layer:hover,.layer.selected 共用）", behavior: "联动 .platform-label 与 dialog" },
        { state: "Focus", visual: "tabindex=0 + role=button，浏览器默认焦点环", behavior: "键盘可达" },
      ],
      a11y: {
        role: 'section + role="button" + aria-label="Explore Application Layer"',
        keyboard: "tabindex=0，可 Tab 进入；但未处理 Enter/Space，键盘无法真正激活",
        screenReader: "由 aria-label 朗读；内部 h2 与 li 仍会被朗读，存在重复",
      },
      dos: ["用发光而非底色表达选中，避免遮住背后的三维内容", "序号用 03 / 02 / 01 从上层往底层递减"],
      donts: ["不要给 role=button 却不实现键盘激活", "不要把三张卡的间距改成等距（当前 246 / 525 是按三维平台高度对齐的）"],
      tokens: ["layer.application.y", "layer.intelligence.y", "layer.data.y（对应三维高度，不是屏幕坐标）"],
      hardcoded: ["#778294", "#d5dced", "#91c9ff80", "#b7e5ff", "19px", "5px"],
      example: `<aside class="layers">
  <section class="layer" data-layer="3" tabindex="0" role="button" aria-label="Explore Application Layer">
    <div class="layer-heading"><span class="layer-number">03</span><h2>Application Layer</h2></div>
    <div class="copy"><p>Human-AI interaction and<br>business action.</p></div>
  </section>
</aside>`,
      markup: `<div style="position:relative;width:100%;height:100%"><aside class="layers" style="left:20px;top:20px"><section class="layer" data-layer="3" tabindex="0" role="button" aria-label="Explore Application Layer"><div class="layer-heading"><span class="layer-number">03</span><h2>Application Layer</h2></div><div class="copy"><p>Human-AI interaction and<br>business action.</p></div></section><section class="layer" data-layer="2" tabindex="0" role="button" aria-label="Explore Intelligence Hub"><div class="layer-heading"><span class="layer-number">02</span><h2>Intelligence Hub</h2></div><div class="copy"><p>People, agents and knowledge<br>working together.</p><ul><li>Projects</li><li>Experts</li></ul></div></section></aside></div>`,
    },

    // ---------------------------------------------------------------- feedback
    {
      id: "toast",
      name: "Toast",
      group: "feedback",
      stage: "studio",
      summary: "底部居中的一次性结果提示，唯一的亮底深字大面积反馈。",
      description:
        "固定定位在底部 28px，从下方 15px 处滑入。因为它出现在深色编辑器上，用了反向配色（亮蓝白底 + 深蓝字）来保证在缩略图旁边也一眼可见。没有自动消失逻辑，由调用方显式移除。",
      sources: ["source/editor/studio.css"],
      selectors: ["#toast", "#toast.show"],
      variants: [
        { name: "Default", useWhen: "保存成功、导出完成、导入失败等一次性消息", selector: "#toast" },
      ],
      props: [
        { property: "bottom / left", type: "length", default: "28px / 50%", description: "水平居中，垂直距底 28px。" },
        { property: "max-width", type: "length", default: "70vw", description: "防止长错误信息横向铺满。" },
        { property: "pointer-events", type: "keyword", default: "none", description: "不可交互，不挡住下面的控件。" },
        { property: "transition", type: "time", default: "0.18s", description: "位移 + 透明度同时过渡。" },
      ],
      states: [
        { state: "Hidden", visual: "opacity 0，translate(-50%,15px)，pointer-events:none", behavior: "不占交互" },
        { state: "Shown (.show)", visual: "opacity 1，translate(-50%,0)", behavior: "由脚本加 class" },
      ],
      a11y: {
        role: "无 role=\"status\" 或 aria-live",
        keyboard: "不可聚焦",
        screenReader: "文本变化不会被主动播报，读屏用户可能完全收不到保存结果",
      },
      dos: ["必须由调用方给出明确的失败原因", "保持 pointer-events:none，不要在 toast 上放按钮"],
      donts: ["不要用它承载需要用户决策的内容（该用 dialog）", "不要自动消失时间过短（当前无自动消失）"],
      tokens: [],
      hardcoded: ["#c2d7fa", "#16243a", "#0007", "28px", "7px", "70vw"],
      example: `<div id="toast" role="status"></div>
<script>toast.textContent = "已保存并应用到首页"; toast.classList.add("show");</script>`,
      markup: `<div id="toast" class="show" style="position:static;transform:none;opacity:1;margin:0 auto">已保存并应用到首页</div>`,
    },
    {
      id: "dialog",
      name: "Dialog",
      group: "feedback",
      stage: "home",
      summary: "首页的层详情对话框，20px 圆角 + 模糊遮罩。",
      description:
        "原生 <dialog>，用 showModal() 打开。背景是 150° 的深蓝渐变而不是纯色，配合 backdrop-filter 的模糊遮罩，在三维场景上方形成明确的“层”感。内容区用一个两列按钮栅格列出该层的对象。",
      sources: ["source/shell.html"],
      selectors: [
        "dialog",
        "dialog::backdrop",
        "dialog h2",
        "dialog p",
        ".close",
        ".close:hover",
        ".dialog-list",
        ".dialog-list button",
        ".dialog-list button:hover",
        ".search-input",
        ".dialog-note",
        ".empty",
        ".eyebrow",
      ],
      variants: [
        { name: "Layer detail", useWhen: "点击层卡或平台标签后展示该层对象", selector: "dialog" },
        { name: "Search", useWhen: "顶部搜索按钮打开，含 .search-input 与结果列表", selector: ".search-input" },
      ],
      props: [
        { property: "width", type: "length", default: "min(560px, calc(100vw - 32px))", description: "窄屏时保留 32px 安全边距。" },
        { property: "border-radius", type: "length", default: "20px", description: "等于 tokens.js 的 radius.dialog，但此处写死。" },
        { property: "padding", type: "length", default: "30px", description: "标题右侧留 32px 给关闭按钮。" },
        { property: "::backdrop", type: "keyword", default: "background #02070cc4 + backdrop-filter blur(8px)", description: "模糊三维场景以聚焦内容。" },
      ],
      states: [
        { state: "Closed", visual: "不渲染", behavior: "—" },
        { state: "Open", visual: "渐变底 + 20px 圆角 + 大范围投影 0 20px 120px #000b", behavior: "showModal() 后焦点进入" },
        { state: "Close hover", visual: "background #ffffff15，8px 圆角", behavior: "点击关闭" },
        { state: "Empty results", visual: ".empty 显示 #b6c5d9 的说明文字", behavior: "搜索无结果" },
      ],
      a11y: {
        role: "dialog（原生 showModal 自带 modal 语义）",
        keyboard: "Escape 关闭（原生）；关闭按钮可 Tab；焦点陷阱由浏览器提供",
        screenReader: "由 aria-labelledby 指向标题；关闭按钮有 aria-label",
      },
      dos: ["用原生 showModal() 获得焦点陷阱与 Escape", "关闭按钮必须带 aria-label"],
      donts: ["不要手写 div 模态（会丢掉原生语义）", "不要在 backdrop 上用纯不透明黑（会切断与三维场景的联系）"],
      tokens: ["radius.dialog"],
      hardcoded: ["#1c293f", "#0d1522", "#64738e", "#02070cc4", "#59779866", "#bed8ff08", "#a2c9ff20", "#7188a7", "20px", "560px"],
      example: `<dialog id="details" aria-labelledby="dialog-title">
  <button class="close" aria-label="Close dialog">×</button>
  <span class="eyebrow">WINBRAIN WORLD</span>
  <h2 id="dialog-title">Application Layer</h2>
  <div class="dialog-list"><button>AI Chat</button><button>Business Workbench</button></div>
</dialog>`,
      markup: `<div style="position:relative;background:#07101b;padding:24px;border-radius:12px"><span class="eyebrow">WINBRAIN WORLD</span><h2 style="font-size:25px;margin:5px 32px 12px 0">Application Layer</h2><p style="color:#b6c5d9;line-height:1.6;margin:0 0 8px">Human-AI interaction and business action.</p><div class="dialog-list"><button>AI Chat</button><button>Business Workbench</button><button>Apps &amp; Integrations</button><button>Real Impact</button></div><p class="dialog-note" style="color:#b6c5d9;font-size:12px">点击对象查看它在三维世界中的位置。</p></div>`,
    },
    {
      id: "status-dot",
      name: "Status Dot",
      group: "feedback",
      stage: "studio",
      summary: "5px 绿色圆点，表示运行时状态正常。",
      description:
        "编辑器左下角的一枚 5px 圆点，和一行 10px 说明文字构成状态行。尺寸小到必须紧贴文字才读得出来，因此用 display:inline-block + margin-right:6px 固定在文本基线前。",
      sources: ["source/editor/studio.css"],
      selectors: [".library-footer", ".status-dot", ".muted", ".field-note", ".asset-state", ".stage-footer"],
      variants: [
        { name: "Live", useWhen: "运行时正常，绿点 #85c1a7", selector: ".status-dot" },
        { name: "Asset state", useWhen: "当前组件替换了本地资产时，用带边框的信息块替代单点", selector: ".asset-state" },
      ],
      props: [
        { property: "width / height", type: "length", default: "5px", description: "系统里最小的图形元素。" },
        { property: "background", type: "color", default: "#85c1a7", description: "唯一的绿色，只用于“正常”。" },
        { property: "display", type: "keyword", default: "inline-block", description: "为了让圆点跟文字同一行。" },
      ],
      states: [
        { state: "Live", visual: "绿点 + #8395ab 的 10px 文字", behavior: "—" },
        { state: "Replaced asset", visual: ".asset-state 换成 1px #344a69 边框的 5px 圆角信息块", behavior: "显示替换后的资产名" },
      ],
      a11y: {
        role: "无；是装饰性图形",
        keyboard: "不可聚焦",
        screenReader: "没有文本替代，颜色是唯一的状态载体",
      },
      dos: ["必须搭配邻近文字说明，不能只留一个点", "绿色只表示正常，不要复用到其他地方"],
      donts: ["不要把颜色当成唯一的状态信号（当前读屏收不到）", "不要放大到超过 8px（会和列表圆点混淆）"],
      tokens: [],
      hardcoded: ["#85c1a7", "#8395ab", "#1c2a3d", "#344a69", "#aec6e8", "5px"],
      example: `<footer class="library-footer">
  <span class="status-dot"></span>22 个组件已注册
</footer>`,
      markup: `<div class="library-footer" style="border-top:0"><span class="status-dot"></span>22 个组件已注册，布局保存在本机浏览器</div><div class="asset-state" style="margin-top:10px">本地资产：custom-robot.glb</div>`,
    },
    {
      id: "badge",
      name: "Badge",
      group: "feedback",
      stage: "docs",
      summary: "表示版本号或类型的小描边标签：V5、PRIMITIVE、10px monospace。",
      description:
        "三种用法共享同一套视觉：细描边、极小字号、monospace。它们标记的是“这不是正文”——版本号告诉用户资产迭代到第几版，kind 标签告诉用户卡片类型。",
      sources: ["source/build-catalog.mjs", "source/editor/studio.css", "source/build-motion.mjs"],
      selectors: ["h3 b", ".version-tag", ".component-item .item-version", ".kind", ".stage-eyebrow"],
      variants: [
        { name: "Version", useWhen: "资产卡片标题右侧的 V4 / V5 / V6", selector: "h3 b" },
        { name: "Studio version", useWhen: "编辑器头部的资产规格版本", selector: ".version-tag" },
        { name: "List version", useWhen: "组件列表行右侧的紧凑版本号", selector: ".component-item .item-version" },
        { name: "Kind", useWhen: "卡片顶部的类型声明（大写 + 1.4px 字距）", selector: ".kind" },
      ],
      props: [
        { property: "font", type: "font", default: "9px monospace（列表/卡片）/ 10px monospace（头部）", description: "统一用 monospace，与正文的 sans 拉开。" },
        { property: "border-radius", type: "length", default: "3px（列表）/ 4px（头部）", description: "两处不一致。" },
        { property: "letter-spacing", type: "length", default: "1.4px（.kind）/ 1px（.version-tag）", description: "大写字母需要额外字距。" },
      ],
      states: [
        { state: "Default", visual: "透明底 + 1px 描边 + 冷蓝文字", behavior: "—" },
        { state: "Kind (no border)", visual: ".kind 无描边，仅 9px #7fa6d9 大写文字", behavior: "—" },
      ],
      a11y: {
        role: "无（span）",
        keyboard: "不可聚焦",
        screenReader: "作为相邻文本朗读，如“应用层平台 V5”，语义可接受",
      },
      dos: ["版本号用 monospace，与正文区分", "同一页面只用一种徽标尺寸"],
      donts: ["不要把徽标做成可点击（当前它只承载信息）", "不要用徽标承载状态（状态交给 status-dot / toast）"],
      tokens: [],
      hardcoded: ["#6081af", "#a9ccfa", "#365071", "#99b9e9", "#637c9b", "#b8cff5", "#7fa6d9", "9px", "10px"],
      example: `<h3>AI Chat<b>V5</b></h3>
<span class="version-tag">ASSET V4 · 22 GLB</span>`,
      markup: `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="version-tag">ASSET V4 · 22 GLB</span><h3 style="margin:0">AI Chat<b>V5</b></h3><span class="kind">PRIMITIVE</span></div>`,
    },

    // ---------------------------------------------------------------- display
    {
      id: "swatch",
      name: "Swatch",
      group: "display",
      stage: "docs",
      summary: "62px 圆形色板，用来把 Token 值变成可判断的颜色。",
      description:
        "颜色 Token 的专用预览。圆形而不是方形，是为了和右边矩形的 metric-preview 在缩略图层面就能区分开。色值通过内联的 --swatch 自定义属性注入，因此同一个组件能渲染任意颜色而不需要为每个 Token 生成一条 CSS。",
      sources: ["source/build-tokens.mjs"],
      selectors: [".swatch", ".metric-preview", ".metric-preview i"],
      variants: [
        { name: "Color", useWhen: "type=color 的 Token", selector: ".swatch" },
        { name: "Metric", useWhen: "数值型 Token，用一条发光横条示意量级", selector: ".metric-preview" },
      ],
      props: [
        { property: "--swatch", type: "color", default: "—", description: "由卡片内联注入，是该组件唯一的输入。" },
        { property: "width / height", type: "length", default: "62px", description: "圆形直径。" },
        { property: "border", type: "border", default: "1px solid #ffffff4a", description: "约 29% 白描边，保证深色和浅色都能看清边界。" },
        { property: "box-shadow", type: "shadow", default: "0 9px 30px #0007", description: "向下投影，把色板从底面上抬起来。" },
      ],
      states: [
        { state: "Default", visual: "圆形填充 + 半透明白描边 + 投影", behavior: "—" },
        { state: "Metric variant", visual: "74px 方形，1px #344d6d 边，10px 圆角，内部横条渐变 #5989cb → #8fd9ff", behavior: "横条宽度由数值映射" },
      ],
      a11y: {
        role: "无（装饰）",
        keyboard: "不可聚焦",
        screenReader: "不带文本替代；颜色值由旁边的 <code> 提供，信息不丢失",
      },
      dos: ["色板只做视觉提示，值必须同时以文本给出", "描边要半透明白，兼顾极亮和极暗色"],
      donts: ["不要把色板做成可点击的取色入口（审计页是只读的）", "不要在 metric 变体里用颜色表达数值大小"],
      tokens: ["color.*（被展示对象）"],
      hardcoded: ["#ffffff4a", "#0007", "#344d6d", "#142133", "#5989cb", "#8fd9ff", "#68b7ff77"],
      example: `<span class="swatch" style="--swatch:#67CCFF"></span>
<span class="metric-preview"><i style="width:72px"></i></span>`,
      markup: `<div style="display:flex;gap:26px;align-items:center;background:#0e1723;padding:24px;border-radius:9px"><span class="swatch" style="--swatch:#67CCFF"></span><span class="swatch" style="--swatch:#365A95"></span><span class="metric-preview"><i style="width:72px"></i></span></div>`,
    },
    {
      id: "filter-chip",
      name: "Filter Chip",
      group: "display",
      stage: "docs",
      summary: "Token 审计页的分类筛选胶囊，选中态填实。",
      description:
        "一组互斥的分类筛选钮。和首页 control-button 是同一形态（16px 圆角胶囊）但不同语义：这里用 .active class 表达唯一选中，而首页用 aria-pressed。两处圆角值相同，说明 16px 事实上是这个系统的“胶囊档”。",
      sources: ["source/build-tokens.mjs"],
      selectors: [".filters", ".filters button", ".filters button.active", ".tools", ".search"],
      variants: [
        { name: "Default", useWhen: "未选中的分类", selector: ".filters button" },
        { name: "Active", useWhen: "唯一选中的分类；再点“全部”可复位", selector: ".filters button.active" },
      ],
      props: [
        { property: "border-radius", type: "length", default: "16px", description: "与首页 .control-buttons button 相同，等于未导出的 radius.control。" },
        { property: "padding", type: "length", default: "7px 11px", description: "与首页控制按钮完全一致。" },
        { property: "font-size", type: "length", default: "10px", description: "比首页的 11px 小一档。" },
      ],
      states: [
        { state: "Default", visual: "1px #38506d 边，底 #162232，文字 #91a9c9", behavior: "点击切换分类" },
        { state: "Active", visual: "底 #315986，文字 white，边 #77a8e6", behavior: "与搜索框叠加过滤" },
        { state: "Focus", visual: "outline 2px var(--wb-color-accent)，offset 3px", behavior: "键盘可达" },
      ],
      a11y: {
        role: "容器 role=\"group\" + aria-label=\"Token 分类\"",
        keyboard: "Tab 逐个；Enter/Space 切换",
        screenReader: "朗读分类名；当前选中没有 aria-pressed / aria-current",
      },
      dos: ["第一个胶囊固定为“全部”，提供复位入口", "与搜索框组合时用 flex-wrap 兜住窄屏"],
      donts: ["不要与搜索框抢占同一行宽度（窄屏要转成纵向）", "不要给分类胶囊加图标"],
      tokens: [],
      hardcoded: ["#38506d", "#162232", "#91a9c9", "#315986", "#77a8e6", "16px"],
      example: `<div class="filters" role="group" aria-label="Token 分类">
  <button class="active" data-group-filter="全部">全部</button>
  <button data-group-filter="Color">Color</button>
</div>`,
      markup: `<div class="filters" role="group" aria-label="Token 分类"><button class="active" data-group-filter="全部">全部</button><button data-group-filter="Color">Color</button><button data-group-filter="Typography">Typography</button><button data-group-filter="Spacing">Spacing</button><button data-group-filter="3D Material">3D Material</button><button data-group-filter="Camera">Camera</button></div>`,
    },
    {
      id: "eyebrow",
      name: "Eyebrow",
      group: "display",
      stage: "docs",
      static: true,
      summary: "正文上方的 9–11px 小标签，用字距和大写标出层级。",
      description:
        "四套写法（.eyebrow / .stage-eyebrow / .kind / .token-meta）服务同一个角色：在大标题上方给出一行分类信息。它们字号都在 9–11px、都靠 letter-spacing 撑开，但字距和颜色各不相同。这是系统里命名最不一致的一组。",
      sources: ["source/shell.html", "source/editor/studio.css", "source/build-tokens.mjs", "source/build-motion.mjs"],
      selectors: [".eyebrow", ".stage-eyebrow", ".kind", ".token-meta", ".token-meta code"],
      variants: [
        { name: "Page eyebrow", useWhen: "文档页大标题上方，11px / 字距 2px", selector: ".eyebrow" },
        { name: "Hero eyebrow", useWhen: "Tokens 页介绍区，10px / 字距 2px / #90b3e4", selector: ".eyebrow" },
        { name: "Stage eyebrow", useWhen: "编辑器舞台标题上方，9px / 字距 1.5px", selector: ".stage-eyebrow" },
        { name: "Kind", useWhen: "卡片类型声明，9px / 字距 1.4px", selector: ".kind" },
        { name: "Token meta", useWhen: "Token 卡片顶部，9px 无字距，两端对齐", selector: ".token-meta" },
      ],
      props: [
        { property: "font-size", type: "length", default: "9px / 10px / 11px", description: "三档并存，未收敛。" },
        { property: "letter-spacing", type: "length", default: "1.4px / 1.5px / 2px", description: "三档并存。" },
        { property: "color", type: "color", default: "#7fa6d9 / #90b3e4 / #9ac9ff / #738baa / #7694ba", description: "五种蓝色。" },
      ],
      states: [
        { state: "Default", visual: "静态文本", behavior: "—" },
      ],
      a11y: {
        role: "无",
        keyboard: "不可聚焦",
        screenReader: "作为标题前的文本朗读，无额外语义",
      },
      dos: ["统一使用大写英文 + 字距", "一行只表达一个维度（分类 / 层 / 类型）"],
      donts: ["不要新增第五种写法（已有四种）", "不要把 eyebrow 用在正文中间"],
      tokens: [],
      hardcoded: ["#7fa6d9", "#90b3e4", "#9ac9ff", "#738baa", "#7694ba", "#667f9f", "9px", "10px", "11px"],
      example: `<span class="eyebrow">DESIGN SYSTEM / SHARED SOURCE OF TRUTH</span>
<h1>Tokens 把重复的设计规则变成统一旋钮。</h1>`,
      markup: `<div style="display:grid;gap:16px"><div><span class="eyebrow">DESIGN SYSTEM / SHARED SOURCE OF TRUTH</span><h1 style="font-size:28px;margin:10px 0 0">Page eyebrow · 11px / 2px</h1></div><div><span class="stage-eyebrow">STAGE EYEBROW</span><h1 style="font-size:20px;margin:7px 0 0">Stage eyebrow · 9px / 1.5px</h1></div><div><span class="kind">PRIMITIVE</span><h3 style="margin:8px 0 0">Kind · 9px / 1.4px</h3></div></div>`,
    },
    {
      id: "platform-label",
      name: "Platform Label",
      group: "display",
      stage: "home",
      summary: "跟随三维平台的世界空间标签，带板号和层级。",
      description:
        "三块玻璃平台各有一个跟随标签，位置由 three.js 投影到屏幕坐标后写进 --label-x / --label-y。背景是从左到右淡出的半透明渐变（不是均匀填充），这样标签左端有底色、右端融进三维场景，不会切出一条硬边。",
      sources: ["source/shell.html", "source/home.js"],
      // Markup is built in home.js; every style comes from the homepage stylesheet.
      cssSources: ["source/shell.html"],
      selectors: [
        "#spatial-labels",
        ".platform-label",
        ".platform-label:hover",
        ".platform-label.selected",
        ".platform-label .plate-number",
        ".platform-label strong",
        ".platform-label small",
        '.platform-label[data-level="3"]',
        '.platform-label[data-level="2"]',
        '.platform-label[data-level="1"]',
        ".hint",
        ".hint.show",
      ],
      variants: [
        { name: "Application (data-level=3)", useWhen: "顶层平台标签", selector: '.platform-label[data-level="3"]' },
        { name: "Intelligence (data-level=2)", useWhen: "中层平台标签", selector: '.platform-label[data-level="2"]' },
        { name: "Data (data-level=1)", useWhen: "底层平台标签，额外旋转 4° 以贴合倾斜的平台", selector: '.platform-label[data-level="1"]' },
      ],
      props: [
        { property: "--label-x / --label-y", type: "length", default: "0px", description: "由 three.js 投影结果驱动，是唯一的定位输入。" },
        { property: "min-width", type: "length", default: "525px", description: "三块标签统一宽度，保证板号与标题竖直对齐。" },
        { property: "background", type: "gradient", default: "linear-gradient(110deg,#35466d88,#36497650 60%,#31426600)", description: "右端透明收尾。" },
        { property: "border-radius", type: "length", default: "19px", description: "等于 --wb-radius-panel。" },
        { property: "transform", type: "transform", default: "translate3d(var(--label-x),var(--label-y),0) translate(-50%,-50%)", description: "以锚点为中心；data-level=1 额外 rotate(4deg)，原点 12% 50%。" },
      ],
      states: [
        { state: "Default", visual: "渐变底 + 1px #b5d5ff08 边 + 极淡外发光", behavior: "点击选中该层" },
        { state: "Hover / Selected", visual: "background #486baba3（两态共用）", behavior: "联动 dialog 与层卡" },
        { state: "Hint", visual: ".hint 默认 opacity 0，#a8d7ff 12px，.show 时出现", behavior: "提示可交互" },
      ],
      a11y: {
        role: "button（由 home.js 创建 <button>，带 aria-label=\"Explore …\"）",
        keyboard: "Tab 可达，Enter/Space 触发",
        screenReader: "由 aria-label 朗读，内部板号与标题作为可见文本补充",
      },
      dos: ["用渐变收尾而不是硬边矩形", "三块标签共用 min-width，保证板号列对齐"],
      donts: ["不要给标签加 backdrop-filter（源码已显式设为 none，模糊会让三维平台失焦）", "不要让标签宽度随内容变化"],
      tokens: ["radius.panel"],
      hardcoded: ["#35466d88", "#36497650", "#31426600", "#b5d5ff08", "#486baba3", "#f7f8ff", "525px", "19px"],
      example: `<button class="platform-label" data-level="2" aria-label="Explore Intelligence Hub"
        style="--label-x:700px;--label-y:430px">
  <span class="plate-number">02</span>
  <span><strong>Intelligence Hub</strong><small>Projects · Experts · AI Agents</small></span>
</button>`,
      markup: `<div style="position:relative;height:230px;background:radial-gradient(ellipse at 50% 120%,#1b2d47 0,transparent 60%),#070c12;border-radius:10px;overflow:hidden"><button class="platform-label" data-level="2" aria-label="Explore Intelligence Hub" style="--label-x:50%;--label-y:50%"><span class="plate-number">02</span><span><strong>Intelligence Hub</strong><small>Projects · Experts · AI Agents · Employees</small></span></button></div>`,
    },
  ],
};

export const COMPONENT_GROUPS = UI_SYSTEM.groups;
export const UI_COMPONENTS = UI_SYSTEM.components;
