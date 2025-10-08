---
name: Remembering Conversations
description: Search previous Claude Code conversations for facts, patterns, decisions, and context using semantic or text search
when_to_use: When Jesse mentions "we discussed this before". When debugging similar issues. When looking for architectural decisions or code patterns from past work. Before reinventing solutions. When you need to find a specific git SHA or error message.
version: 1.0.0
---

# Remembering Conversations

## Overview

Search archived conversations using semantic similarity or exact text matching. Find facts, patterns, approaches, and decisions from past work.

**Core principle:** Search before reinventing.

**Announce when using:** "I'm searching previous conversations for [topic]."

**For setup/management:** See INDEXING.md (install hook, index all conversations, recovery modes)

## When to Use

**Search conversations when:**
- Jesse mentions "we discussed this before" or "remember when"
- Debugging issues similar to past problems
- Looking for architectural decisions and their rationale
- Trying to recall code patterns or approaches used
- Understanding why something was implemented a certain way
- Before implementing something that feels familiar

**Don't search when:**
- Information is in current conversation
- Question is about current codebase state (use file search instead)
- Looking for active code (use Grep/Read instead)

## Integration with Getting-Started

**The getting-started skill teaches the mandatory subagent workflow for in-session searches.**

When searching from a main conversation, **always use subagents** to prevent context bloat:
- Direct search loads 50k tokens per conversation
- Subagent synthesis returns 500-1000 tokens total
- **50-100x context savings**

**Subagent workflow (see skills/getting-started):**
1. Announce: "I'm searching previous conversations for [topic]"
2. Dispatch general-purpose subagent with search template at `tool/prompts/search-agent.md`
3. Subagent searches, reads top 2-5 results, synthesizes (max 1000 words) + source pointers
4. Use synthesis in main context
5. If more detail needed: dispatch follow-up subagent (recommended) OR read sources directly (discouraged)

**Two use cases:**
- **In-session (main conversation):** Use subagent pattern (mandatory, covered by getting-started)
- **Manual/command-line (outside session):** Direct search (documented below)

## Direct Search (Manual/Command-Line Use)

**For manual use outside Claude Code sessions:**

**Basic search:**
```bash
~/.claude/skills/collaboration/remembering-conversations/tool/search-conversations "your query"
```

**Search modes:**
```bash
# Vector similarity (default) - semantic search
search-conversations "authentication errors"

# Text search - exact string matching (for git SHAs, error codes, etc.)
search-conversations --text "a1b2c3d4"

# Both - combines vector and text results
search-conversations --both "React Router"
```

**Time filtering:**
```bash
# Conversations after a date
search-conversations --after 2025-10-01 "bug fix"

# Conversations before a date
search-conversations --before 2025-09-01 "refactoring"

# Date range
search-conversations --after 2025-08-01 --before 2025-09-01 "feature"
```

**Other options:**
```bash
# Limit results (default: 10)
search-conversations --limit 20 "testing"
```

**Query tips for vector search:**
- Use natural language: "How did we handle authentication errors?"
- Be specific: "React Router data loading" vs just "routing"
- Include context: "TypeScript type narrowing in guards"

## Interpreting Results

**Results show:**
1. **Project name and date** - Which codebase and when
2. **Conversation summary** - AI-generated overview of what the conversation was about
3. **Matched exchange** - The specific user/assistant exchange that matched your query
4. **Similarity percentage** - How relevant (vector search only)
5. **File location** - Path to archived conversation + line numbers

**Example result:**
```
1. [react-router-7-starter, 2025-09-17]
   Built authentication system with JWT tokens and refresh logic.
   Implemented protected routes and fixed token expiration handling.

   92% match: "How do I handle authentication errors in data loaders?"
   ~/.clank/conversation-archive/.../19df92b9.jsonl:145-167
```

**To see full context:**
- Use Read tool on the file path with line range
- Or read the entire conversation file

## Integration with Journal

**Use conversation search for:**
- Full context of past discussions
- Code examples and implementations
- Step-by-step problem solving
- Architectural debates and decisions

**Use journal search for:**
- Your personal insights and lessons
- Technical notes you recorded
- Patterns you identified
- Jesse's preferences you documented

**Both together:** Search journal first (your curated notes), then conversations (raw history).

## Workflow Example

```
Jesse: "How did we handle that rate limiting issue last month?"

You: I'm searching previous conversations for rate limiting solutions.
> search-conversations "rate limiting implementation"

[Results show conversation from Sept 15]
> Read archived conversation at lines 89-145

Found it! We implemented a Redis-based rate limiter using...
[Explain the solution found]
```

## Managing the Index

For indexing, archiving, and managing conversations, see **INDEXING.md** in this directory.

## Remember

- Search before reinventing
- Combine with journal for best results
- Read full context when needed
- Announce when you search (transparency)
