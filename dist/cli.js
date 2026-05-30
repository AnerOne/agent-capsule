#!/usr/bin/env node
import { buildRetryPrompt, checkCapsule, formatCheckResult } from './check.js';
import { buildAgentPrompt, createCapsule, initCapsules, listCapsules, loadCapsule } from './capsule.js';
import { CAPSULE_DIR, hasGitRepo, isDirectory, pathExists, runGit } from './utils.js';
const VERSION = '0.1.0';
async function main() {
    const [, , command, ...args] = process.argv;
    const ctx = { args };
    try {
        switch (command) {
            case undefined:
            case '-h':
            case '--help':
            case 'help':
                printHelp();
                break;
            case '-v':
            case '--version':
            case 'version':
                console.log(VERSION);
                break;
            case 'init':
                commandInit();
                break;
            case 'new':
                commandNew(ctx);
                break;
            case 'list':
                commandList();
                break;
            case 'prompt':
                commandPrompt(ctx);
                break;
            case 'check':
                commandCheck(ctx);
                break;
            case 'retry':
                commandRetry(ctx);
                break;
            case 'doctor':
                commandDoctor();
                break;
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    }
    catch (error) {
        const err = error;
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
    }
}
function commandInit() {
    const created = initCapsules();
    console.log('agent-capsule initialized.');
    if (created.length) {
        console.log('Created:');
        for (const file of created)
            console.log(`- ${file}`);
    }
    else {
        console.log('No files created. Existing capsule configuration found.');
    }
}
function commandNew(ctx) {
    const taskName = ctx.args.join(' ').trim();
    if (!taskName)
        throw new Error('Usage: agent-capsule new "task name"');
    const file = createCapsule(taskName);
    console.log(`Created capsule: ${file}`);
    console.log(`Next: agent-capsule prompt ${file.replace(/^\.capsules\//, '').replace(/\.md$/, '')}`);
}
function commandList() {
    const capsules = listCapsules();
    if (!capsules.length) {
        console.log('No capsules found. Run: agent-capsule new "task name"');
        return;
    }
    for (const capsule of capsules)
        console.log(capsule);
}
function commandPrompt(ctx) {
    const name = requireCapsuleArg(ctx);
    const capsule = loadCapsule(name);
    console.log(buildAgentPrompt(capsule));
}
function commandCheck(ctx) {
    const name = requireCapsuleArg(ctx);
    const noVerify = ctx.args.includes('--no-verify');
    const capsule = loadCapsule(name);
    const result = checkCapsule(capsule, { runVerify: !noVerify });
    console.log(formatCheckResult(result));
    if (!result.ok)
        process.exitCode = 1;
}
function commandRetry(ctx) {
    const name = requireCapsuleArg(ctx);
    const capsule = loadCapsule(name);
    const result = checkCapsule(capsule, { runVerify: false });
    console.log(buildRetryPrompt(result));
}
function commandDoctor() {
    console.log('agent-capsule doctor');
    console.log('');
    console.log(`${hasGitRepo() ? '✅' : '❌'} git repository`);
    console.log(`${isDirectory(CAPSULE_DIR) ? '✅' : '❌'} .capsules directory`);
    console.log(`${pathExists(`${CAPSULE_DIR}/config.yml`) ? '✅' : '❌'} .capsules/config.yml`);
    const capsules = listCapsules();
    console.log(`${capsules.length > 0 ? '✅' : '⚠️'} capsules found: ${capsules.length}`);
    console.log('');
    if (hasGitRepo()) {
        const status = runGit(['status', '--short']);
        console.log('Git status:');
        console.log(status || 'clean');
    }
    console.log('');
    console.log(`Node: ${process.version}`);
    console.log(`CLI: ${VERSION}`);
}
function requireCapsuleArg(ctx) {
    const name = ctx.args.find((arg) => !arg.startsWith('--'));
    if (!name)
        throw new Error('Capsule name is required.');
    return name;
}
function printHelp() {
    console.log(`agent-capsule ${VERSION}\n\nStop letting AI coding agents freestyle. Give them a capsule.\n\nUsage:\n  agent-capsule init\n  agent-capsule new "task name"\n  agent-capsule list\n  agent-capsule prompt <capsule>\n  agent-capsule check <capsule> [--no-verify]\n  agent-capsule retry <capsule>\n  agent-capsule doctor\n`);
}
main();
//# sourceMappingURL=cli.js.map