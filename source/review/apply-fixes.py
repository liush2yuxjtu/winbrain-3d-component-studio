"""One-shot upstream synchronization; generated pages are rebuilt by the review job.

Never discard source conflicts. Only generated HTML/manifest outputs may use the
candidate copy during merge; npm run build regenerates them before validation.
"""
import os
import subprocess


def run(*args, check=True):
    return subprocess.run(args, check=check, text=True, capture_output=True)


if os.environ.get('GITHUB_EVENT_NAME') == 'push' and os.environ.get('GITHUB_REF') == 'refs/heads/fix/p0-p1-assets-20260915':
    run('git', 'config', 'user.name', 'github-actions[bot]')
    run('git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
    run('git', 'fetch', 'origin', 'main')
    target = run('git', 'rev-parse', 'origin/main').stdout.strip()
    merged = run('git', 'merge', '--no-commit', '--no-ff', target, check=False)
    print(merged.stdout, merged.stderr)
    conflicts = run('git', 'diff', '--name-only', '--diff-filter=U').stdout.splitlines()
    generated = {'index.html', 'studio.html', 'catalog.html', 'tokens.html', 'tokens.css', 'motion.html', 'motion-manifest.json'}
    unexpected = sorted(set(conflicts) - generated)
    if unexpected:
        raise RuntimeError('Manual source resolution required; nothing will be pushed: ' + ', '.join(unexpected))
    for path in conflicts:
        run('git', 'checkout', '--ours', '--', path)
        run('git', 'add', '--', path)
    merge_head = run('git', 'rev-parse', '--verify', 'MERGE_HEAD', check=False)
    if merge_head.returncode == 0:
        run('git', 'commit', '-m', 'Merge production flicker repair into asset-review branch; rebuild generated pages next')
    elif merged.returncode:
        raise RuntimeError('Upstream synchronization failed: ' + merged.stderr)
    print('Synchronized upstream commit:', target)
