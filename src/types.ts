export type Capsule = {
  slug: string;
  filePath: string;
  title: string;
  goal: string;
  context: string;
  allowedFiles: string[];
  forbiddenFiles: string[];
  doneCriteria: string[];
  verifyCommands: string[];
  maxChangedFiles: number | null;
  requiresTests: boolean;
  notesForAgent: string;
};

export type CheckSeverity = 'info' | 'warning' | 'error';

export type CheckIssue = {
  severity: CheckSeverity;
  code: string;
  message: string;
  files?: string[];
};

export type VerifyResult = {
  command: string;
  passed: boolean;
  output: string;
};

export type CheckResult = {
  capsule: Capsule;
  changedFiles: string[];
  issues: CheckIssue[];
  verifyResults: VerifyResult[];
  ok: boolean;
};
