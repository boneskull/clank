---
name: Conversation Search
description: Search previous Claude Code conversations for facts, patterns, decisions, and context
when_to_use: When you need information from previous conversations. When Jesse mentions "we discussed this before". When debugging similar issues. When trying to remember architectural decisions. When looking for code patterns used previously. Before reinventing solutions.
version: 1.0.0
---

# Conversation Search

## Overview

Search through all previous Claude Code conversations using semantic search. Find facts, patterns, approaches, and decisions from past work.

**Core principle:** Don't reinvent what's already been solved. Search before implementing.

**Announce when using:** "I'm searching previous conversations for [topic]."

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

## How to Search

**Basic search:**
```bash
search-conversations "your query"
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

## Indexing New Conversations

**To index new conversations:**
```bash
~/.claude/skills/collaboration/conversation-search/index-conversations
```

**When to re-index:**
- After major work sessions (daily/weekly)
- When Jesse asks about recent conversations
- Manually triggered (not automated yet)

**What indexing does:**
1. Scans `~/.claude/projects/` for new `.jsonl` files
2. Archives them to `~/.clank/conversation-archive/`
3. Generates embeddings for searchability
4. Updates SQLite vector database

## Limitations

**Conversation search cannot:**
- Search current conversation (use context instead)
- Find code in current codebase (use Grep/Glob)
- See conversations not yet indexed (run indexer)
- Access expired conversations unless archived

**Quality depends on:**
- How well conversations were documented
- Specificity of your search query
- Whether similar topics were discussed before

## Remember

- Search before reinventing
- Combine with journal for best results
- Read full context when snippet isn't enough
- Re-index periodically to include recent conversations
- Announce when you search (transparency)
