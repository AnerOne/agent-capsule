import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const CAPSULE_DIR = '.capsules';

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'task';
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readText(file: string): string {
  return readFileSync(file, 'utf8');
}

export function writeText(file: string, content: string): void {
  ensureDir(path.dirname(file));
  writeFileSync(file, content, 'utf8');
}

export function pathExists(file: string): boolean {
  return existsSync(file);
}

export function isDirectory(file: string): boolean {
  return existsSync(file) && statSync(file).isDirectory();
}

export function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => entry.endsWith('.md'))
    .filter((entry) => !entry.startsWith('templates'))
    .sort();
}

export function runGit(args: string[], cwd = process.cwd()): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const err = error as { stderr?: Buffer; message?: string };
    const stderr = err.stderr?.toString().trim();
    throw new Error(stderr || err.message || `git ${args.join(' ')} failed`);
  }
}

export function hasGitRepo(cwd = process.cwd()): boolean {
  try {
    runGit(['rev-parse', '--is-inside-work-tree'], cwd);
    return true;
  } catch {
    return false;
  }
}

export function getChangedFiles(cwd = process.cwd()): string[] {
  if (!hasGitRepo(cwd)) return [];

  try {
    const hasHead = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    if (hasHead) {
      const diff = runGit(['diff', '--name-only', 'HEAD'], cwd);
      const status = parseStatusFiles(runGit(['status', '--porcelain', '--untracked-files=all'], cwd));
      return Array.from(new Set([...uniqueLines(diff), ...status])).filter((file) => !file.startsWith('.capsules/')).sort();
    }
  } catch {
    // Repository has no commits yet. Fall back to status.
  }

  return parseStatusFiles(runGit(['status', '--porcelain', '--untracked-files=all'], cwd)).filter((file) => !file.startsWith('.capsules/'));
}

function parseStatusFiles(status: string): string[] {
  return uniqueLines(
    status
      .split('\n')
      .map((line) => line.slice(3).trim())
      .map((file) => file.includes(' -> ') ? file.split(' -> ').pop() || file : file)
      .join('\n')
  );
}

function uniqueLines(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    )
  ).sort();
}

export function runShell(command: string, cwd = process.cwd()): { passed: boolean; output: string } {
  try {
    const output = execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { passed: true, output: output.trim() };
  } catch (error) {
    const err = error as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const output = [err.stdout?.toString(), err.stderr?.toString(), err.message].filter(Boolean).join('\n').trim();
    return { passed: false, output };
  }
}

export function matchesAny(file: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchPattern(file, pattern));
}

export function matchPattern(file: string, pattern: string): boolean {
  const normalizedFile = normalizePath(file);
  const normalizedPattern = normalizePath(pattern.trim());
  if (!normalizedPattern || normalizedPattern === '*') return true;

  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }

  if (normalizedPattern.endsWith('/*')) {
    const prefix = normalizedPattern.slice(0, -2);
    if (!normalizedFile.startsWith(`${prefix}/`)) return false;
    return !normalizedFile.slice(prefix.length + 1).includes('/');
  }

  if (normalizedPattern.startsWith('**/')) {
    const suffix = normalizedPattern.slice(3);
    return normalizedFile === suffix || normalizedFile.endsWith(`/${suffix}`);
  }

  if (normalizedPattern.includes('*')) {
    const escaped = normalizedPattern
      .split('*')
      .map(escapeRegExp)
      .join('[^/]*');
    return new RegExp(`^${escaped}$`).test(normalizedFile);
  }

  return normalizedFile === normalizedPattern;
}

export function normalizePath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

export function testFileChanged(files: string[]): boolean {
  return files.some((file) => {
    const normalized = normalizePath(file).toLowerCase();
    return (
      normalized.includes('/test/') ||
      normalized.includes('/tests/') ||
      normalized.endsWith('.test.ts') ||
      normalized.endsWith('.test.tsx') ||
      normalized.endsWith('.spec.ts') ||
      normalized.endsWith('.spec.tsx') ||
      normalized.endsWith('.test.js') ||
      normalized.endsWith('.spec.js')
    );
  });
}

export function formatList(items: string[], empty = '(none)'): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : empty;
}
