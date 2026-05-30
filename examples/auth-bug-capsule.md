# Task Capsule: Fix login redirect

## Goal
Fix login redirect after successful authentication.

## Context
Users should return to the originally requested page after login.

## Allowed files
- src/auth/**
- src/routes/login/**
- tests/auth/**

## Forbidden files
- src/billing/**
- src/payments/**
- .env

## Done criteria
- Redirect works after login.
- Regression test covers the redirect.
- No auth architecture refactor.

## Verify commands
- npm test

## Maximum changed files
6

## Requires tests
yes

## Notes for agent
Make the smallest useful change.
