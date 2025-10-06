# Clank - Claude Skills Library

A comprehensive library of proven techniques, patterns, and tools for Claude AI agents to write better code, debug systematically, and maintain high-quality software.

## Quick Start

### 1. Install

**With GitHub CLI (recommended):**
```bash
mkdir -p ~/.clank
cd ~/.clank
gh repo fork obra/clank --clone --remote-name upstream
cd clank
./skills/meta/installing-skills/install.sh
```

**Without GitHub CLI:**
1. Fork via GitHub web UI
2. Clone to ~/.clank:
   ```bash
   mkdir -p ~/.clank
   cd ~/.clank
   git clone https://github.com/YOUR_USERNAME/clank.git
   cd clank
   ./skills/meta/installing-skills/install.sh
   ```

### 2. Configure CLAUDE.md

The installer will print a snippet to add to `~/.claude/CLAUDE.md`.

Copy that snippet and add it to your CLAUDE.md file.

### 3. Verify

```bash
# Test skills-search tool
~/.claude/skills/getting-started/skills-search 'test.*driven'

# Check commands
ls ~/.claude/commands/
```

### 4. Use

**Find skills for your task:**
```bash
~/.claude/skills/getting-started/skills-search 'async.*test|flaky'
~/.claude/skills/getting-started/skills-search 'debug.*systematic'
~/.claude/skills/getting-started/skills-search 'refactor'
```

**Use workflow commands:**
- `/brainstorm` - Interactive idea refinement
- `/write-plan` - Create detailed implementation plan
- `/execute-plan` - Execute plan in batches

## What's Inside

### Skills Library

- **Testing** - TDD, async testing, anti-patterns
- **Coding** - Design patterns, naming, refactoring, validation
- **Debugging** - Systematic debugging, root cause tracing, defense-in-depth
- **Architecture** - Complexity management, encapsulation, abstraction
- **Collaboration** - Brainstorming, planning, code review, parallel agents
- **Meta** - Installing, using, creating, and testing skills

### Commands

Quick-access slash commands that reference skills:
- **brainstorm** - Interactive design refinement using Socratic method
- **write-plan** - Detailed implementation plans with bite-sized tasks
- **execute-plan** - Batch execution with review checkpoints

### Skill Format

Each skill follows a consistent structure:
- **When to use** - Symptoms and situations (optimized for search)
- **Overview** - Core principle and what it solves
- **Quick reference** - Tables and examples for fast lookup
- **Implementation** - Detailed guidance and code examples
- **Common mistakes** - Anti-patterns to avoid

## Why Fork?

Forking (rather than just cloning) lets you:
- **Customize** skills for your workflow
- **Contribute** improvements back via pull request
- **Stay synced** with upstream updates
- **Track** your customizations in version control

## Contributing

See [skills/meta/contributing-skills/SKILL.md](skills/meta/contributing-skills/SKILL.md) for how to contribute skills back to the community.

## Philosophy

These skills embody:
- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Domain over implementation** - Work at problem level, not solution level

## License

MIT License - see LICENSE file for details

## Maintenance

Update your skills regularly:

```bash
cd /path/to/clank
git pull origin main      # Your changes
git pull upstream main    # Upstream updates (if configured)
```

The symlink stays valid - no reinstall needed.
