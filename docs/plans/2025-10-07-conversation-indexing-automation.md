# Conversation Indexing Automation & Integration Plan

> **For Claude:** Use skills/collaboration/executing-plans to implement this plan task-by-task.

**Goal:** Automate conversation indexing via sessionEnd hook, handle edge cases robustly, and integrate deep conversation search into getting-started workflow using subagents to prevent context bloat.

**Key Principles:**
- sessionEnd hook indexes automatically
- Cleanup handles missed conversations
- Detect and re-index updated conversations
- Subagents do deep search, return synthesized results only

---

## Task 1: Robust Conversation Change Detection

**Problem:** Need to detect if a conversation has been updated since last indexing.

**Files:**
- Modify: `tool/src/indexer.ts`

**Implementation:**

Add function to check if conversation needs reindexing:

```typescript
function needsReindexing(archivePath: string, summaryPath: string): boolean {
  // If no summary exists, needs indexing
  if (!fs.existsSync(summaryPath)) {
    return true;
  }

  // Check if JSONL is newer than summary
  const jsonlStat = fs.statSync(archivePath);
  const summaryStat = fs.statSync(summaryPath);

  return jsonlStat.mtimeMs > summaryStat.mtimeMs;
}
```

Update `indexConversations`, `indexSession`, and `indexUnprocessed` to use this check.

**Test:**
1. Index a conversation
2. Touch the JSONL file to update mtime
3. Run `--cleanup` - should re-index

**Commit:** `feat: detect and re-index updated conversations`

---

## Task 2: Install sessionEnd Hook

**Files:**
- Create: `~/.claude/hooks/sessionEnd`
- Update: `INDEXING.md`

**Implementation:**

```bash
#!/bin/bash
# sessionEnd hook - auto-index conversations after each session

INDEXER="$HOME/.claude/skills/collaboration/remembering-conversations/tool/index-conversations"

if [ -n "$SESSION_ID" ] && [ -x "$INDEXER" ]; then
  # Run in background, log errors
  "$INDEXER" --session "$SESSION_ID" >> ~/.clank/conversation-index/indexer.log 2>&1 &
fi
```

**Steps:**
1. Create ~/.claude/hooks/ if doesn't exist
2. Copy hook from tool/hooks/sessionEnd
3. Make executable
4. Update INDEXING.md with installation instructions

**Test:**
1. Start a claude session
2. Exit
3. Check ~/.clank/conversation-index/indexer.log
4. Verify conversation was indexed

**Commit:** `docs: add sessionEnd hook installation instructions`

---

## Task 3: Scheduled Cleanup for Missed Conversations

**Problem:** Sessions might exit abnormally, hook might fail, need safety net.

**Files:**
- Create: `tool/scripts/daily-cleanup.sh`
- Update: `INDEXING.md`

**Implementation:**

Create script that runs `--cleanup` mode:

```bash
#!/bin/bash
# Daily cleanup - index any conversations missed by sessionEnd hook

cd "$(dirname "$0")/.."
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=20000

echo "[$(date)] Running conversation cleanup..."
./index-conversations --cleanup >> ~/.clank/conversation-index/cleanup.log 2>&1
echo "[$(date)] Cleanup complete"
```

Add launchd plist for daily execution (macOS):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict