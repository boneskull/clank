---
name: Getting Started with Skills
description: Introduction to the skills library - what it is, how to use it, how to contribute
when_to_use: Read this once at start of each project or when you need a refresher
version: 1.0.0
---

# Getting Started with Skills

## What is This?

Your personal wiki of proven techniques, patterns, and tools at `~/.claude/skills/`. External memory for effective approaches from past sessions.

## Critical: Just Writing Code is Almost Never the Right First Step

**We always need to understand requirements and create a plan first.**

When Jesse asks for help with planning or building something, your FIRST action is to use `@skills/collaboration/brainstorming/SKILL.md` to refine the idea into a design.

**Trigger phrases (activate brainstorming automatically):**
- "I've got an idea"
- "Let's make/build/create..."
- "I want to implement/add..."
- "What if we..."
- "We should..."

**Don't jump to code.** Don't wait for "/brainstorm" command. Recognize intent and activate the skill immediately.

## Skill Types

**Techniques:** Concrete methods (condition-based-waiting, root-cause-tracing)
**Patterns:** Ways of thinking (flatten-with-flags, test-invariants)
**References:** API docs, syntax guides (office docs)

## Navigation

**Start:** @skills/INDEX.md - Categories with descriptions

**Categories:**
- @skills/testing/INDEX.md
- @skills/debugging/INDEX.md
- @skills/architecture/INDEX.md
- @skills/collaboration/INDEX.md
- @skills/meta/INDEX.md

**Individual skills:** From category INDEX, load: `@skills/testing/condition-based-waiting/SKILL.md`

**Supporting files:** Load only when needed (`example.ts`, `script.sh`)

## How to Read a Skill Efficiently

**Quick evaluation (2-3 minutes):**

1. **Frontmatter (5 sec)** - Does `when_to_use` match your situation?
2. **Overview (10 sec)** - Is the core principle relevant?
3. **Quick Reference (15 sec)** - Any patterns match your need?
4. **Implementation (1-2 min)** - How to apply this
5. **Supporting files** - Load only when implementing (@example.ts, @script.sh)

**Don't read everything upfront** - evaluate relevance first, load details when applying.

## Applying Different Skill Types

**Techniques** (condition-based-waiting, root-cause-tracing):
1. Read the core pattern
2. Understand the transformation (before → after)
3. Apply to your code
4. Adapt the example if needed

**Patterns** (reducing-complexity, information-hiding):
1. Understand the mental model shift
2. Evaluate if it applies to your situation
3. Sketch the alternative architecture
4. Implement if benefits are clear

**References** (API docs, command guides):
1. Find the specific task you need
2. Follow the exact code/workflow
3. Load heavy reference docs when needed
4. Use provided scripts/tools

## When Skill Has a Checklist

**CRITICAL: If a skill has a checklist, you MUST create TodoWrite todos for each item.**

This ensures you:
- Complete all steps systematically
- Don't skip steps
- Track progress visibly
- Can't claim completion without checking all boxes

**Examples with checklists:**
- Creating skills → Todo for each checklist item
- TDD → Todo for each step (write test, watch fail, write code, etc.)
- Systematic debugging → Todo for each phase
- Code review → Todo for each review item

**Do NOT:**
- Read checklist and work through mentally
- Skip creating todos "to save time"
- Batch multiple checklist items into one todo
- Mark complete without actually doing them

**Why:** Checklists without tracking = steps get skipped. TodoWrite makes the process visible and enforced.

## When Skill Doesn't Quite Fit

**Adapt, don't abandon:**
- Core principle still applies
- Example in different language? Port it
- Pattern needs tweaking? Adapt to your context
- Tool needs modification? Fork and customize

**Skills are starting points, not rigid rules.**

## Your Workflow: Always Search for Skills First

**Before ANY task, search for relevant skills.**

**Use the skills-search tool:**
```bash
~/.claude/skills/getting-started/skills-search PATTERN
```

The tool uses grep patterns. Examples:
- `~/.claude/skills/getting-started/skills-search 'test.*driven|TDD'`
- `~/.claude/skills/getting-started/skills-search 'debug.*systematic|root.cause'`
- `~/.claude/skills/getting-started/skills-search 'refactor|extract'`

**What it does:**
1. Searches all skills for your pattern
2. Shows results: `@skills/path/SKILL.md - description`
3. Logs failed searches (gap analysis for missing skills)

**If skills found:** READ them completely and FOLLOW them
**If not found:** Proceed carefully - your approach may become a skill

**Critical:** If a skill exists, you MUST use it - even if you think you're already good at that. You're not. The skill prevents mistakes you don't know you make.

See @skills-search tool for implementation.

## Creating Skills

Found something valuable?
1. Note it (don't interrupt work)
2. Create while fresh
3. Follow @skills/meta/skill-creation/SKILL.md

## Requesting Skills

Want a skill that doesn't exist? Edit @skills/REQUESTS.md with what you need, when you'd use it, and why it's non-obvious.

## Announcing Skill Usage

When you start using any skill, announce it:

**"I'm using the [skill name] skill to [what you're doing]."**

Examples:
- "I'm using the Brainstorming skill to refine your idea into a design."
- "I'm using the Test-Driven Development skill to implement this feature."
- "I'm using the Systematic Debugging skill to find the root cause."

**Why:** Transparency helps Jesse understand your process and provides feedback opportunity.

## Principles

- **Always search first** - Run `skills-search` before starting any task
- **Announce usage** - State which skill you're using when you start
- **Read completely** - Don't skim or adapt without reading
- **Follow the skill** - It prevents mistakes you don't see
- **Log gaps** - Failed searches help create missing skills
- **Contribute back** - Found something new? Create a skill

## Quick Reference

| Need | Action |
|------|--------|
| **Starting any task** | `skills-search 'pattern'` |
| Browse all | @skills/INDEX.md |
| Testing | @skills/testing/INDEX.md |
| Debugging | @skills/debugging/INDEX.md |
| Architecture | @skills/architecture/INDEX.md |
| Create skill | @skills/meta/skill-creation/SKILL.md |
| Request skill | Edit @skills/REQUESTS.md |

**Skills are mandatory when they exist.** Not optional, not suggestions - requirements.
