import path from 'node:path';
import { CAPSULE_DIR, ensureDir, listMarkdownFiles, pathExists, readText, slugify, writeText } from './utils.js';
import type { Capsule } from './types.js';

const TEMPLATE_PATH = path.join(CAPSULE_DIR, 'templates', 'default.md');
const CONFIG_PATH = path.join(CAPSULE_DIR, 'config.yml');

export function initCapsules(): string[] {
  const created: string[] = [];
  ensureDir(CAPSULE_DIR);
  ensureDir(path.join(CAPSULE_DIR, 'templates'));

  if (!pathExists(TEMPLATE_PATH)) {
    writeText(TEMPLATE_PATH, defaultTemplate());
    created.push(TEMPLATE_PATH);
  }

  if (!pathExists(CONFIG_PATH)) {
    writeText(CONFIG_PATH, defaultConfig());
    created.push(CONFIG_PATH);
  }

  return created;
}

export function createCapsule(taskName: string): string {
  initCapsules();
  const slug = slugify(taskName);
  const filePath = path.join(CAPSULE_DIR, `${slug}.md`);
  if (pathExists(filePath)) {
    throw new Error(`Capsule already exists: ${filePath}`);
  }

  const title = toTitle(taskName);
  const content = defaultCapsule(title, slug);
  writeText(filePath, content);
  return filePath;
}

export function listCapsules(): string[] {
  return listMarkdownFiles(CAPSULE_DIR)
    .filter((file) => file !== 'templates/default.md')
    .map((file) => file.replace(/\.md$/, ''));
}

export function findCapsuleFile(nameOrSlug: string): string {
  const slug = slugify(nameOrSlug);
  const candidates = [
    path.join(CAPSULE_DIR, `${nameOrSlug}.md`),
    path.join(CAPSULE_DIR, `${slug}.md`)
  ];

  for (const candidate of candidates) {
    if (pathExists(candidate)) return candidate;
  }

  const found = listMarkdownFiles(CAPSULE_DIR).find((file) => file.replace(/\.md$/, '') === nameOrSlug || file.replace(/\.md$/, '') === slug);
  if (found) return path.join(CAPSULE_DIR, found);

  throw new Error(`Capsule not found: ${nameOrSlug}`);
}

export function loadCapsule(nameOrSlug: string): Capsule {
  const filePath = findCapsuleFile(nameOrSlug);
  const text = readText(filePath);
  const sections = parseSections(text);
  const slug = path.basename(filePath, '.md');
  const titleLine = text.split('\n').find((line) => line.startsWith('# '));
  const title = titleLine?.replace(/^#\s+/, '').replace(/^Task Capsule:\s*/i, '').trim() || slug;

  return {
    slug,
    filePath,
    title,
    goal: sectionText(sections, 'goal'),
    context: sectionText(sections, 'context'),
    allowedFiles: sectionList(sections, 'allowed files'),
    forbiddenFiles: sectionList(sections, 'forbidden files'),
    doneCriteria: sectionList(sections, 'done criteria'),
    verifyCommands: sectionList(sections, 'verify commands'),
    maxChangedFiles: sectionNumber(sections, 'maximum changed files'),
    requiresTests: sectionBoolean(sections, 'requires tests'),
    notesForAgent: sectionText(sections, 'notes for agent')
  };
}

export function buildAgentPrompt(capsule: Capsule): string {
  return `You are working inside a task capsule. Stay strictly inside the scope.\n\n` +
    `Task: ${capsule.title}\n\n` +
    `Goal:\n${capsule.goal || '(not specified)'}\n\n` +
    `Context:\n${capsule.context || '(not specified)'}\n\n` +
    `Allowed files:\n${formatBullets(capsule.allowedFiles)}\n\n` +
    `Forbidden files:\n${formatBullets(capsule.forbiddenFiles)}\n\n` +
    `Done criteria:\n${formatBullets(capsule.doneCriteria)}\n\n` +
    `Verify commands:\n${formatBullets(capsule.verifyCommands)}\n\n` +
    `Maximum changed files: ${capsule.maxChangedFiles ?? 'not specified'}\n` +
    `Requires tests: ${capsule.requiresTests ? 'yes' : 'no'}\n\n` +
    `Rules for the coding agent:\n` +
    `- Do not refactor unrelated code.\n` +
    `- Do not touch forbidden files.\n` +
    `- If you need to touch files outside Allowed files, stop and explain why.\n` +
    `- Make the smallest useful change.\n` +
    `- Run the verification commands when possible.\n` +
    `- Summarize changed files and anything you could not complete.\n\n` +
    `Notes for agent:\n${capsule.notesForAgent || '(none)'}\n`;
}

function parseSections(text: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let current = '';

  for (const line of text.split('\n')) {
    const heading = line.match(/^##\s+(.+)\s*$/);
    if (heading) {
      current = normalizeHeading(heading[1]);
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)?.push(line);
  }

  return sections;
}

function normalizeHeading(value: string): string {
  return value.trim().toLowerCase();
}

function sectionText(sections: Map<string, string[]>, key: string): string {
  return (sections.get(normalizeHeading(key)) || [])
    .join('\n')
    .trim()
    .replace(/^[-*]\s+/gm, '')
    .trim();
}

function sectionList(sections: Map<string, string[]>, key: string): string[] {
  return (sections.get(normalizeHeading(key)) || [])
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line && line !== '(none)' && line !== 'none');
}

function sectionNumber(sections: Map<string, string[]>, key: string): number | null {
  const raw = sectionText(sections, key);
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function sectionBoolean(sections: Map<string, string[]>, key: string): boolean {
  const raw = sectionText(sections, key).toLowerCase();
  return ['yes', 'true', 'required', '1'].some((value) => raw.includes(value));
}

function formatBullets(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- (none)';
}

function toTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').replace(/^./, (char) => char.toUpperCase());
}

function defaultConfig(): string {
  return `# agent-capsule config\n# Reserved for future defaults.\nversion: 1\n`;
}

function defaultTemplate(): string {
  return `# Task Capsule: {{title}}\n\n## Goal\nDescribe the exact outcome.\n\n## Context\nAdd only the context the agent needs.\n\n## Allowed files\n- src/**\n- tests/**\n\n## Forbidden files\n- .env\n- .env.*\n- package-lock.json\n\n## Done criteria\n- The bug or feature is complete.\n- The change is small and scoped.\n- The relevant tests pass.\n\n## Verify commands\n- npm test\n\n## Maximum changed files\n6\n\n## Requires tests\nyes\n\n## Notes for agent\nDo not refactor unrelated code.\n`;
}

function defaultCapsule(title: string, slug: string): string {
  return defaultTemplate().replace('{{title}}', title).replace('Describe the exact outcome.', `Implement: ${title}.`).replace('Add only the context the agent needs.', `Capsule slug: ${slug}. Replace this with relevant context before giving the prompt to an agent.`);
}
