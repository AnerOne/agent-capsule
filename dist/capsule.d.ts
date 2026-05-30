import type { Capsule } from './types.js';
export declare function initCapsules(): string[];
export declare function createCapsule(taskName: string): string;
export declare function listCapsules(): string[];
export declare function findCapsuleFile(nameOrSlug: string): string;
export declare function loadCapsule(nameOrSlug: string): Capsule;
export declare function buildAgentPrompt(capsule: Capsule): string;
