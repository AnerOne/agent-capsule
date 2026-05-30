import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export const CAPSULE_DIR = '.capsules';
export function slugify(input) {
    return input
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'task';
}
export function ensureDir(dir) {
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
}
export function readText(file) {
    return readFileSync(file, 'utf8');
}
export function writeText(file, content) {
    ensureDir(path.dirname(file));
    writeFileSync(file, content, 'utf8');
}
export function pathExists(file) {
    return existsSync(file);
}
export function isDirectory(file) {
    return existsSync(file) && statSync(file).isDirectory();
}
export function listMarkdownFiles(dir) {
    if (!existsSync(dir))
        return [];
    return readdirSync(dir)
        .filter((entry) => entry.endsWith('.md'))
        .filter((entry) => !entry.startsWith('templates'))
        .sort();
}
export function runGit(args, cwd = process.cwd()) {
    try {
        return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    }
    catch (error) {
        const err = error;
        const stderr = err.stderr?.toString().trim();
        throw new Error(stderr || err.message || `git ${args.join(' ')} failed`);
    }
}
export function hasGitRepo(cwd = process.cwd()) {
    try {
        runGit(['rev-parse', '--is-inside-work-tree'], cwd);
        return true;
    }
    catch {
        return false;
    }
}
export function getChangedFiles(cwd = process.cwd()) {
    if (!hasGitRepo(cwd))
        return [];
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
    }
    catch {
        // Repository has no commits yet. Fall back to status.
    }
    return parseStatusFiles(runGit(['status', '--porcelain', '--untracked-files=all'], cwd)).filter((file) => !file.startsWith('.capsules/'));
}
function parseStatusFiles(status) {
    return uniqueLines(status
        .split('\n')
        .map((line) => line.slice(3).trim())
        .map((file) => file.includes(' -> ') ? file.split(' -> ').pop() || file : file)
        .join('\n'));
}
function uniqueLines(value) {
    return Array.from(new Set(value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean))).sort();
}
export function runShell(command, cwd = process.cwd()) {
    try {
        const output = execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        return { passed: true, output: output.trim() };
    }
    catch (error) {
        const err = error;
        const output = [err.stdout?.toString(), err.stderr?.toString(), err.message].filter(Boolean).join('\n').trim();
        return { passed: false, output };
    }
}
export function matchesAny(file, patterns) {
    return patterns.some((pattern) => matchPattern(file, pattern));
}
export function matchPattern(file, pattern) {
    const normalizedFile = normalizePath(file);
    const normalizedPattern = normalizePath(pattern.trim());
    if (!normalizedPattern || normalizedPattern === '*')
        return true;
    if (normalizedPattern.endsWith('/**')) {
        const prefix = normalizedPattern.slice(0, -3);
        return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
    }
    if (normalizedPattern.endsWith('/*')) {
        const prefix = normalizedPattern.slice(0, -2);
        if (!normalizedFile.startsWith(`${prefix}/`))
            return false;
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
export function normalizePath(value) {
    return value.replaceAll('\\', '/').replace(/^\.\//, '');
}
function escapeRegExp(value) {
    return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
export function testFileChanged(files) {
    return files.some((file) => {
        const normalized = normalizePath(file).toLowerCase();
        return (normalized.includes('/test/') ||
            normalized.includes('/tests/') ||
            normalized.endsWith('.test.ts') ||
            normalized.endsWith('.test.tsx') ||
            normalized.endsWith('.spec.ts') ||
            normalized.endsWith('.spec.tsx') ||
            normalized.endsWith('.test.js') ||
            normalized.endsWith('.spec.js'));
    });
}
export function formatList(items, empty = '(none)') {
    return items.length ? items.map((item) => `- ${item}`).join('\n') : empty;
}
//# sourceMappingURL=utils.js.map