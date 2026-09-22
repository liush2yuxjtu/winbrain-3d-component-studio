# WinBrain Design System v2

目标：把当前 Token / Motion / UI / Asset 四层设计系统升级为 Agent-readable 的产品设计契约。

## Architecture

```
Intent
  ↓
Design Language
  ↓
Tokens
  ↓
Components
  ↓
Screens
  ↓
Flows
  ↓
Runtime Verification
  ↓
Playable Demo
```

## New Layers

- `design-language.md` — 3D visual grammar
- `screens/` — complete UI states
- `flows/` — user goal driven screen sequences
- `schemas/` — machine-readable contracts

## Rules

1. Screen is a real UI state, not a description.
2. Flow is composed only from existing screens.
3. Components must originate from registry.
4. Runtime evidence is required before claiming completion.
