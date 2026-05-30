import type { Capsule, CheckResult } from './types.js';
export declare function checkCapsule(capsule: Capsule, options?: {
    runVerify?: boolean;
}): CheckResult;
export declare function formatCheckResult(result: CheckResult): string;
export declare function buildRetryPrompt(result: CheckResult): string;
