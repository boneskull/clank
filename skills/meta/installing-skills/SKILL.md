---
name: Installing Skills System
description: Fork, clone, and symlink clank repo to ~/.claude/skills
when_to_use: Initial setup, reinstalling after updates, switching skills repos
version: 1.0.0
languages: bash
---

# Installing Skills System

## Overview

Installs the clank skills repository by forking, cloning, and symlinking to `~/.claude/skills`.

**Core principle:** Fork first so you can customize skills and contribute improvements back.

## Prerequisites

- Git installed
- GitHub account
- (Optional) GitHub CLI (`gh`) for easier forking

## Quick Install

### With GitHub CLI (Recommended)

```bash
gh repo fork obra/clank --clone
cd clank
./skills/meta/installing-skills/install.sh
```

### Without GitHub CLI

1. Fork https://github.com/obra/clank via web UI
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/clank.git
   cd clank
   ./skills/meta/installing-skills/install.sh
   ```

## What install.sh Does

1. **Validates** you're running from clank repo root
2. **Backs up** existing directories with timestamps (if they exist):
   - `~/.claude/skills` → `~/.claude/skills.backup.YYYY-MM-DD-HHMMSS`
   - `~/.claude/commands` → `~/.claude/commands.backup.YYYY-MM-DD-HHMMSS`
3. **Creates symlinks**:
   - `~/.claude/skills` → `/path/to/clank/skills`
   - `~/.claude/commands` → `/path/to/clank/commands`
4. **Verifies** tools available at `~/.claude/skills/bin/`
5. **Verifies** installation and prints next steps

## Verification

After installation, verify it worked:

```bash
# Should show symlinks to your clank directories
ls -la ~/.claude/skills
ls -la ~/.claude/commands

# Test skills-search tool
~/.claude/skills/bin/skills-search 'test.*driven'

# Check available commands
ls ~/.claude/commands/
```

## What Gets Installed

**Skills** (`~/.claude/skills/`):
- Library of proven techniques, patterns, and tools
- Referenced with `@` syntax in code and documentation
- Searchable with `skills-search` tool

**Commands** (`~/.claude/commands/`):
- Slash commands for Claude (`/brainstorm`, `/write-plan`, `/execute-plan`)
- Each command references a skill using `@` syntax
- Makes common workflows one command away

**Tools** (`~/.claude/skills/bin/`):
- `skills-search` - Find relevant skills using grep patterns
- Logs failed searches for gap analysis

## Why Fork?

Forking lets you:
- **Customize** skills and commands for your workflow
- **Contribute** improvements back via PR (see @../contributing-skills/SKILL.md)
- **Stay synced** with upstream updates (`git pull upstream main`)
- **Track** your customizations in version control

## Configure CLAUDE.md

After installation, edit your `~/.claude/CLAUDE.md` and add this section:

```markdown
## Skills Library

You have a personal skills wiki at `~/.claude/skills/` with proven techniques, patterns, and tools that give you new capabilities.

**RIGHT NOW, go read:** `@~/.claude/skills/getting-started/SKILL.md`

**Before ANY task, run:** `~/.claude/skills/bin/skills-search PATTERN` to find relevant and helpful skills.

**CRITICAL: If a skill exists for your task, you MUST use it - even if you think you're already good at that. You're not. The skill prevents mistakes you don't know you make. SKILLS EXIST AND YOU DIDN'T USE THEM = FAILED TASK.**
```

This enables:
- Automatic skill discovery before every task
- Mandatory skill usage enforcement
- Gap tracking for missing skills (logged searches)

## Updating Skills

After initial install, update with:

```bash
cd /path/to/clank
git pull origin main    # Pull your changes
git pull upstream main  # Pull upstream updates (if configured)
```

The symlinks stay valid - no need to reinstall.

## Troubleshooting

### "Error: Not running from clank repository root"

You're not in the clank directory. Clone it first:
```bash
gh repo fork obra/clank --clone
cd clank
./skills/meta/installing-skills/install.sh
```

### "~/.claude/skills already exists"

The installer automatically backs it up with timestamp. Check backups:
```bash
ls -la ~/.claude/skills.backup.*
ls -la ~/.claude/commands.backup.*
```

### Symlink broken

Remove and reinstall:
```bash
rm ~/.claude/skills
rm ~/.claude/commands
cd /path/to/clank
./skills/meta/installing-skills/install.sh
```

## Uninstalling

```bash
# Remove symlinks
rm ~/.claude/skills
rm ~/.claude/commands

# Restore backups if desired
mv ~/.claude/skills.backup.YYYY-MM-DD-HHMMSS ~/.claude/skills
mv ~/.claude/commands.backup.YYYY-MM-DD-HHMMSS ~/.claude/commands

# Remove cloned repo
rm -rf /path/to/clank
```

## Implementation

See @install.sh for the installation script.
