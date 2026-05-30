# GitHub setup

If GitHub CLI is installed and authenticated:

```bash
gh repo create agent-capsule --public --source=. --remote=origin --push
```

Then add topics:

```bash
gh repo edit --add-topic ai-agents --add-topic codex --add-topic claude-code --add-topic cursor --add-topic cli --add-topic developer-tools --add-topic git --add-topic code-review --add-topic typescript --add-topic agentic-coding
```

If you do not use GitHub CLI:

1. Create a new public repository named `agent-capsule` on GitHub.
2. Then run:

```bash
git remote add origin git@github.com:YOUR_USERNAME/agent-capsule.git
git branch -M main
git push -u origin main
```
