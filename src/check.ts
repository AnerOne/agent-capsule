import { getChangedFiles, matchesAny, runShell, testFileChanged } from './utils.js';
import type { Capsule, CheckIssue, CheckResult, VerifyResult } from './types.js';

export function checkCapsule(capsule: Capsule, options: { runVerify?: boolean } = {}): CheckResult {
  const changedFiles = getChangedFiles();
  const issues: CheckIssue[] = [];

  if (changedFiles.length === 0) {
    issues.push({ severity: 'info', code: 'no-changes', message: 'No changed files found in git diff.' });
  }

  if (capsule.allowedFiles.length > 0) {
    const outsideAllowed = changedFiles.filter((file) => !matchesAny(file, capsule.allowedFiles));
    if (outsideAllowed.length > 0) {
      issues.push({
        severity: 'error',
        code: 'outside-allowed-files',
        message: `${outsideAllowed.length} changed file(s) are outside Allowed files.`,
        files: outsideAllowed
      });
    }
  }

  if (capsule.forbiddenFiles.length > 0) {
    const forbidden = changedFiles.filter((file) => matchesAny(file, capsule.forbiddenFiles));
    if (forbidden.length > 0) {
      issues.push({
        severity: 'error',
        code: 'forbidden-files-touched',
        message: `${forbidden.length} forbidden file(s) were changed.`,
        files: forbidden
      });
    }
  }

  if (capsule.maxChangedFiles !== null && changedFiles.length > capsule.maxChangedFiles) {
    issues.push({
      severity: 'warning',
      code: 'too-many-files',
      message: `Changed ${changedFiles.length} files, but capsule limit is ${capsule.maxChangedFiles}.`,
      files: changedFiles
    });
  }

  if (capsule.requiresTests && changedFiles.length > 0 && !testFileChanged(changedFiles)) {
    issues.push({
      severity: 'warning',
      code: 'missing-test-change',
      message: 'Capsule requires tests, but no test file was changed.'
    });
  }

  const verifyResults: VerifyResult[] = [];
  if (options.runVerify !== false) {
    for (const command of capsule.verifyCommands) {
      const result = runShell(command);
      verifyResults.push({ command, ...result });
      if (!result.passed) {
        issues.push({
          severity: 'error',
          code: 'verify-failed',
          message: `Verify command failed: ${command}`
        });
      }
    }
  }

  return {
    capsule,
    changedFiles,
    issues,
    verifyResults,
    ok: !issues.some((issue) => issue.severity === 'error')
  };
}

export function formatCheckResult(result: CheckResult): string {
  const lines: string[] = [];
  lines.push(`Capsule check: ${result.capsule.slug}`);
  lines.push('');
  lines.push(`Changed files: ${result.changedFiles.length}`);
  for (const file of result.changedFiles) lines.push(`- ${file}`);
  if (result.changedFiles.length === 0) lines.push('- (none)');
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('✅ No scope issues found.');
  } else {
    lines.push('Issues:');
    for (const issue of result.issues) {
      const marker = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${marker} ${issue.message}`);
      for (const file of issue.files || []) lines.push(`   - ${file}`);
    }
  }

  if (result.verifyResults.length > 0) {
    lines.push('');
    lines.push('Verification:');
    for (const verify of result.verifyResults) {
      lines.push(`${verify.passed ? '✅' : '❌'} ${verify.command}`);
      if (!verify.passed && verify.output) lines.push(indent(verify.output, '   '));
    }
  }

  lines.push('');
  lines.push(result.ok ? 'Result: OK' : 'Result: needs review');
  return lines.join('\n');
}

export function buildRetryPrompt(result: CheckResult): string {
  if (result.issues.every((issue) => issue.severity === 'info')) {
    return 'No retry prompt is needed. No scope violations were found.';
  }

  const problems = result.issues
    .filter((issue) => issue.severity !== 'info')
    .flatMap((issue) => {
      if (!issue.files?.length) return [`- ${issue.message}`];
      return [`- ${issue.message}`, ...issue.files.map((file) => `  - ${file}`)];
    })
    .join('\n');

  const verifyCommands = result.capsule.verifyCommands.length
    ? result.capsule.verifyCommands.map((cmd) => `- ${cmd}`).join('\n')
    : '- Run the relevant test/typecheck command for this change.';

  return `You exceeded the task capsule.\n\n` +
    `Original goal:\n${result.capsule.goal || result.capsule.title}\n\n` +
    `Problems:\n${problems || '- No blocking problems were found, but review the diff carefully.'}\n\n` +
    `Repair instructions:\n` +
    `- Preserve valid work that directly supports the original goal.\n` +
    `- Revert unrelated changes.\n` +
    `- Do not broaden scope.\n` +
    `- Do not refactor unrelated code.\n` +
    `- Do not touch forbidden files.\n` +
    `- Add or update tests if the capsule requires tests.\n` +
    `- Rerun verification commands:\n${verifyCommands}\n` +
    `- Summarize what you changed, what you reverted, and anything you could not complete.\n`;
}

function indent(value: string, prefix: string): string {
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n');
}
