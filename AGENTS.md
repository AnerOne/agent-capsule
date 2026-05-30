# AGENTS.md

Instructions for AI coding agents working on this repository.

## Operating rules

- Keep changes small and directly related to the user's requested task.
- Do not broaden scope without explicit user approval.
- Do not refactor unrelated code.
- Do not add telemetry, analytics, tracking, or paid API calls.
- Do not add dependencies unless they are clearly justified and minimal.
- Prefer deterministic logic over LLM calls.
- Update README/CHANGELOG for user-facing changes.
- Add or update tests for behavior changes.
- Run `npm test` before claiming completion.
- Run `npm run build` before claiming completion.

## Project intent

agent-capsule is a local CLI tool for controlling AI coding-agent scope. It creates task-level capsules, generates prompts, checks git diffs, and produces retry prompts when agents exceed scope.

This is not a SaaS, not an AI reviewer, and not a security scanner.
