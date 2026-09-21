"""Real-runtime verification for the design system's UI pages.

This does not check that the pages "exist". It drives a real browser over HTTP and checks
the claim the system makes: every preview renders the *shipping* stylesheets, so a
component's computed style there must equal the computed style on the page it ships on.

    python3 -m http.server 8791 --bind 127.0.0.1     # separate terminal
    python3 source/review/verify-design-system.py --port 8791

Writes design-system-verification.json and screenshots under design-system-review/.
Exits non-zero on any failed check.
"""
from pathlib import Path
import argparse
import json
import sys

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
shots = root / 'design-system-review'

# (label, page the component ships on, selector there, registry id, selector in the preview)
PARITY = [
    ('首页 · 视角控制按钮', 'index.html', '.control-buttons button', 'control-button', '.control-buttons button'),
    ('首页 · Explore 主按钮', 'index.html', '.explore', 'explore-button', '.explore'),
    ('首页 · 层卡标题', 'index.html', '.layer[data-layer="2"] h2', 'explore-layer-card', '.layer[data-layer="2"] h2'),
    ('首页 · 导航选中项', 'index.html', '.nav .active', 'nav-item', '.nav .active'),
    ('编辑器 · 视图切换选中', 'studio.html', '.mode-switch button.active', 'mode-switch', '.mode-switch button.active'),
    ('编辑器 · 主按钮', 'studio.html', '.primary', 'primary-button', '.primary'),
    ('编辑器 · 成对按钮', 'studio.html', '.two-buttons button', 'secondary-button', '.two-buttons button'),
    ('编辑器 · 组件列表选中行', 'studio.html', '.component-item.active', 'component-list-item', '.component-item.active'),
    ('编辑器 · 文件按钮', 'studio.html', '.file-button', 'file-button', '.file-button'),
    ('资产总览 · 卡片', 'catalog.html', 'article', 'asset-card', 'article'),
    ('Token 审计 · 分类胶囊选中', 'tokens.html', '.filters button.active', 'filter-chip', '.filters button.active'),
    ('Token 审计 · Token 卡片', 'tokens.html', '.token-card', 'token-card', '.token-card'),
    # A swatch paints whatever --swatch is injected, so both sides must name the same
    # token: color.accent (#67CCFF) on the audit page and in the preview stage.
    ('Token 审计 · 色板', 'tokens.html', '#token-color-accent .swatch', 'swatch', '.swatch'),
    # The audit page's swatch and the asset library's `.preview>span` both style a span
    # inside a preview box. Scoping each stage to its own component keeps them apart.
    ('Token 审计 · 卡片内色板', 'tokens.html', '#token-color-accent .swatch', 'token-card', '.swatch'),
    ('Motion 库 · 行为卡', 'motion.html', '.motion-card', 'motion-card', '.motion-card'),
    ('Motion 库 · 小卡', 'motion.html', '.small-card', 'small-card', '.small-card'),
]

PROPS = ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'borderTopLeftRadius',
         'fontSize', 'fontWeight', 'paddingTop', 'paddingLeft', 'lineHeight']

COMPUTED_JS = """([selector, index, props]) => {
  const el = document.querySelectorAll(selector)[index];
  if (!el) return null;
  const style = getComputedStyle(el);
  return Object.fromEntries(props.map((prop) => [prop, style[prop]]));
}"""

SCALE_JS = """() => [...document.querySelectorAll('.ds-frame--scene')]
  .map((frame) => Number(getComputedStyle(frame).getPropertyValue('--k')))"""

STAGE_SIZE_JS = """() => {
  const el = document.querySelector('.ds-stage');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}"""

# A component's registry entry lists the selectors its stage may pull in. When a class used
# in its own markup is missing from that list the stage renders that piece unstyled — the
# swatch inside a Token card was exactly that bug.
UNSTYLED_JS = """(skip) => {
  const stage = document.querySelector('.ds-stage');
  if (!stage) return [];
  const selectors = [...document.styleSheets].flatMap((sheet) => {
    try { return [...sheet.cssRules].map((rule) => rule.selectorText || ''); } catch { return []; }
  });
  const used = new Set();
  stage.querySelectorAll('*').forEach((el) => el.classList.forEach((name) => used.add(name)));
  // Match the class as a whole token. A substring test would treat `.layers`,
  // `.layer-heading` and `.layer-number` as covering `.layer`, so a stage that styles
  // only the parent would look like it styles the child too.
  const covered = (name) => new RegExp(`\\\\.${name}(?![\\\\w-])`).test(
    selectors.join('\\n'));
  return [...used].filter((name) =>
    !skip.includes(name) && !name.startsWith('ds-') && !covered(name));
}"""

