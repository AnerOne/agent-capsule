# Task Capsule: Rename helper function

## Goal
Rename a confusing helper function without changing behavior.

## Context
This is a narrow refactor. Keep behavior identical.

## Allowed files
- src/utils/**
- tests/utils/**

## Forbidden files
- src/auth/**
- src/billing/**
- package.json

## Done criteria
- Function is renamed.
- Existing tests pass.
- No behavior changes.

## Verify commands
- npm test

## Maximum changed files
5

## Requires tests
yes

## Notes for agent
Do not combine this with other cleanup.
