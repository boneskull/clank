---
name: Getting Started with Skills
description: Skills wiki intro - mandatory workflows, search tool, brainstorming triggers
when_to_use: Read this FIRST at start of each conversation when skills are active
version: 2.0.0
---

# Getting Started with Skills

Your personal wiki of proven techniques, patterns, and tools at `~/.claude/skills/`.

## Mandatory Workflow 1: Planning & Building

**When your human partner wants to start a project, no matter how big or small:**

**YOU MUST immediately use:** `@skills/collaboration/brainstorming/SKILL.md`

**Don't:**
- Jump straight to code
- Wait for /brainstorm command
- Skip brainstorming because you "understand the idea"

**Why:** Just writing code is almost never the right first step. We always understand requirements and plan first.

## Mandatory Workflow 2: Before ANY Other Task

**Run:** `~/.claude/skills/getting-started/skills-search PATTERN`

The tool uses grep patterns:
```bash
~/.claude/skills/getting-started/skills-search 'test.*driven|TDD'
~/.claude/skills/getting-started/skills-search 'debug.*systematic|root.cause'
~/.claude/skills/getting-started/skills-search 'refactor|extract'
```

**Output:** `@skills/path/SKILL.md - description`

**If skills found:**
1. READ them completely (don't skim)
2. ANNOUNCE usage: "I'm using the [Skill Name] skill to [purpose]"
3. FOLLOW the skill (many are rigid requirements, not suggestions)

**If not found:** Proceed carefully (search is logged for gap analysis)

**Critical:** If a skill exists for your task, you MUST use it - even if you think you're already good at that. You're not. The skill prevents mistakes you don't know you make.

**Failure condition:** Skills exist and you didn't use them = failed task.

## Announcing Skill Usage

**Every time you start using a skill, announce it:**

"I'm using the [Skill Name] skill to [what you're doing]."

**Examples:**
- "I'm using the Brainstorming skill to refine your idea into a design."
- "I'm using the Test-Driven Development skill to implement this feature."
- "I'm using the Systematic Debugging skill to find the root cause."
- "I'm using the Refactoring Safely skill to extract these methods."

**Why:** Transparency helps your human partner understand your process and catch errors early.

## Skills with Checklists

**If a skill contains a checklist, you MUST create TodoWrite todos for EACH checklist item.**

**Don't:**
- Work through checklist mentally
- Skip creating todos "to save time"
- Batch multiple items into one todo
- Mark complete without doing them

**Why:** Checklists without TodoWrite tracking = steps get skipped. Every time.

**Examples:** TDD (write test, watch fail, implement, verify), Systematic Debugging (4 phases), Creating Skills (RED-GREEN-REFACTOR)

## Navigation

**Categories:** @skills/INDEX.md → testing, debugging, coding, architecture, collaboration, meta

**Individual skill:** Load from category INDEX

**Tool:** See @skills-search implementation

## How to Read a Skill

1. **Frontmatter** - `when_to_use` match your situation?
2. **Overview** - Core principle relevant?
3. **Quick Reference** - Scan for your pattern
4. **Implementation** - Full details
5. **Supporting files** - Load only when implementing

**Many skills contain rigid rules (TDD, debugging, verification).** Follow them exactly. Don't adapt away the discipline.

**Some skills are flexible patterns (architecture, naming).** Adapt core principles to your context.

The skill itself tells you which type it is.

## Creating Skills

Found something valuable? `@skills/meta/creating-skills/SKILL.md`

Want a skill that doesn't exist? Edit `@skills/REQUESTS.md`

## Summary

**Starting conversation?** You just read this. Good.

**User proposes building something?** Use brainstorming skill immediately.

**Starting any other task?** Run skills-search first, announce usage, follow what you find.

**Skill has checklist?** TodoWrite for every item.

**Skills are mandatory when they exist, not optional.**


## Last thing

In the first response after reading this guide, you MUST announce to the user that you have read the getting started guide
