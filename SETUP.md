# Clank Setup Summary

## What We Built

A standalone skills library system with:
1. **Skills library** - Battle-tested techniques and patterns
2. **Slash commands** - Quick workflow triggers (`/brainstorm`, `/write-plan`, etc.)
3. **Discovery tool** - `skills-search` for finding relevant skills
4. **Gap tracking** - Failed searches logged for skill creation
5. **Installation system** - One-command setup

## Repository Structure

```
clank/
├── README.md                           # Main documentation
├── SETUP.md                            # This file
├── skills/
│   ├── CLAUDE_MD_REFERENCE.md          # Copy to your CLAUDE.md
│   ├── bin/
│   │   └── skills-search               # Skill discovery tool
│   ├── testing/                        # TDD, async testing
│   ├── coding/                         # Design, naming, refactoring
│   ├── debugging/                      # Systematic debugging
│   ├── architecture/                   # Complexity, encapsulation
│   ├── collaboration/                  # Planning, code review
│   └── meta/
│       ├── installing-skills/          # Installation skill + script
│       └── gardening-skills-wiki/      # Wiki maintenance + gap analysis
└── commands/
    ├── brainstorm.md                   # → @skills/collaboration/brainstorming
    ├── write-plan.md                   # → @skills/collaboration/writing-plans
    └── execute-plan.md                 # → @skills/collaboration/executing-plans
```

## Installation

```bash
# 1. Fork and clone
gh repo fork obra/clank --clone
cd clank

# 2. Run installer
./skills/meta/installing-skills/install.sh
```

**What the installer does:**
- Backs up existing `~/.claude/skills` and `~/.claude/commands` (timestamped)
- Creates symlinks to your cloned repo
- Installs `skills-search` tool to `~/.local/bin`
- Verifies installation

## Add to Your CLAUDE.md

Copy content from `skills/CLAUDE_MD_REFERENCE.md` into your `~/.claude/CLAUDE.md`:

```markdown
## Skills Library

Before ANY task: `skills-search PATTERN`

**skills-search uses grep patterns.** Examples:
- `skills-search 'test.*driven|TDD'`
- `skills-search 'debug.*systematic|root.cause'`
- `skills-search 'refactor|extract'`

**Process:**
1. Run `skills-search` with grep pattern for what you're doing
2. If skills found: READ them completely and FOLLOW them
3. If not found: Proceed carefully (search is logged for gap analysis)

**Critical:** If a skill exists for your task, you MUST use it - even if you think you're already good at that. You're not.

**Failure condition:** Skills exist and you didn't use them = you failed.

**RIGHT NOW, go read:** `@~/.claude/skills/getting-started/SKILL.md`
```

## Usage

### Finding Skills

```bash
# Search for skills
skills-search 'test.*driven|TDD'
skills-search 'debug.*systematic'
skills-search 'async.*test|flaky'
skills-search 'validat.*input'
```

### Using Commands

In Claude:
- `/brainstorm` - Interactive design refinement
- `/write-plan` - Create implementation plan
- `/execute-plan` - Execute plan in batches

### Maintenance

```bash
# Update skills from upstream
cd /path/to/clank
git pull origin main

# Check wiki health
~/.claude/skills/meta/gardening-skills-wiki/garden.sh

# Analyze what skills are missing
~/.claude/skills/meta/gardening-skills-wiki/analyze-search-gaps.sh
```

## Key Design Decisions

1. **Tool-first discovery** - `skills-search` makes finding skills easier than not finding them
2. **Automatic gap tracking** - Failed searches logged, no manual request filing needed
3. **Grep patterns** - Leverages agent's existing grep knowledge
4. **Generalized** - No hardcoded skills in CLAUDE.md, system is extensible
5. **Workflow gate** - Skills become mandatory part of workflow, not optional reference

## Testing Results

Pressure-tested variants showed:
- **NULL baseline** - Agents want to check for help naturally
- **Soft suggestions** - "Consider checking" gives permission to skip (failed)
- **Emphatic commands** - "MUST check" maintained compliance under all pressures
- **Tool makes compliance easy** - Single command vs remembering grep syntax

## Next Steps

1. Install clank following instructions above
2. Add CLAUDE_MD_REFERENCE.md content to your CLAUDE.md
3. Verify `skills-search` works
4. Start using skills in your workflow
5. Monitor `.search-log.jsonl` for gaps
