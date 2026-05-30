import assert from 'node:assert/strict';
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const cli = path.join(root, 'dist', 'cli.js');

function run(args, cwd) {
  return execFileSync('node', [cli, ...args], { cwd, encoding: 'utf8' });
}

function tempRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'agent-capsule-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name Test', { cwd: dir });
  writeFileSync(path.join(dir, 'README.md'), '# test\n');
  execSync('git add . && git commit -m initial', { cwd: dir, stdio: 'ignore' });
  return dir;
}

test('init creates capsule directory and config', () => {
  const dir = tempRepo();
  const output = run(['init'], dir);
  assert.match(output, /initialized/);
  assert.match(readFileSync(path.join(dir, '.capsules', 'config.yml'), 'utf8'), /version: 1/);
});

test('new creates a slugged capsule and list shows it', () => {
  const dir = tempRepo();
  run(['new', 'Fix Login Redirect'], dir);
  const list = run(['list'], dir);
  assert.match(list, /fix-login-redirect/);
});

test('prompt includes scope rules', () => {
  const dir = tempRepo();
  run(['new', 'Fix Login Redirect'], dir);
  const prompt = run(['prompt', 'fix-login-redirect'], dir);
  assert.match(prompt, /Stay strictly inside the scope/);
  assert.match(prompt, /Do not refactor unrelated code/);
});

test('check detects forbidden and outside allowed files', () => {
  const dir = tempRepo();
  mkdirSync(path.join(dir, '.capsules'), { recursive: true });
  writeFileSync(path.join(dir, '.capsules', 'auth.md'), `# Task Capsule: Auth\n\n## Goal\nFix auth.\n\n## Context\nTest.\n\n## Allowed files\n- src/auth/**\n- tests/auth/**\n\n## Forbidden files\n- src/billing/**\n\n## Done criteria\n- Fixed.\n\n## Verify commands\n\n## Maximum changed files\n2\n\n## Requires tests\nyes\n\n## Notes for agent\nSmall change.\n`);
  mkdirSync(path.join(dir, 'src', 'billing'), { recursive: true });
  writeFileSync(path.join(dir, 'src', 'billing', 'plan.ts'), 'export const x = 1;\n');
  let failed = false;
  try {
    run(['check', 'auth', '--no-verify'], dir);
  } catch (error) {
    failed = true;
    const output = error.stdout.toString();
    assert.match(output, /forbidden file/);
    assert.match(output, /outside Allowed files/);
    assert.match(output, /requires tests/);
  }
  assert.equal(failed, true);
});

test('retry prints repair prompt for violations', () => {
  const dir = tempRepo();
  mkdirSync(path.join(dir, '.capsules'), { recursive: true });
  writeFileSync(path.join(dir, '.capsules', 'auth.md'), `# Task Capsule: Auth\n\n## Goal\nFix auth.\n\n## Context\nTest.\n\n## Allowed files\n- src/auth/**\n\n## Forbidden files\n- src/billing/**\n\n## Done criteria\n- Fixed.\n\n## Verify commands\n\n## Maximum changed files\n1\n\n## Requires tests\nyes\n\n## Notes for agent\nSmall change.\n`);
  mkdirSync(path.join(dir, 'src', 'billing'), { recursive: true });
  writeFileSync(path.join(dir, 'src', 'billing', 'plan.ts'), 'export const x = 1;\n');
  const output = run(['retry', 'auth'], dir);
  assert.match(output, /You exceeded the task capsule/);
  assert.match(output, /src\/billing\/plan.ts/);
  assert.match(output, /Revert unrelated changes/);
});
