# WinBrain Component Studio

一个用代码建模的三维组织世界，以及逐组件编辑、替换和对齐工具。V4 根据原图截图和 OpenCV 差异结果，继续修正了构图、玻璃平台、文字、模型材料和地球。

## 在线查看

- **三维首页：** https://liush2yuxjtu.github.io/winbrain-3d-component-studio/
- **原图差异对照：** https://liush2yuxjtu.github.io/winbrain-3d-component-studio/comparison.html
- **组件编辑器：** https://liush2yuxjtu.github.io/winbrain-3d-component-studio/studio.html
- **22 个资产总览：** https://liush2yuxjtu.github.io/winbrain-3d-component-studio/catalog.html

GitHub 源码：https://github.com/liush2yuxjtu/winbrain-3d-component-studio

## 在本机打开

- **原图差异对照：** http://127.0.0.1:8765/comparison.html
- **组件编辑器：** http://127.0.0.1:8765/studio.html
- **22 个资产总览：** http://127.0.0.1:8765/catalog.html
- **三维首页：** http://127.0.0.1:8765/index.html

本机如已启动预览服务，可直接打开上面的 `127.0.0.1` 地址。首页与编辑器的运行依赖都嵌入 HTML，无需连接网络。原始参考图只在编辑器中用作对照；首页没有使用参考图作为背景、贴图或模型。

如果重新打开项目，在本目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

也可以直接双击 `index.html` 或 `studio.html` 预览。要使用“保存并应用到首页”和跨页面同步，请使用同一个浏览器里的本地 HTTP 地址。

## V4 · OpenCV 对照修正

- 以 1536 × 1024、固定原始镜头，完成修改前截图和 6 轮修改后比较。
- 修正平台宽度、倾斜、后侧深度、透明度与反光，调整数字和标题对齐。
- 提高应用屏幕亮度，补充底部反射；调整角色文案位置、人物颜色和躯干。
- 为业务底座补充金属顶面和绿化，提高微缩城市密度，调整地球弧度、位置和柔光。
- 首页初始画面收起视角工具，点击 **Explore WinBrain** 可展开；编辑器和差异报告仍可从工具区进入。
- 22 个 GLB、22 个原生模型和 44 张预览已随本次源码重新导出。

整页原始像素平均差异从 **26.9475 降至 20.5585（降低 23.71%）**；灰度 SSIM 从 **0.54008 升至 0.63675**。仍有明显局部差异，这些指标不能解释为还原百分比。点击 `comparison.html` 可查看分区结果、叠图、热图和轮廓图。复现方法见 `visual-diff/README.md`。

## V3 · 应用屏幕与业务对象

- 应用屏幕改成有厚度和倒角的玻璃外框。输入框、按钮、工作台小面板、柱状图和图标块采用独立几何。
- Apps & Integrations 使用 Slack、GitHub、Notion、Lark 的官方图标，内嵌离线运行，来源见 `BRAND-ASSETS.md`。
- 业务对象重做成立体模型：浮雕头像、真实折角文件、凸起勾选、实体数据库圆柱、服务器抽屉与接口、笔记本键盘和转轴，以及整体圆润的云。
- 资产总览默认显示能看见侧面的 3D 预览。每个组件同时提供固定原图镜头的 Mock-3D PNG 和像素编辑入口。

## 怎么使用

1. 从左侧选择一个组件。
2. 选择预览模式：**整页构图**看全景，**独立 3D**旋转检查模型，**Mock-3D 对齐**锁定原图镜头。
3. 用右侧字段调整位置、大小、角度和颜色。也可以导入 GLB / `.wb3d.json` 替换模型，或从内置组件库选一个模型。
4. 点击 **保存并应用到首页**。同一浏览器内已打开的首页会同步更新。

