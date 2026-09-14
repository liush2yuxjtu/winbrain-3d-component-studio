# WinBrain 组件交接

这个世界由 22 个独立组件组成。首页与编辑器使用同一套模型工厂；修改模型源文件后，两边会一起更新。每个组件也已导出独立 GLB、原生资产和实际渲染的 PNG 预览。

| 类别 | 组件 | 源文件 |
|---|---|---|
| 平台与结构 | 三块玻璃平台、支撑柱、协作光路 | `source/components/platforms.js`、`columns.js`、`connections.js` |
| 应用屏幕 | AI Chat、Business Workbench、Apps & Integrations | `source/components/applications.js` |
| 智能角色 | 项目团队、专家、AI 机器人、员工团队 | `source/components/actors.js`、`people.js`、`robot.js`、`badges.js` |
| 业务对象 | 企业城市，以及 People、Documents、Tasks、Business Data、Systems、Devices、External Data | `source/components/city.js`、`data-objects.js`、`business-models.js` |
| 世界环境 | 地球、星光与薄雾 | `source/components/earth.js`、`atmosphere.js` |

`source/registry.js` 为每个组件提供稳定 ID、独立变换、材质编辑、资产替换和保存。`source/editor/studio.js` 管理预览与像素对齐。`source/core.js` 提供相机、灯光、材质和通用几何体。`source/home.js` 管理首页交互。页面文字和导航在 `source/shell.html` 中。

## 对齐坐标

- 参考画布固定为 1536 × 1024。
- Mock-3D 固定相机，不允许镜头转动影响对齐结果。独立 3D 模式可以自由旋转。
- X 向右为正，Y 向下为正。位置字段是相对默认布局的偏移量。
- 在该正交相机下，1 个参考像素等于 `14 / 1024` 个场景单位。水平和垂直位移分别沿参考相机的右向量和上向量计算。
- 自动缩放仅改变观看倍率。100% 时，一个原图像素对应一个画布 CSS 像素。
- 组件的 `referenceRect` 是原图上的对照裁切区域，不是自动识别出的物体边界。
- GLB 和原生文件保存局部模型。页面里的位置、旋转和大小保存在独立布局配置中。

## 应用与业务模型 V4

`applications.js` 管理三个有厚度的玻璃屏幕。屏幕内的小面板、柱状图、圆形仪表及五个应用图标块是独立几何，文字为透明画布贴图。`source/assets/app-icons.js` 包含四个品牌图标，来源详见 `BRAND-ASSETS.md`。

`business-models.js` 分别提供 People、Documents、Tasks、Business Data、Systems、Devices、External Data 的模型工厂及展台工厂。`data-objects.js` 保留稳定组件 ID、原图坐标、标签及页面位置。`exhibit-geometry.js` 提供真实挤出、圆角、倒角与表面工具。云由平滑合并的隐式曲面生成后烘焙成普通网格，GLB 不依赖自定义云着色器。

这 10 个组件在目录中标为 V4。独立 3D 默认相机增加侧面角度；Mock-3D 仍使用原有校准镜头，1 / 10 / 0.1 像素位移规则保持一致。

## OpenCV 校准后的模型

- 平台采用带圆角和倒角的真实挤出网格。宽度、左右高度和后侧轮廓根据原图调整；浅后侧形状是模型本身的一部分，在独立 3D 中同样可见。
- 平台表面与侧壁使用代码绘制的反射纹理。它们没有引用原图像素。
- 角色标签保持固定参考相机的左右对齐规则；导出 GLB 时保留非居中标签的偏移。
- 业务底座增加金属顶面和绿化，人物躯干使用连续旋转曲面，地球新增柔和的大气渐变。
- `visual-diff/compare.py` 保存比较方法；`comparison.html` 读取交付时的指标和截图。对照工具不会改写组件布局。

## 之前已做的模型编辑

- 机器人换成 V2：独立外壳、面罩边缘、耳部零件、颈环、手臂、手掌和胸前指示灯。
- 四类角色使用不同的几何徽章，并按原图调整了徽章高度。
- AI Chat 面板调整了位置，并按原图的像素比例重画标题、图标、输入区域和按钮间距。
- 城市保留高细节合并几何用于页面显示；导出时使用可复用的基本几何，减少资产体积。

## 资产格式

`assets/catalog.json` 列出全部组件的 ID、源文件、参考裁切框，以及 GLB、原生资产和预览地址。

- **GLB**：独立、可移植的静态模型，贴图内嵌。可导入其他支持 GLB 的三维工具。发光效果仍受目标工具的灯光设置影响。
- **`.wb3d.json`**：Three.js 原生对象，保留程序材质、Sprite 标签和地球着色器。可重新导入本编辑器。
- **3D PNG**：`previews/组件ID.png`，从可见侧面的独立模型相机渲染。
- **Mock-3D PNG**：`previews/mock-组件ID.png`，固定参考镜头、使用参考裁切坐标；不含参考图。

地球的 GLB 使用代码绘制的近似材质，因为标准 GLB 不直接保存这里使用的自定义地形与大气着色器。完整程序材质在原生资产和网页中。场景灯光、泛光、粒子运动和自动旋转由网页提供，静态模型文件不包含这些页面行为。

本次创建的是可独立编辑的浏览器三维重建。原图中的摄影级玻璃折射、城市细节和地球云层没有对应的原始模型数据，因此仍有视觉差异。像素对齐工具提供精确位置控制，不代表所有模型已经和原图逐像素相同。