CLASS_SKIP = ['active', 'show', 'selected', 'changed', 'compact', 'is-open']

LINKS_JS = """() => [...document.querySelectorAll('a[href]')]
  .map((a) => a.getAttribute('href'))
  .filter((href) => href && !href.startsWith('#') && !/^[a-z]+:/i.test(href))"""

SUMMARY_JS = """() => ({
  components: document.querySelectorAll('.ds-component').length,
  stages: document.querySelectorAll('.ds-frame').length,
})"""

TOKENS_CSS_JS = """() => {
  const probe = document.createElement('div');
  probe.style.color = 'var(--wb-color-accent)';
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8791)
    args = parser.parse_args()
    base = f'http://127.0.0.1:{args.port}'

    results, errors, external = [], [], set()

    def record(name, passed, detail=None):
        results.append({'name': name, 'passed': bool(passed), 'detail': detail})

    shots.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1536, 'height': 1024}, device_scale_factor=1)
        page = context.new_page()

        page.on('console', lambda message: errors.append({'page': page.url, 'text': message.text})
                if message.type == 'error' else None)
        page.on('pageerror', lambda error: errors.append({'page': page.url, 'text': str(error)}))
        page.on('request', lambda request: external.add(request.url)
                if not request.url.startswith(base)
                and not request.url.startswith(('data:', 'blob:')) else None)

        def goto(path):
            response = page.goto(f'{base}/{path}', wait_until='load')
            page.wait_for_timeout(120)
            return response.status if response else 0

        def computed(selector):
            return page.evaluate(COMPUTED_JS, [selector, 0, PROPS])

        # ------------------------------------------------------------ 1. pages load
        for path in ['components.html', 'preview/index.html', 'manifest.json',
                     'tokens.html', 'motion.html', 'catalog.html']:
            status = goto(path)
            record(f'加载 {path}', status == 200, {'status': status})

        # ------------------------------------------------------------ 2. every preview
        goto('preview/index.html')
        preview_hrefs = page.eval_on_selector_all('a.card', 'els => els.map((a) => a.getAttribute("href")).filter(Boolean)')
        record('preview/index.html 卡片数 = 28', len(preview_hrefs) == 28, {'count': len(preview_hrefs)})

        preview_failures = []
        for href in preview_hrefs:
            status = goto(f'preview/{href}')
            if status != 200:
                preview_failures.append({'href': href, 'status': status})
            frame = page.evaluate(STAGE_SIZE_JS)
            if not frame or frame['width'] < 1 or frame['height'] < 1:
                preview_failures.append({'href': href, 'stage': frame})
        record(f'{len(preview_hrefs)} 个独立预览页可渲染', not preview_failures, preview_failures)

        # ------------------------------------------------------------ 3. style parity
        goto('components.html')
        scene_scale = page.evaluate(SCALE_JS)
        record('首页类舞台已按比例缩放',
               bool(scene_scale) and all(0.05 < k < 1 for k in scene_scale), {'sceneScale': scene_scale})

        for label, anchor, anchor_selector, component, preview_selector in PARITY:
            goto(anchor)
            expected = computed(anchor_selector)
            if not expected:
                record(label, False, {'reason': '出货页面选择器未命中', 'selector': anchor_selector})
                continue
            # Both surfaces are checked: the full document and the standalone page a reader opens.
            for surface in ['components.html', f'preview/{component}.html']:
                goto(surface)
                selector = (f'#c-{component} .ds-stage {preview_selector}' if surface == 'components.html'
                            else f'.ds-stage {preview_selector}')
                actual = computed(selector)
                if not actual:
                    record(f'{label} · {surface}', False, {'reason': '预览选择器未命中', 'selector': selector})
                    continue
                diff = {key: value for key, value in expected.items() if actual[key] != value}
                record(f'{label} · {surface}', not diff,
                       {'expected': expected, 'actual': actual, 'diff': diff})

        # ------------------------------------------------------------ 4. own-styles coverage
        unstyled = []
        for href in preview_hrefs:
            goto(f'preview/{href}')
            missing = page.evaluate(UNSTYLED_JS, CLASS_SKIP)
            if missing:
                unstyled.append({'href': href, 'missing': missing})
        record(f'{len(preview_hrefs)} 个组件的自身 class 都有对应样式', not unstyled, unstyled)

        # ------------------------------------------------------------ 5. internal links
        # The preview pages sit one directory down, so a root-relative nav href 404s there
        # without anything else noticing. Every internal link is requested for real.
        broken_links, checked_links = [], set()
        for path in ['components.html', 'preview/index.html', *[f'preview/{href}' for href in preview_hrefs]]:
            goto(path)
            for href in set(page.evaluate(LINKS_JS)):
                url = page.evaluate('([href, base]) => new URL(href, base).href', [href, f'{base}/{path}'])
                checked_links.add(url)
                response = context.request.get(url, fail_on_status_code=False)
                if response.status >= 400:
                    broken_links.append({'page': path, 'href': href, 'status': response.status})
        record(f'新页面 {len(checked_links)} 条内部链接全部可达', not broken_links,
               {'checked': len(checked_links), 'broken': broken_links})

        # ------------------------------------------------------------ 6. runtime surface
        goto('components.html')
        summary = page.evaluate(SUMMARY_JS)
        record('components.html 渲染 28 个组件块', summary['components'] == 28, summary)
        tokens_css = page.evaluate(TOKENS_CSS_JS)
        record('components.html 已加载 tokens.css（--wb-color-accent 可解析）',
               tokens_css == 'rgb(103, 204, 255)', {'tokensCssApplied': tokens_css})

        # ------------------------------------------------------------ screenshots
        # No full-page capture: 28 component blocks make it a ~10 MB PNG, too heavy to review.
        page.screenshot(path=str(shots / 'components-hero.png'))
        # The sticky header and filter bar are turned off for this shot only; otherwise
        # they are painted over the preview stage that is being shown off.
        page.add_style_tag(content='.ds-page>header,.ds-page .tools{position:static!important}')
        page.locator('#c-token-card').screenshot(path=str(shots / 'components-anatomy.png'))

        goto('preview/index.html')
        page.screenshot(path=str(shots / 'preview-index.png'), full_page=True)
        goto('preview/token-card.html')
        page.screenshot(path=str(shots / 'preview-token-card.png'), full_page=True)
        page.set_viewport_size({'width': 430, 'height': 900})
        goto('preview/index.html')
        page.screenshot(path=str(shots / 'preview-index-mobile.png'), full_page=True)

        browser.close()

    record('无 JavaScript 错误', not errors, errors)
    record('无外部网络依赖', not external, sorted(external))

    parity = [r for r in results if ' · ' in r['name']]
    report = {
        'schema': 'winbrain.design-system-verification/v1',
        'base': base,
        'viewport': '1536x1024 (+430x900 mobile)',
        'checks': results,
        'errors': errors,
        'externalRequests': sorted(external),
        'summary': {
            'passed': sum(1 for r in results if r['passed']),
            'failed': sum(1 for r in results if not r['passed']),
            'javascriptErrors': len(errors),
            'externalRequests': len(external),
            'styleParityChecked': len(parity),
            'styleParityPassed': sum(1 for r in parity if r['passed']),
        },
        'screenshots': [
            'design-system-review/components-hero.png',
            'design-system-review/components-anatomy.png',
            'design-system-review/preview-index.png',
            'design-system-review/preview-token-card.png',
            'design-system-review/preview-index-mobile.png',
        ],
    }
    (root / 'design-system-verification.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    for item in results:
        print(f"{'PASS' if item['passed'] else 'FAIL'}  {item['name']}")
        if not item['passed']:
            print('      ', json.dumps(item['detail'], ensure_ascii=False)[:700])
    summary = report['summary']
    print(f"\n{summary['passed']} passed, {summary['failed']} failed. "
          f"Parity {summary['styleParityPassed']}/{summary['styleParityChecked']}.")
    return 1 if summary['failed'] else 0


if __name__ == '__main__':
    sys.exit(main())
