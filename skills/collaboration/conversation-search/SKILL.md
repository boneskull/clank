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

**Run:** `~/.claude/skills/collaboration/conversation-search/search-conversations "query"`

**Query tips:**
- Use natural language: "How did we handle authentication errors?"
- Be specific: "React Router data loading pattern" vs just "routing"
- Include context: "TypeScript type narrowing in guards"
- Combine concepts: "error handling in async functions"

**Example searches:**
```bash
search-conversations "debugging CI signing issues"
search-conversations "What library did we use for validation?"
search-conversations "Why did we choose approach X for feature Y?"
search-conversations "How to test async error handling"
```

## Interpreting Results

**Results show:**
1. **Project name** - Which codebase the conversation was about
2. **Date** - When the conversation happened
3. **Snippet** - First ~200 chars of the user's question
4. **File location** - Path to archived conversation + line numbers
5. **Similarity** - How relevant (higher = better match)

**To see full context:**
- Use Read tool on the file path + line range
- Or read entire conversation file if needed

**Example result:**
```
1. [react-router-7-starter, 2025-09-17]
   "How do I handle authentication errors in data loaders?"
   File: ~/.clank/conversation-archive/.../19df92b9.jsonl:145-167
   Similarity: 87.3%
```

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