Mock-3D 支持参考图叠加、透明度、差值显示、网格、100%–800% 显示倍率，以及临时显示原图。位置可以拖动，也可以按方向键调整：默认 **1 px**，按住 Shift 为 **10 px**，按住 Alt 为 **0.1 px**。按住空格查看原图，按 F 适合窗口。

“保存模型 PNG”只导出渲染画面，不带参考图和编辑工具。

## 保存与交付

- 布局保存在当前浏览器的本地存储中；导入的模型保存在本地 IndexedDB 中。
- “导出 JSON”保存位置、大小、角度、颜色、显示状态和资产引用。换浏览器或交给别人时，请把自己导入的模型文件一起交付；遇到缺失模型，编辑器会提示重新导入。
- 页面内的保存不会自动改写磁盘上的源代码。要固定到项目源码，可修改对应模型工厂，或在 `buildWorld()` 之后用 `applyConfig()` 加载导出的布局配置。
- 原始模型随时可以恢复；整页默认布局也可还原。修改只有点击保存后才会同步到首页。

## 文件

| 文件 | 用途 |
|---|---|
| `index.html` | 可独立运行的三维首页 |
| `studio.html` | 可独立运行的组件编辑器，内嵌参考图 |
| `catalog.html` | 22 个组件的预览、编辑入口和下载入口 |
| `assets/` | 22 个 GLB、22 个原生资产、目录和参考图 |
| `previews/` | 22 张侧面可见的 3D 预览 + 22 张固定参考镜头的 Mock-3D 预览 |
| `source/` | 拆分后的模型工厂、组件注册表、页面和编辑器源代码 |
| `COMPONENTS.md` | 组件清单、坐标约定与资产格式说明 |
| `verification.json` | 自动化检查结果 |
| `comparison.html` | 原图 / 修改前 / 修改后交互对照与分区指标 |
| `visual-diff/` | 固定尺寸截图、OpenCV 热图与轮廓图、测量脚本和复现说明 |
| `winbrain-components-final.png` | 当前三维首页截图 |
| `studio-alignment.png` | 组件与原图叠加对齐截图 |
| `studio-asset-view.png` | 独立三维模型预览截图 |
| `studio-apps-3d.png` | 新版 Apps & Integrations 独立三维预览 |
| `studio-business-object.png` | 新版笔记本业务对象独立三维预览 |
| `studio-screen-alignment.png` | AI Chat 面板的对齐截图 |
| `studio-composition.png` | 编辑器内整页构图截图 |
| `asset-library.png` | 资产总览截图 |
| `apps-and-objects-3d.png` | 本次重做的 10 个模型总览 |
| `reference-comparison.png` | 原图 / 修改前 / 修改后总览，展示图缩小，计算使用原始像素 |
| `BRAND-ASSETS.md` | 真实应用图标的来源与嵌入说明 |

## 修改代码后重新生成页面

在 `source/` 目录中运行：

```sh
npm ci
npm run build
```

构建脚本会生成上一层的 `index.html`、`studio.html` 和 `catalog.html`。模型源文件修改后，网页会使用新模型。现有 GLB 和 PNG 是交付时的快照；修改后可在编辑器重新导出对应模型和预览。

运行时无需访问在线模型、在线字体或远程贴图。四个品牌图标已内嵌，其他纹理由代码生成。Three.js 与字体的许可证随项目提供，品牌素材来源单独记录。

## 已验证与当前差异

33 项检查全部通过。自动化检查覆盖全部 22 个 GLB 的实际加载、精确像素位移、单组件材质隔离、等比缩放、模型旋转、参考图与差值显示、GLB 导出与回导、刷新后恢复、同步到首页、1024 像素宽度，以及直接打开本地编辑器。运行检查没有发现 JavaScript 错误或外部网络依赖。

仍有视觉差异：这是浏览器中的代码模型，玻璃折射、微缩城市和地球表面无法从一张生成图中反推出完全相同的原始模型与灯光。地球 GLB 采用近似材质，原生资产保留程序材质。详见 `COMPONENTS.md`。
