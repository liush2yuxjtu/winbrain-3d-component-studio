# WinBrain · OpenCV 视觉比较

打开上一级的 `comparison.html`，可以查看原图 / 修改前 / 修改后，拖动分界线，放大单个区域，切换热图、轮廓图和半透明叠图。

这次进行了 1 次修改前截图和 6 轮修改后截图。最终采用第 6 轮；完整指标记录在 `iterations.json`。中间轮次用于判断取舍，最终交付保留原图、修改前和最终截图。

## 测量结果

| 整页指标 | 修改前 | 修改后 |
|---|---:|---:|
| RGB 平均绝对差 MAE，越低越好 | 26.9475 | 20.5585 |
| σ 3 模糊后的 MAE，越低越好 | 20.0307 | 13.8975 |
| 灰度结构相似度 SSIM，越高越好 | 0.54008 | 0.63675 |
| 双向轮廓距离，像素，越低越好 | 3.191 | 2.464 |

原始像素平均差异相对降低 **23.71%**，模糊后的差异降低 **30.62%**。这表示与修改前相比有所改善，**不是**“还原度 76%”或“已经没有视觉差异”。

## 比较条件

- 参考图和浏览器截图均为 1536 × 1024，设备像素比例 1。
- Chromium，固定初始正交镜头，暂停渲染循环和动画，在独立浏览器上下文中拍摄默认布局。
- 使用 OpenCV 4.12.0.88 和 NumPy 2.2.6。哈希值记录在两个 `*-metrics.json` 中。
- 不对输入图像进行缩放、移动、透视校正、配准或局部遮罩。页面里的模型几何、材料和文字位置才是修改对象。
- MAE：完整原始 RGB 三个通道的绝对差均值，数值范围 0–255。
- SSIM：灰度图，11 × 11 高斯窗口，σ 1.5，常数 C1 = 6.5025、C2 = 58.5225。
- 热图：对两张图分别进行 σ 3 高斯模糊后，计算 RGB 绝对差均值，乘 3 并使用固定 Inferno 色标。前后热图共用同一色标。
- 轮廓：Canny 阈值 50 / 130；双向距离使用 L2 distance transform、3 × 3 掩模，距离截断为 30 px。它衡量轮廓集合接近程度，不代表每个物体都已对齐。
- 区域指标使用固定坐标，区域存在重叠，不能把区域结果相加。

## 复现

从项目根目录（包含 `index.html` 的目录）运行本地页面：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

只重新计算交付截图的差异：

```sh
python3 -m venv .opencv-venv
.opencv-venv/bin/pip install -r visual-diff/requirements.txt
.opencv-venv/bin/python visual-diff/compare.py visual-diff/before.png visual-diff/final.png
```

如果也需要重新截取页面，先安装可选的浏览器测试工具，然后在第二个终端中执行：

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node visual-diff/capture.cjs http://127.0.0.1:8765/ visual-diff/check.png
.opencv-venv/bin/python visual-diff/compare.py visual-diff/check.png
```

若已在其他目录安装 Playwright，可以用 `PLAYWRIGHT_MODULE` 指向其模块路径。新的检查截图会生成独立指标与热图，不会覆盖交付的最终截图。页面本身不依赖 OpenCV 或 Playwright，双击 HTML 即可运行。

## 仍然存在的差异

人物轮廓、建筑排列、树木、玻璃内部反射、局部高光、地球云层与夜景灯点仍是近似。顶部应用屏幕、七个业务对象和各平台均为可编辑模型，首页没有贴上参考图来遮盖这些差异。

原图是一张生成图，没有对应的原始模型、灯光、镜头和字体文件，因此不能从它精确恢复所有细节。不同设备的 GPU、抗锯齿和字体渲染也可能造成少量额外像素差异。数据层仍是当前结构差异最大的区域，可在组件编辑器继续逐件微调。
