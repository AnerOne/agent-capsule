# agent-capsule

**Stop letting AI coding agents freestyle.**

agent-capsule creates task-level scope contracts for Codex, Claude Code, Cursor and other AI coding agents, then checks whether the resulting git diff stayed inside scope.

```bash
agent-capsule new "fix login redirect"
agent-capsule prompt fix-login-redirect
# paste the prompt into your coding agent
agent-capsule check fix-login-redirect
```

## Why this exists

AI coding agents are useful, but they often do too much:

- refactor unrelated code,
- touch files outside the task,
- modify config or lockfiles unexpectedly,
- skip tests,
- leave you with a large diff that is hard to review.

agent-capsule gives each task a small contract:

- what the agent should do,
- what files it may touch,
- what files are forbidden,
- how many files it may change,
- whether tests are required,
- how to verify the result.

Then it checks the git diff after the agent is done.

## What it is and is not

agent-capsule is:

- a scope contract,
- a prompt generator,
- a post-agent diff checker,
- a workflow helper for agentic coding.

agent-capsule is not:

- an AI reviewer,
- a linter,
- a security scanner,
- a replacement for human review,
- a SaaS,
- a telemetry product.

It makes deterministic local checks. No API key. No LLM calls.

## Installation

From a cloned repo during development:

```bash
npm install
npm run build
npm link
```

After publishing to npm:

```bash
npm install -g agent-capsule
```

Or run with npx once published:

```bash
npx agent-capsule init
```

## Use it in 60 seconds

```bash
agent-capsule init
agent-capsule new "fix login redirect"
agent-capsule prompt fix-login-redirect
```

Paste the generated prompt into Codex, Claude Code, Cursor, or another coding agent.

After the agent changes files:

```bash
agent-capsule check fix-login-redirect
```

Example output:

```txt
Capsule check: fix-login-redirect

Changed files: 3
- src/auth/redirect.ts
- src/billing/plan.ts
- tests/auth/redirect.test.ts

Issues:
❌ 1 forbidden file(s) were changed.
   - src/billing/plan.ts

Result: needs review
```

If the agent exceeded scope, generate a repair prompt:

```bash
agent-capsule retry fix-login-redirect
```

Example retry output:

```md
You exceeded the task capsule.

Original goal:
Fix login redirect after successful authentication.

Problems:
- 1 forbidden file(s) were changed.
  - src/billing/plan.ts

Repair instructions:
- Preserve valid work that directly supports the original goal.
- Revert unrelated changes.
- Do not broaden scope.
- Do not refactor unrelated code.
- Do not touch forbidden files.
- Add or update tests if the capsule requires tests.
- Rerun verification commands:
- npm test
- Summarize what you changed, what you reverted, and anything you could not complete.
```

## Commands

### `agent-capsule init`

Creates:

```txt
.capsules/
.capsules/templates/default.md
.capsules/config.yml
```

### `agent-capsule new "task name"`

Creates a capsule markdown file:

```txt
.capsules/fix-login-redirect.md
```

### `agent-capsule prompt <capsule>`

Prints a ready-to-paste prompt for a coding agent.

### `agent-capsule check <capsule>`

Checks the current git diff against the capsule.

Implemented checks:

- changed files outside allowed patterns,
- changed files matching forbidden patterns,
- too many changed files,
- missing test file changes when tests are required,
- failed verification commands.

Use `--no-verify` to skip verification commands:

```bash
agent-capsule check fix-login-redirect --no-verify
```

### `agent-capsule retry <capsule>`

Prints a repair prompt when the agent exceeded capsule scope.

### `agent-capsule list`

Lists existing capsules.

### `agent-capsule doctor`

Checks whether the current repo is ready to use agent-capsule.

## Capsule format

```md
# Task Capsule: Fix login redirect

## Goal
Fix login redirect after successful authentication.

## Context
Users should land on the originally requested page after login.

## Allowed files
- src/auth/**
- src/routes/login/**
- tests/auth/**

## Forbidden files
- src/billing/**
- .env
- package-lock.json

## Done criteria
- Redirect bug is fixed.
- Regression test is added or updated.
- No unrelated refactor.

## Verify commands
- npm test

## Maximum changed files
6

## Requires tests
yes

## Notes for agent
Make the smallest useful change. Do not refactor auth architecture.
```

## Demo scenario

1. Create a capsule:

```bash
agent-capsule new "fix auth redirect"
```

2. Edit the capsule and narrow allowed/forbidden files.

3. Generate the prompt:

```bash
agent-capsule prompt fix-auth-redirect
```

4. Paste the prompt into Codex.

5. Check the result:

```bash
agent-capsule check fix-auth-redirect
```

6. If scope was exceeded:

```bash
agent-capsule retry fix-auth-redirect
```

Paste the retry prompt back into the coding agent.

## Works with

- Codex
- Claude Code
- Cursor
- Copilot Coding Agent
- Other local or cloud coding agents that can follow a prompt

## Current limitations

- Pattern matching is intentionally simple.
- It checks git diff against the current repo state, not a remote PR.
- It does not inspect semantic code quality.
- It does not call an LLM.
- It does not replace human review.

## Roadmap

- Better glob compatibility.
- GitHub Action mode.
- JSON output for CI.
- Capsule presets for bugfixes, refactors, migrations, and dependency upgrades.
- Direct `codex exec` integration.
- Richer retry prompt with grouped violations.
- Interactive capsule creation.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
