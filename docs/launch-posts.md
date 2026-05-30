# Launch posts

## X / LinkedIn

I built agent-capsule: a tiny CLI that stops AI coding agents from freelancing across your repo.

Create a task capsule, paste the scoped prompt into Codex/Claude/Cursor, then check whether the git diff stayed inside scope.

No API key. No AI calls. Just deterministic guardrails.

## Hacker News

Show HN: agent-capsule — task-level scope contracts for AI coding agents

AI coding agents are useful, but they often broaden scope, touch unrelated files, or skip tests. agent-capsule creates a small markdown “capsule” for each task, generates a prompt for Codex/Claude/Cursor, then checks the resulting git diff against allowed files, forbidden files, max changed files, and test requirements.

It runs locally, has no telemetry, and does not call any LLM APIs.
