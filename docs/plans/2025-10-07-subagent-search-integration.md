# Subagent Conversation Search Integration

> **For Claude:** Critical feature to prevent context bloat

**Goal:** Enable Claude to search historical conversations using a subagent that returns only synthesized findings, not full conversation text.

**Context bloat problem:** Loading 5-10 full conversations into main context = 50-100k tokens wasted. Solution: Subagent searches, reads, synthesizes, returns <1k token summary.

---

## Task 1: Create Conversation Search Agent Prompt

**Files:**
- Create: `tool/prompts/search-agent.md`

**Prompt content:**