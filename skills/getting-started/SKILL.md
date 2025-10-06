---
name: Getting Started with Skills
description: Introduction to the skills library - what it is, how to use it, how to contribute
when_to_use: Read this once at start of each project or when you need a refresher
version: 1.0.0
---

# Getting Started with Skills

## What is This?

Your personal wiki of proven techniques, patterns, and tools at `~/.claude/skills/`. External memory for effective approaches from past sessions.

## Development Workflow

**When Jesse asks for help with planning or building something**, always use `@../collaboration/brainstorming/SKILL.md` to refine the idea into a design - even if they don't say "/brainstorm".

Trigger phrases:
- "I've got an idea"
- "Let's make/build/create..."
- "I want to implement/add..."
- "What if we..."

Don't wait for explicit commands - recognize intent and use the appropriate skill.

## Skill Types

**Techniques:** Concrete methods (condition-based-waiting, root-cause-tracing)
**Patterns:** Ways of thinking (flatten-with-flags, test-invariants)
**References:** API docs, syntax guides (office docs)

## Navigation

**Start:** @../INDEX.md - Categories with descriptions

**Categories:**
- @../testing/INDEX.md
- @../debugging/INDEX.md
- @../architecture/INDEX.md
- @../collaboration/INDEX.md
- @../meta/INDEX.md

**Individual skills:** From category INDEX, load: `@../testing/condition-based-waiting/SKILL.md`

**Supporting files:** Load only when needed (`example.ts`, `script.sh`)

## Using Skills

### Quick Evaluation (2 min)
1. Frontmatter: Does `when_to_use` match?
2. Overview: Core principle relevant?
3. Quick reference: Any patterns match?
4. Implementation: How to apply?
5. Supporting files: Load only when implementing

### Application
- **Techniques:** Follow pattern, adapt code
- **Patterns:** Understand model, evaluate fit, implement if beneficial
- **References:** Find task, follow workflow

Skills are starting points - adapt to your context.

## Your Workflow: Always Start with skills-search

**Before ANY task, run:** `skills-search PATTERN`

The tool uses grep patterns. Examples:
- `skills-search 'test.*driven|TDD'`
- `skills-search 'debug.*systematic|root.cause'`
- `skills-search 'refactor|extract'`
- `skills-search 'async.*test|flaky|timeout'`

**What happens:**
1. Tool searches all skills for your pattern
2. Shows matching skills with when_to_use
3. Logs failed searches (so missing skills get created)

**If skills found:** READ them completely and FOLLOW them
**If not found:** Proceed carefully - your approach may become a skill

**Critical:** If a skill exists, you MUST use it - even if you think you're already good at that. You're not. The skill prevents mistakes you don't know you make.

## Fallback: Manual Search

If `skills-search` isn't available:
- `grep -r "keyword" ~/.claude/skills/ --include="SKILL.md"`
- Ask Jesse: "Do I have a skill for X?"

## Creating Skills

Found something valuable?
1. Note it (don't interrupt work)
2. Create while fresh
3. Follow @../meta/skill-creation/SKILL.md

## Requesting Skills

Want a skill that doesn't exist? Edit @../REQUESTS.md with what you need, when you'd use it, and why it's non-obvious.

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
| Browse all | @../INDEX.md |
| Testing | @../testing/INDEX.md |
| Debugging | @../debugging/INDEX.md |
| Architecture | @../architecture/INDEX.md |
| Create skill | @../meta/skill-creation/SKILL.md |
| Request skill | Edit @../REQUESTS.md |

**Skills are mandatory when they exist.** Not optional, not suggestions - requirements.
