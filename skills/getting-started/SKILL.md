---
name: Getting Started with Skills
description: Skills wiki intro - mandatory workflows, search tool, brainstorming triggers
when_to_use: Read this FIRST at start of each conversation when skills are active
version: 2.0.0
---

# Getting Started with Skills

Your personal wiki of proven techniques, patterns, and tools at `~/.claude/skills/`.

## How to Reference Skills

**DO NOT use @ links** - they force-load entire files, burning 200k+ context instantly.

**INSTEAD, use skill path references:**
- Format: `skills/category/skill-name` (no @ prefix, no /SKILL.md suffix)
- Example: `skills/collaboration/brainstorming` or `skills/testing/test-driven-development`
- Load with Read tool only when needed

**When you see skill references in documentation:**
- `skills/path/name` → Use Read tool on `~/.claude/skills/path/name/SKILL.md`
- Load supporting files only when implementing

## Mandatory Workflow 1: Planning & Building

**When your human partner wants to start a project, no matter how big or small:**

**YOU MUST immediately read:** skills/collaboration/brainstorming

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

**Output:** skills/path/skill-name - description

**If skills found:**
1. READ the skill using Read tool: `~/.claude/skills/path/skill-name/SKILL.md`
2. ANNOUNCE usage: "I'm using the [Skill Name] skill to [purpose]"
3. FOLLOW the skill (many are rigid requirements, not suggestions)

**If not found:** Proceed carefully (search is logged for gap analysis)

**Critical:** If a skill exists for your task, you MUST use it - even if you think you're already good at that. You're not. The skill prevents mistakes you don't know you make.

**Failure condition:** Skills exist and you didn't use them = failed task.

## Mandatory Workflow 3: Historical Context Search

**When to search past conversations:**
- Jesse mentions previous work ("we did this before", "similar to X project")
- Facing an issue that feels familiar or domain-specific
- Before reinventing a solution to a common problem
- Need context on architectural decisions or patterns used previously

**When NOT to search:**
- Information already in current conversation
- Question about current codebase state (use grep/read instead)
- First-time encounter with a topic or technology
- Jesse explicitly asks for fresh thinking

**Why this saves context:**
- Dispatching subagent: 500-1000 tokens for synthesized insights
- Loading raw conversations: 50,000+ tokens of noise
- You get actionable findings, not conversation transcripts

**How to use:**
1. Dispatch subagent with template at `~/.claude/skills/collaboration/remembering-conversations/tool/prompts/search-agent.md`
2. Subagent searches, reads top results, synthesizes findings (200-1000 words)
3. You receive summary + source pointers for deeper investigation if needed
4. Never load raw conversation files directly

**Example:**
```
Jesse: "How did we handle auth errors in React Router before?"

You: I'll search past conversations for React Router auth patterns.
[Dispatch subagent with search query: "React Router authentication error handling 401"]
[Receive: 350-word synthesis of loader error patterns, gotchas, code examples]
[Use findings to answer Jesse's question without loading 50k tokens]
```

**Red flags indicating you're doing it wrong:**
- Reading .jsonl files from ~/.clank/conversation-archive directly
- Pasting conversation excerpts instead of synthesized insights
- Asking Jesse "which conversation was that?" instead of searching
- Loading multiple conversations to "browse" for answers

**The pattern:** Search → Subagent synthesizes → You apply insights. Fast, focused, context-efficient.

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

Really, try skills-search first.

**Categories:** skills/INDEX.md → testing, debugging, coding, architecture, collaboration, meta
**Individual skill:** Load from category INDEX

## How to Read a Skill

1. **Frontmatter** - `when_to_use` match your situation?
2. **Overview** - Core principle relevant?
3. **Quick Reference** - Scan for your pattern
4. **Implementation** - Full details
5. **Supporting files** - Load only when implementing

**Many skills contain rigid rules (TDD, debugging, verification).** Follow them exactly. Don't adapt away the discipline.

**Some skills are flexible patterns (architecture, naming).** Adapt core principles to your context.

The skill itself tells you which type it is.

## Referencing Skills in Documentation

**When writing documentation that references other skills:**

Use path format without `@` prefix or `/SKILL.md` suffix:
- ✅ Good: `skills/testing/test-driven-development`
- ✅ Good: `skills/debugging/systematic-debugging`
- ❌ Bad: `skills/testing/test-driven-development` (force-loads, burns context)
- ❌ Bad: `skills/testing/test-driven-development` (brittle, force-loads)

**Why no @ links:** `@` syntax force-loads files immediately, consuming 200k+ context before you need them.

**To read a skill reference:** Use Read tool on `~/.claude/skills/category/skill-name/SKILL.md`

## Creating Skills

Found something valuable? See skills/meta/creating-skills

Want a skill that doesn't exist? Edit skills/REQUESTS.md (at ~/.claude/skills/REQUESTS.md)

## Summary

**Starting conversation?** You just read this. Good.

**User proposes building something?** Use brainstorming skill immediately.

**Starting any other task?** Run skills-search first, announce usage, follow what you find.

**Skill has checklist?** TodoWrite for every item.

**Skills are mandatory when they exist, not optional.**


## Last thing

In the first response after reading this guide, you MUST announce to the user that you have read the getting started guide
