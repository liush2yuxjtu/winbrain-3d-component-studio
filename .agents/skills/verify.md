---
name: verify
description: Verify a code change before shipping by running the relevant existing tests locally, then running the real application or public surface and observing the affected behavior end to end. Use before every pull request, for PR verification, manual acceptance, confirming a fix, validating local changes before shipping, or turning an audit report into a ranked action list.
---

# Verify before shipping

The question is whether the changed behavior works for a real caller. Shift tests left by running them locally before the PR, then verify the running product surface. Tests, type checks, and static review are supporting evidence; they do not replace runtime evidence when a real user/programmatic surface exists.

## Scope

Identify the full change or named behavior being verified. Read the relevant diff and stated claim. If implementation and claim disagree, record that as a finding.

## Measured audit — from a headline number to an actionable list

An audit report arrives as counts. A count answers "how many", not "how many need action", so measure before you triage. Reproduce each number from source; never carry one forward because it was already written down. The figures below are a snapshot of this repository's design-system audit and are for illustration — re-measure rather than quoting them, because a later change moves them.

1. **Count occurrences, then de-duplicate.** Report both. 490 colour literals across 7 pages are 335 distinct values, 289 of which appear exactly once. A value used once is not a debt — abstracting it yields a token used once. Repeated values are the candidates.
2. **Intersect literals with the token table.** The actionable set is the intersection, not the total: 8 of those 490 occurrences are byte-identical copies of an existing token. Those 8 are the refactor; the other 482 are one-off scene values that belong to no scale.
3. **Compare values before merging by name.** Same name is not the same value. A local `--border: #28313f` beside a global `--wb-color-border: #31445f` reads as an alias and is not one. Every "merge / unify / consolidate" proposal starts with a value diff — differing values make it a design conflict, not cleanup. An instruction written from names alone will silently repaint the product.
4. **Separate state classes from semantic attributes.** List where the state class is toggled and where the ARIA attribute is set; the difference is the accessibility gap. Check for an in-repo precedent first: an existing correct usage means the pattern was known and not rolled out, which ranks it above a stylistic preference.
5. **Prove an inclusion is inert before adding it.** Linking a shared stylesheet is only safe once the target is confirmed to be a custom-property-only `:root` block with no element selectors.
6. **Bind every finding to a reproducible command and its raw output.** A finding with no command is an opinion, and it cannot be re-checked after the code moves.
7. **Choose a measurement that can fail for the right reason.** Counting hex literals is not counting applied values: a colour routed through a local custom property and the same colour named directly are equivalent but count differently, so a literal diff reports a change that is not there. Resolve `var()` on both sides, drop custom-property declarations (a definition is not an application), and compare the multiset of applied values. A measurement that cannot tell a real change from a re-expression proves nothing in either direction.

When the measurement contradicts the headline, lead with the correction. A triage that restates the original framing has added nothing.

In this repository those numbers come from `source/system/audit.js` (`node source/build-system.mjs`, then read `manifest.json`). Extend that audit rather than scripting a second count — two counters measuring the same thing will disagree, and then neither is evidence.

## Shift-left test gate

Run the smallest existing test suite that directly covers the change from the local/project environment before opening a PR. Reuse the repository's existing commands from package scripts, Makefiles, pyproject/tox/nox config, Cargo/Go tooling, or project docs. Expand to the broader suite when it is reasonably cheap or when the changed boundary makes narrow coverage insufficient.

Do not delete, weaken, skip, or rewrite tests merely to obtain a green result. Preserve the raw command, exit status, and relevant output. A relevant test failure is a **FAIL** until fixed or shown to be an invalid test with concrete evidence.

The test assets stay in the repository. Their execution belongs as early as possible in the local agent workflow; CI duplication can be removed only when the same required coverage is enforced by this pre-PR verification path and any required remote/environment-specific gates are preserved.

## Surface

Follow the changed code outward to the user/program boundary: rendered GUI, public CLI/TUI, listening server/API, exported package API, real agent invocation, or workflow run. An internal helper is not the final surface when a real caller exists.

For a docs-only change with no executable behavior, return `SKIP`. For a tests-only change, run the affected tests and report their result; runtime observation may be `SKIP` when no product behavior changed.

## Run and drive

Reuse the most specific project `run-*` recipe. Otherwise use the `run` workflow to get a live handle. Exercise the smallest end-to-end path that makes the changed code execute and capture evidence from the running surface: screenshot, pane/stdout, response, public SDK output, or agent/workflow result.

Then probe at least one nearby edge case suggested by the change while staying at the same public surface.

## Evidence and verdict

Preserve raw evidence before interpreting it. Use one verdict:

- **PASS** — required local tests passed, the real surface was exercised when applicable, and the claimed behavior worked.
- **FAIL** — a required local test failed, the real surface failed/regressed, or the observed behavior materially disagreed with the claim.
- **BLOCKED** — the required test or runtime surface could not be reached because the environment/launch path failed.
- **SKIP** — no executable behavior exists to observe, or runtime observation is not applicable to a tests-only/docs-only change.

A green harness proves only what it measures. Style-equality checks are blind to script failure: 32 of 32 computed-style comparisons passed while an inline script sat dead from a missing parenthesis, because the styles were correct and only the code was broken — the console-error check caught it. Enumerate the failure modes your harness cannot see and cover each with a different check. Two checks that share a blind spot are one check.

No partial pass.

Report: claim, local test commands/results, runtime method, each driven step with observation/evidence, one edge probe when runtime applies, findings, verdict, and cleanup status.

See `references/cli.md` and `references/server-api.md` for examples.

## Live design settings: working runtime recipe

- Target: repository root (static Pages output), with Node/npm and Python 3 available.
- Setup: `npm --prefix source ci`, then `npm --prefix source run build`. Run `npm --prefix source run test:settings`, `npm --prefix source run check:docs`, `node --test source/review/storage-scope.test.mjs`, and `git diff --check`. A clean rebuild should leave the generated pages unchanged.
- Launch from the root: `python3 -m http.server 18792 --bind 127.0.0.1`. Confirm the listening message and load `http://127.0.0.1:18792/index.html` in the authorized browser. Use another free port if occupied; never replace an unknown service.
- Drive through the browser UI (Codex: `cua_repl`): open “设计系统 · 实时设置”, change brightness and toggle platform titles; observe the real scene, reload and verify retained values. Follow “设计规则” to test UI colors/radius and another open tab's synchronization. Verify Studio's scene too. Before testing, preserve any existing preferences; restore them afterward instead of clearing unrelated local layouts.
- Adjacent cases: reject an imported settings JSON with exposure `99` without altering the current settings; export must expose selectable JSON; Escape returns focus to the launcher; at 390px the settings panel and its footer remain in bounds. Reset is appropriate only for disposable test preferences.
- Evidence: retain exact URL/commit, commands and exit statuses, raw browser observations and before/after screenshots in the task's `outputs/` report (or tool trace). Bind post-deployment evidence separately to the final Pages commit. Old audit totals do not establish this panel's behavior.
- Cleanup: stop only the HTTP server started for this check; restore viewport and preferences. Localhost and Pages have separate storage. Component previews share their deployment's settings. Copyable export is the fallback when the browser does not confirm a download.
