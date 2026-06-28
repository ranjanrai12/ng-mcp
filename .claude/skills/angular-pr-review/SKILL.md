---
name: angular-pr-review
description: Verify an Angular PR / diff against Angular v22 best practices. Use when reviewing a pull request, checking the current working diff before raising a PR, or auditing changed Angular files for standalone/signals/control-flow/inject/a11y compliance.
---

# Angular PR Review

Review the changed Angular code against the **Angular v22 best practices** below and produce a
structured, actionable report. This skill is the single source of truth used both locally
(`/angular-pr-review`) and by the GitHub Action (`.github/workflows/angular-pr-review.yml`).

## Scope: what to review

1. Determine the set of changed files:
   - **PR context (GitHub Action):** the files in the pull request diff (base...head).
   - **Local context:** diff against the repository's default branch. Detect it with
     `git remote show origin | sed -n 's/.*HEAD branch: //p'` (this repo's is `master`), then run
     `git diff --name-only origin/<default>...HEAD` (fallback `git diff --name-only HEAD`).
     Only review files under `src/` with extensions `.ts`, `.html`, `.scss`, `.css`.
2. Read each changed file (and just enough surrounding context to judge it).
3. Apply the checklist. Report only on **changed lines** plus issues the change introduces or worsens.
   Do not flag pre-existing issues in untouched code unless they directly affect the change.

## Verification gates (run these first)

Prefer the Angular CLI MCP tools when available; otherwise use the npm scripts.

- **Lint:** `npx ng lint` (or MCP `run_target` with target `lint`). Must pass.
- **Build:** `npx ng build` (or MCP `run_target` target `build`). Must compile with no errors.
- **Unit tests:** `npx ng test --watch=false --browsers=ChromeHeadless` if a test runner is configured.

A PR that fails lint or build is an automatic **REQUEST CHANGES**.

## Checklist (Angular v22)

### TypeScript
- [ ] No `any`. Use `unknown` when the type is genuinely uncertain, then narrow.
- [ ] Strict typing; prefer type inference only when the type is obvious.

### Components
- [ ] Components are standalone (the default). **Flag** any explicit `standalone: true` in a decorator — it's redundant in v20+.
- [ ] **Flag** explicit `changeDetection: ChangeDetectionStrategy.OnPush` — `OnPush` is the v22 default; remove it.
- [ ] Inputs/outputs use the `input()` / `output()` functions, **not** `@Input()` / `@Output()` decorators.
- [ ] Local/derived state uses `signal()` and `computed()` — not plain mutable class fields for reactive state.
- [ ] **Flag** `@HostBinding` / `@HostListener` decorators — move bindings into the `host` object of the decorator.
- [ ] Static images use `NgOptimizedImage` (not for inline base64 images).
- [ ] Components are small and single-responsibility; prefer inline templates for small components.
- [ ] External template/style references use paths relative to the component `.ts` file.

### Templates
- [ ] Native control flow `@if` / `@for` / `@switch` — **flag** any `*ngIf` / `*ngFor` / `*ngSwitch`.
- [ ] Every `@for` has a `track` expression.
- [ ] **Flag** `ngClass` → use `[class.x]` / `[class]` bindings. **Flag** `ngStyle` → use `[style.x]` / `[style]` bindings.
- [ ] Observables rendered via the `async` pipe.
- [ ] Templates are simple — no complex logic; move it to the component/computed signals.

### Services & DI
- [ ] Singleton services use `providedIn: 'root'` (or the `@Service` decorator in v22), single responsibility.
- [ ] Dependencies obtained via the `inject()` function — **flag** constructor-parameter injection in new code.

### State management
- [ ] Reactive state via signals; derived state via `computed()`; transformations pure.
- [ ] **Flag** `.mutate(` on a signal — use `.set()` or `.update()`.

### Forms
- [ ] New forms prefer Signal Forms (`@angular/forms/signals`, stable in v22). Otherwise Reactive forms over Template-driven.

### Accessibility (WCAG AA)
- [ ] Interactive elements are keyboard-accessible with correct ARIA roles/attributes and visible focus.
- [ ] Images have meaningful `alt`; color contrast meets AA; no AXE violations introduced.

## Output format

Produce the report in this exact shape:

```
## Angular PR Review

**Gates:** lint ✅/❌ · build ✅/❌ · tests ✅/❌/n-a

### Findings
- 🔴 BLOCKER  <file>:<line> — <rule violated> — <what to change>
- 🟡 WARNING  <file>:<line> — <rule violated> — <suggested improvement>
- 🟢 NIT      <file>:<line> — <minor>

(omit a severity bucket if it has no findings; if nothing at all, say "No issues found ✅")

### Verdict
APPROVE | REQUEST CHANGES   — one-line rationale
```

Rules for severity:
- **BLOCKER:** failing gate, `any`, deprecated structural directive (`*ngIf` etc.), `.mutate()`, `@HostBinding/@HostListener`, a11y violation.
- **WARNING:** decorator inputs/outputs, redundant `standalone:true`/`OnPush`, constructor injection, `ngClass`/`ngStyle`, missing `@for` track, non-`NgOptimizedImage` static image.
- **NIT:** style/readability suggestions.

Be specific: always cite `file:line` and give the concrete fix, not just the rule name.
