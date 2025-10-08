# Conversation Search Deployment Plan

## Overview

Deploy conversation search system to production with:
1. Automated indexing via sessionEnd hook
2. Recovery procedures for missed/updated conversations
3. Subagent integration to prevent context bloat
4. Getting-started skill integration

**Critical requirement:** Subagent pattern must synthesize findings (max 1000 words) + return source pointers. Main agent can then choose to dig deeper via subagent or read sources directly (discouraged).

---

## Task 1: Hook Installation Script

**Goal:** Install sessionEnd hook with merge logic for existing hooks

**Create:** `tool/install-hook`

```bash
#!/bin/bash
# Install sessionEnd hook with merge support

HOOK_DIR="$HOME/.claude/hooks"
HOOK_FILE="$HOOK_DIR/sessionEnd"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_HOOK="$SCRIPT_DIR/hooks/sessionEnd"

echo "Installing conversation indexing hook..."

# Create hooks directory
mkdir -p "$HOOK_DIR"

# Handle existing hook
if [ -f "$HOOK_FILE" ]; then
  echo "⚠️  Existing sessionEnd hook found"

  # Create backup
  BACKUP="$HOOK_FILE.backup.$(date +%s)"
  cp "$HOOK_FILE" "$BACKUP"
  echo "Created backup: $BACKUP"

  # Check if our indexer is already installed
  if grep -q "remembering-conversations.*index-conversations" "$HOOK_FILE"; then
    echo "✓ Indexer already installed in existing hook"
    exit 0
  fi

  # Offer merge or replace
  echo ""
  echo "Options:"
  echo "  (m) Merge - Add indexer to existing hook"
  echo "  (r) Replace - Overwrite with our hook"
  echo "  (c) Cancel - Exit without changes"
  echo ""
  read -p "Choose [m/r/c]: " choice

  case "$choice" in
    m|M)
      # Append our indexer
      cat >> "$HOOK_FILE" <<'EOF'

# Auto-index conversations (remembering-conversations skill)
INDEXER="$HOME/.claude/skills/collaboration/remembering-conversations/tool/index-conversations"
if [ -n "$SESSION_ID" ] && [ -x "$INDEXER" ]; then
  "$INDEXER" --session "$SESSION_ID" > /dev/null 2>&1 &
fi
EOF
      echo "✓ Merged indexer into existing hook"
      ;;
    r|R)
      cp "$SOURCE_HOOK" "$HOOK_FILE"
      chmod +x "$HOOK_FILE"
      echo "✓ Replaced hook with our version"
      ;;
    c|C)
      echo "Installation cancelled"
      exit 1
      ;;
    *)
      echo "Invalid choice. Exiting."
      exit 1
      ;;
  esac
else
  # No existing hook, install fresh
  cp "$SOURCE_HOOK" "$HOOK_FILE"
  chmod +x "$HOOK_FILE"
  echo "✓ Installed sessionEnd hook"
fi

# Verify executable
if [ ! -x "$HOOK_FILE" ]; then
  chmod +x "$HOOK_FILE"
fi

echo ""
echo "Hook installed successfully!"
echo "Location: $HOOK_FILE"
echo ""
echo "Test it:"
echo "  SESSION_ID=test-\$(date +%s) $HOOK_FILE"
```

**Test:**
- Run with no existing hook → installs fresh
- Run with existing hook → offers merge/replace
- Run with existing hook containing indexer → detects and exits
- Verify hook is executable after installation

**Acceptance:**
- Script handles all three scenarios correctly
- Backup is created when merging/replacing
- Installed hook works (tested with real session ID)

---

## Task 2: Recovery Modes (Cleanup, Verify, Repair)

**Goal:** Handle missed conversations and detect inconsistencies

### 2a. Add Verification Function

**File:** `tool/src/verify.ts`

```typescript
export interface VerificationResult {
  missing: Array<{path: string, reason: string}>;
  orphaned: Array<{uuid: string, path: string}>;
  outdated: Array<{path: string, fileTime: number, dbTime: number}>;
  corrupted: Array<{path: string, error: string}>;
}

export async function verifyIndex(): Promise<VerificationResult> {
  const result: VerificationResult = {
    missing: [],
    orphaned: [],
    outdated: [],
    corrupted: []
  };

  // Find all conversation files
  const conversationFiles = findAllConversations();
  const fileUUIDs = new Set(conversationFiles.map(f => f.uuid));

  console.log(`Verifying ${conversationFiles.length} conversations...`);

  // Check each file (with progress)
  for (let i = 0; i < conversationFiles.length; i++) {
    const conv = conversationFiles[i];

    if (i % 100 === 0 && i > 0) {
      console.log(`  Checked ${i}/${conversationFiles.length}...`);
    }
    const summaryPath = conv.path.replace('.jsonl', '-summary.txt');

    // Missing summary?
    if (!fs.existsSync(summaryPath)) {
      result.missing.push({path: conv.path, reason: 'No summary file'});
      continue;
    }

    // Check database
    const dbEntry = await getDBEntry(conv.uuid);

    if (!dbEntry) {
      result.missing.push({path: conv.path, reason: 'Not in database'});
      continue;
    }

    // Check if file is newer than DB entry
    const fileStat = fs.statSync(conv.path);
    if (dbEntry.last_indexed && fileStat.mtimeMs > dbEntry.last_indexed) {
      result.outdated.push({
        path: conv.path,
        fileTime: fileStat.mtimeMs,
        dbTime: dbEntry.last_indexed
      });
    }

    // Try parsing to detect corruption
    try {
      await parseConversation(conv.path);
    } catch (error) {
      result.corrupted.push({path: conv.path, error: error.message});
    }
  }

  // Find orphaned database entries
  const dbUUIDs = await getAllDBUUIDs();
  for (const uuid of dbUUIDs) {
    if (!fileUUIDs.has(uuid)) {
      const entry = await getDBEntry(uuid);
      result.orphaned.push({uuid, path: entry.file_path});
    }
  }

  return result;
}

export async function repairIndex(issues: VerificationResult): Promise<void> {
  console.log('Repairing index...');

  // Re-index missing and outdated
  const toReindex = [
    ...issues.missing.map(m => m.path),
    ...issues.outdated.map(o => o.path)
  ];

  for (const path of toReindex) {
    console.log(`Re-indexing: ${path}`);
    await indexConversation(path);
  }

  // Remove orphaned entries
  for (const orphan of issues.orphaned) {
    console.log(`Removing orphaned entry: ${orphan.uuid}`);
    await deleteFromDB(orphan.uuid);
  }

  // Report corrupted (manual intervention needed)
  if (issues.corrupted.length > 0) {
    console.log('\n⚠️  Corrupted files (manual review needed):');
    issues.corrupted.forEach(c => console.log(`  ${c.path}: ${c.error}`));
  }
}
```

### 2b. Add CLI Commands

**Update:** `tool/index-conversations`

```bash
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$1" in
  --session)
    npx tsx "$SCRIPT_DIR/src/cli.ts" index-session "$2"
    ;;
  --cleanup)
    npx tsx "$SCRIPT_DIR/src/cli.ts" index-cleanup
    ;;
  --verify)
    npx tsx "$SCRIPT_DIR/src/cli.ts" verify
    ;;
  --repair)
    npx tsx "$SCRIPT_DIR/src/cli.ts" repair
    ;;
  --rebuild)
    echo "⚠️  This will DELETE the entire database and re-index everything."
    read -p "Are you sure? [yes/NO]: " confirm
    if [ "$confirm" = "yes" ]; then
      npx tsx "$SCRIPT_DIR/src/cli.ts" rebuild
    else
      echo "Cancelled"
    fi
    ;;
  *)
    npx tsx "$SCRIPT_DIR/src/cli.ts" index-all "$@"
    ;;
esac
```

**Update:** `tool/src/cli.ts` with verify/repair/rebuild commands

### 2c. Update Database Schema with Migration

**File:** `tool/src/db.ts`

```typescript
// Schema migration: Add last_indexed column to existing databases
export function migrateSchema() {
  const hasColumn = db.prepare(`
    SELECT COUNT(*) as count FROM pragma_table_info('exchanges')
    WHERE name='last_indexed'
  `).get();

  if (hasColumn.count === 0) {
    console.log('Migrating schema: adding last_indexed column...');
    db.prepare('ALTER TABLE exchanges ADD COLUMN last_indexed INTEGER').run();
    console.log('Migration complete.');
  }
}

// Call migration on database initialization
export function initDatabase() {
  // Create tables (existing code)
  db.exec(`
    CREATE TABLE IF NOT EXISTS exchanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_uuid TEXT NOT NULL,
      project_name TEXT,
      conversation_date TEXT,
      file_path TEXT,
      start_line INTEGER,
      end_line INTEGER,
      user_message TEXT,
      assistant_message TEXT,
      last_indexed INTEGER,
      UNIQUE(conversation_uuid, start_line, end_line)
    );
  `);

  // Run migrations
  migrateSchema();
}

// Update insertExchange to set last_indexed
export function insertExchange(exchange: Exchange) {
  const now = Date.now();

  db.prepare(`
    INSERT OR REPLACE INTO exchanges
    (conversation_uuid, project_name, conversation_date, file_path,
     start_line, end_line, user_message, assistant_message, last_indexed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    exchange.conversation_uuid,
    exchange.project_name,
    exchange.conversation_date,
    exchange.file_path,
    exchange.start_line,
    exchange.end_line,
    exchange.user_message,
    exchange.assistant_message,
    now
  );
}
```

**Test:**
- `--verify`: Reports missing summaries, orphaned entries, outdated files
- `--repair`: Fixes all issues found by verify
- `--rebuild`: Prompts for confirmation, clears DB, re-indexes everything
- `--cleanup`: Still works (processes unindexed conversations)

**Acceptance:**
- Verification detects all four issue types
- Repair fixes all fixable issues
- Rebuild has confirmation prompt (safety)
- Schema migration works on existing databases

---

## Task 3: Subagent Prompt Template

**Goal:** Create reusable prompt for conversation search subagents with source tracking

**Create:** `tool/prompts/search-agent.md`

```markdown
# Conversation Search Agent

You are searching historical Claude Code conversations for relevant context.

**Your task:**
1. Search conversations for: {TOPIC}
2. Read the top 2-5 most relevant results
3. Synthesize key findings (max 1000 words)
4. Return synthesis + source pointers (so main agent can dig deeper)

## Search Query

{SEARCH_QUERY}

## What to Look For

{FOCUS_AREAS}

Example focus areas:
- What was the problem or question?
- What solution was chosen and why?
- What alternatives were considered and rejected?
- Any gotchas, edge cases, or lessons learned?
- Relevant code patterns, APIs, or approaches used
- Architectural decisions and rationale

## How to Search

Run:
```bash
~/.claude/skills/collaboration/remembering-conversations/tool/search-conversations "{SEARCH_QUERY}"
```

This returns:
- Project name and date
- Conversation summary (AI-generated)
- Matched exchange with similarity score
- File path and line numbers

Read the full conversations for top 2-5 results to get complete context.

## Output Format

**Required structure:**

### Summary
[Synthesize findings in 200-1000 words. Adapt structure to what you found:
- Quick answer? 1-2 paragraphs.
- Complex topic? Use sections (Context/Solution/Rationale/Lessons/Code).
- Multiple approaches? Compare and contrast.
- Historical evolution? Show progression chronologically.

Focus on actionable insights for the current task.]

### Sources
[List ALL conversations examined, in order of relevance:]

**1. [project-name, YYYY-MM-DD]** - X% match
Conversation summary: [One sentence - what was this conversation about?]
File: ~/.clank/conversation-archive/.../uuid.jsonl:start-end
Status: [Read in detail | Reviewed summary only | Skimmed]

**2. [project-name, YYYY-MM-DD]** - X% match
Conversation summary: ...
File: ...
Status: ...

[Continue for all examined sources...]

### For Follow-Up

Main agent can:
- Ask you to dig deeper into specific source (#1, #2, etc.)
- Ask you to read adjacent exchanges in a conversation
- Ask you to search with refined query
- Read sources directly (discouraged - risks context bloat)

## Critical Rules

**DO:**
- Search using the provided query
- Read full conversations for top results
- Synthesize into actionable insights (200-1000 words)
- Include ALL sources with metadata (project, date, summary, file, status)
- Focus on what will help the current task
- Include specific details (function names, error messages, line numbers)

**DO NOT:**
- Include raw conversation excerpts (synthesize instead)
- Paste full file contents
- Add meta-commentary ("I searched and found...")
- Exceed 1000 words in Summary section
- Return search results verbatim

## Example Output

```
### Summary

Jesse needed to handle authentication errors in React Router 7 data loaders
without crashing the app. The solution uses RR7's errorElement + useRouteError()
to catch 401s and redirect to login.

**Key implementation:**
Protected route wrapper catches loader errors, checks error.status === 401.
If 401, redirects to /login with return URL. Otherwise shows error boundary.

**Why this works:**
Loaders can't use hooks (tried useNavigate, failed). Throwing redirect()
bypasses error handling. Final approach lets errors bubble to errorElement
where component context is available.

**Critical gotchas:**
- Test with expired tokens, not just missing tokens
- Error boundaries need unique keys per route or won't reset
- Always include return URL in redirect
- Loaders execute before components, no hook access

**Code pattern:**
```typescript
// In loader
if (!response.ok) throw { status: response.status, message: 'Failed' };

// In ErrorBoundary
const error = useRouteError();
if (error.status === 401) navigate('/login?return=' + location.pathname);
```

### Sources

**1. [react-router-7-starter, 2024-09-17]** - 92% match
Conversation summary: Built authentication system with JWT, implemented protected routes
File: ~/.clank/conversation-archive/react-router-7-starter/19df92b9.jsonl:145-289
Status: Read in detail (multiple exchanges on error handling evolution)

**2. [react-router-docs-reading, 2024-09-10]** - 78% match
Conversation summary: Read RR7 docs, discussed new loader patterns and errorElement
File: ~/.clank/conversation-archive/react-router-docs-reading/a3c871f2.jsonl:56-98
Status: Reviewed summary only (confirmed errorElement usage)

**3. [auth-debugging, 2024-09-18]** - 73% match
Conversation summary: Fixed token expiration handling and error boundary reset issues
File: ~/.clank/conversation-archive/react-router-7-starter/7b2e8d91.jsonl:201-345
Status: Read in detail (discovered gotchas about keys and expired tokens)

### For Follow-Up

Main agent can ask me to:
- Dig deeper into source #1 (full error handling evolution)
- Read adjacent exchanges in #3 (more debugging context)
- Search for "React Router error boundary patterns" more broadly
```

This output:
- Synthesis: ~350 words (actionable, specific)
- Sources: Full metadata for 3 conversations
- Enables iteration without context bloat
```

**Test:**
- Dispatch subagent with this template
- Verify it searches, reads, and synthesizes
- Check output is 200-1000 words (Summary section)
- Verify ALL sources have full metadata
- Check follow-up workflow works

**Acceptance:**
- Template produces consistent syntheses with source tracking
- Subagents adapt format to findings (not rigid 5-section structure)
- Output is useful for main agent context
- Sources enable iterative refinement
- Context efficient (synthesis + pointers, not raw conversations)

---

## Task 4: Getting-Started Integration

**Goal:** Teach Claude when and how to use conversation search subagents

**Update:** `~/.claude/skills/getting-started/SKILL.md`

Add new mandatory workflow section:

```markdown
## Mandatory Workflow 3: Historical Context Search

**When you might benefit from past conversations:**

**STOP. Search before reinventing.**

Run: Task tool with general-purpose subagent using conversation search template

**When to search:**
- Jesse says "we discussed this before" or "remember when"
- Starting new project in familiar domain
- Debugging issue similar to past problems
- Looking for architectural decisions or rationale
- Understanding why code was implemented a certain way
- Before implementing something that feels familiar

**When NOT to search:**
- Information is in current conversation
- Question about current codebase state (use Grep/Read instead)
- Looking for active code (use file search instead)
- First time encountering a problem

**Critical: Use subagent pattern to prevent context bloat**

### The Context Bloat Problem

Loading 5-10 full conversations = 50-100k tokens wasted.

**Wrong approach:**
1. Search conversations
2. Read top 5 results into main context
3. Try to synthesize while doing other work
4. Burn context on raw conversation text

**Right approach:**
1. Dispatch subagent with focused query
2. Subagent searches, reads, synthesizes (max 1000 words)
3. Subagent returns synthesis + source pointers
4. Use synthesis in main context
5. If more detail needed: ask subagent to dig deeper OR read sources (your choice)
6. Total cost: ~500-1000 tokens instead of 50k

### How to Dispatch Search Subagent

**Step 1: Announce**

"I'm searching previous conversations for [topic]."

**Step 2: Dispatch subagent**

Use Task tool with:
- subagent_type: "general-purpose"
- prompt: Based on conversation search template

**Example:**
```
Task tool:
  description: "Search conversations for rate limiting"
  subagent_type: "general-purpose"
  prompt: |
    Use the conversation search template at:
    ~/.claude/skills/collaboration/remembering-conversations/tool/prompts/search-agent.md

    TOPIC: Rate limiting implementation
    SEARCH_QUERY: rate limiting Redis implementation
    FOCUS_AREAS:
    - What rate limiting strategy was used?
    - How was Redis configured?
    - What edge cases were handled?
    - Any performance considerations?

    Follow the template exactly. Return synthesis (max 1000 words) + sources.
```

**Step 3: Use synthesis**

Subagent returns synthesis with source pointers. Use it to inform your work.

**Step 4: If more detail needed**

You have options:
1. **Ask subagent to dig deeper** (recommended): "Can you read source #2 in detail?"
2. **Refine search via subagent**: "Search for 'Redis sliding window' specifically"
3. **Read sources directly** (discouraged): Loads full conversation into your context

Lean on helpers. Dispatch follow-up subagent queries rather than reading raw sources.

### Example Workflow

```
Jesse: "How did we handle authentication errors in data loaders?"

You: I'm searching previous conversations for authentication error handling.

[Dispatch subagent]
  Topic: Authentication errors in data loaders
  Query: "authentication errors data loaders React Router"
  Focus: solution chosen, why it worked, gotchas

[Subagent returns 350-word synthesis + 3 sources]:
  Summary:
  - Problem: Loaders can't use hooks like useNavigate
  - Solution: Error boundaries with errorElement
  - Pattern: Throw error with status, check in boundary
  - Gotcha: Need unique keys or boundary won't reset

  Sources:
  1. [react-router-7-starter, 2024-09-17] - 92% match (read in detail)
  2. [react-router-docs, 2024-09-10] - 78% match (summary only)
  3. [auth-debugging, 2024-09-18] - 73% match (read in detail)

You: Based on past work, the pattern is to throw errors from
the loader with a status code, then catch them in an error
boundary using errorElement. The key insight is loaders run
before components, so you can't use hooks there...

Jesse: "What about the token expiration edge case?"

You: Let me have the subagent dig deeper into source #3 which
covered debugging token expiration.

[Dispatch follow-up subagent]
  "Read source #3 (auth-debugging conversation) in detail.
   Focus on token expiration handling and edge cases."

[Subagent returns focused 200-word summary]:
  - Test with expired tokens, not just missing
  - Error boundaries need unique keys per route
  - Discovered this after production bug...
```

**Total context used:** ~550 tokens (two syntheses)
**Context saved:** ~40k tokens (avoided loading 3 full conversations)
**Iterative refinement:** Worked without context bloat

### Red Flags - STOP

**Never:**
- Load full conversations directly into main context
- Read multiple conversation files without synthesizing
- Return raw search results to main agent
- Use Read tool on conversation files (dispatch subagent instead)

**If you're tempted:** Dispatch a subagent. Always.

## Integration with Skills

Search conversations AND skills for best results:

**Skills:** Proven techniques, patterns, processes (how to work)
**Conversations:** Historical context, decisions, solutions (what we built)

**Workflow:**
1. Run skills-search for relevant skills
2. If historical context valuable, dispatch conversation search subagent
3. Combine skill knowledge + historical context
4. Proceed with task

**Example:**

```
Task: Implement authentication

1. Skills search: "authentication"
   → Found: skills/security/authentication-patterns
   → Read skill

2. Conversation search: "authentication implementation"
   → Dispatch subagent
   → Get synthesis of past auth work

3. Combine:
   - Skill: Best practices, what to avoid
   - Conversations: What we built, what worked, gotchas

4. Implement with full context
```
```

**Test:**
- Follow getting-started workflow on new task
- Verify it prompts for conversation search when appropriate
- Test subagent dispatch with template
- Verify synthesis is <500 words

**Acceptance:**
- Getting-started clearly explains when to search
- Subagent pattern is mandatory (not optional)
- Examples show complete workflow
- Red flags prevent context bloat

---

## Task 5: Update Remembering-Conversations Docs

**Goal:** Cross-reference with getting-started and emphasize subagent pattern

**Update:** `skills/collaboration/remembering-conversations/SKILL.md`

Add section:

```markdown
## Integration with Getting-Started

**Critical: Use subagent pattern when searching from main conversation.**

The getting-started skill teaches this workflow. Key points:

**When to search:**
- Jesse mentions past discussions
- Debugging similar issues
- Looking for architectural decisions
- Before reimplementing something familiar

**How to search:**
1. Announce: "I'm searching previous conversations for [topic]"
2. Dispatch general-purpose subagent with search template
3. Subagent searches, reads, synthesizes (200-1000 words)
4. Subagent returns synthesis + source pointers
5. Use synthesis in main context
6. If more detail needed: ask subagent to dig deeper (recommended) OR read sources directly

**Why subagents:**
- Loading 5 conversations = 50k tokens wasted
- Subagent synthesis + sources = 500-1000 tokens
- 50-100x context savings
- Source pointers enable iteration without bloat

See skills/getting-started for complete workflow.

## Direct Search (Manual Use Only)

If you're working OUTSIDE a Claude Code session (command line), you can search directly:

[Keep existing search documentation]
```

**Test:**
- Cross-references work both directions
- Subagent pattern is emphasized
- Manual search is clearly marked as outside-session-only

**Acceptance:**
- Docs clearly separate subagent (in-session) from direct (manual) use
- Cross-references to getting-started work
- Warnings about context bloat are prominent

---

## Task 6: End-to-End Testing

**Goal:** Validate entire deployment with realistic scenarios

### Test Scenarios

**Scenario 1: Fresh Installation**
1. No existing hook, no existing database
2. Run install-hook → installs cleanly
3. Index 10 conversations → creates summaries
4. Start session, end session → hook runs, indexes new conversation
5. Search for topic → finds results
6. Dispatch subagent → returns synthesis <500 words

**Scenario 2: Existing Hook**
1. Create dummy sessionEnd hook
2. Run install-hook → offers merge
3. Choose merge → appends indexer
4. Run hook → both old and new code execute

**Scenario 3: Recovery**
1. Delete some summary files
2. Run --verify → reports missing
3. Run --repair → regenerates summaries
4. Run --verify → clean

**Scenario 4: Change Detection**
1. Edit a .jsonl file (add exchange)
2. Run --verify → reports outdated
3. Run --repair → re-indexes
4. Search → finds new exchange

**Scenario 5: Subagent Workflow**
1. Start new session
2. User asks about past work
3. Dispatch subagent with search template
4. Subagent searches, reads 2-5 conversations
5. Returns synthesis (200-1000 words) + sources with metadata
6. Main agent uses synthesis
7. User asks follow-up question
8. Main agent dispatches second subagent to dig deeper into specific source
9. Second subagent returns focused synthesis
10. Verify: No raw conversations loaded into main context

### Validation Criteria

**Hook:**
- ✓ Installs cleanly with no existing hook
- ✓ Merges correctly with existing hook
- ✓ Detects already-installed indexer
- ✓ Hook runs on session end
- ✓ Indexer processes new session

**Recovery:**
- ✓ --verify detects all issue types
- ✓ --repair fixes issues
- ✓ --rebuild works with confirmation
- ✓ --cleanup processes unindexed

**Subagent:**
- ✓ Template produces consistent syntheses with source tracking
- ✓ Summary section: 200-1000 words
- ✓ Sources section: Full metadata for all examined conversations
- ✓ No raw conversation excerpts (synthesis only)
- ✓ Actionable insights for main agent
- ✓ Follow-up workflow works (dig deeper, refine query)

**Integration:**
- ✓ Getting-started teaches workflow
- ✓ Cross-references work
- ✓ Skills search + conversation search combine effectively

---

## Task 7: Documentation and Deployment Checklist

**Goal:** Create runbook for deployment and ongoing maintenance

**Create:** `skills/collaboration/remembering-conversations/DEPLOYMENT.md`

```markdown
# Deployment Checklist

## Initial Deployment

- [ ] Install hook: `./tool/install-hook`
- [ ] Choose merge or replace if existing hook
- [ ] Test hook: `SESSION_ID=test-$(date +%s) ~/.claude/hooks/sessionEnd`
- [ ] Index existing conversations: `./tool/index-conversations`
- [ ] Verify index: `./tool/index-conversations --verify`
- [ ] Test search: `./tool/search-conversations "test query"`
- [ ] Read getting-started integration
- [ ] Test subagent dispatch with template

## Ongoing Maintenance

**Daily/Automatic:**
- Hook runs on every session end (automatic)
- New conversations indexed in background

**Weekly:**
- Run `--verify` to check for issues
- Run `--repair` if issues found

**After System Changes:**
- Updated CLAUDE.md? Run `--verify`
- Moved conversation archive? Update paths and `--rebuild`
- Changed database schema? Backup and `--rebuild`

**Recovery Scenarios:**

| Scenario | Command |
|----------|---------|
| Missing summaries | `--verify` then `--repair` |
| Orphaned DB entries | `--verify` then `--repair` |
| Outdated indexes | `--verify` then `--repair` |
| Corrupted database | `--rebuild` (re-indexes everything) |
| Hook not running | Check `~/.claude/hooks/sessionEnd` executable |
| Slow indexing | Check API key, network, Haiku fallback |

## Monitoring

**Health checks:**
```bash
# Check hook installed
ls -l ~/.claude/hooks/sessionEnd

# Check recent indexes
ls -lt ~/.clank/conversation-archive/*/*.jsonl | head

# Check database size
ls -lh ~/.clank/conversation-index/db.sqlite

# Verify index health
./tool/index-conversations --verify
```

**Expected behavior:**
- Hook runs within seconds of session end
- Indexing completes within 30 seconds per conversation
- Summaries are 50-120 words
- Search returns results in <1 second
- Subagent synthesis is 200-1000 words with source metadata

## Troubleshooting

**Hook not running:**
1. Check executable: `chmod +x ~/.claude/hooks/sessionEnd`
2. Check $SESSION_ID set: `echo $SESSION_ID` during session
3. Check indexer exists: `ls ~/.claude/skills/.../tool/index-conversations`
4. Test manually: `SESSION_ID=test ./hook`

**Summaries failing:**
1. Check API key: `echo $ANTHROPIC_API_KEY`
2. Check Haiku fallback in logs
3. Try manual: `./tool/index-conversations --session <uuid>`
4. Check for rate limits

**Search not finding results:**
1. Verify indexed: `./tool/index-conversations --verify`
2. Check database: `ls -lh ~/.clank/conversation-index/db.sqlite`
3. Try text search: `./tool/search-conversations --text "exact phrase"`
4. Rebuild if corrupted: `./tool/index-conversations --rebuild`

**Subagent not synthesizing:**
1. Check template path exists
2. Verify subagent can search (test manually)
3. Check synthesis length (200-1000 words)
4. Review subagent output for errors

**Subagent not including sources:**
1. Verify template has "### Sources" section
2. Check subagent following template format
3. Ensure search returned results with metadata
4. Re-dispatch with explicit instruction to include sources
```

**Acceptance:**
- Checklist is comprehensive
- Troubleshooting covers common issues
- Health checks are actionable
- Recovery procedures are clear

---

## Success Criteria

**System works if:**

1. **Hook installs cleanly** (fresh or merge)
2. **Hook runs automatically** on session end
3. **Recovery handles all scenarios** (missing, orphaned, outdated, corrupted)
4. **Change detection works** (updated conversations re-indexed)
5. **Subagents prevent context bloat** (synthesis + sources, not raw conversations)
6. **Getting-started teaches workflow** (when to search, how to dispatch)
7. **End-to-end scenario passes** (install → index → search → subagent → synthesis)

**Metrics:**
- Hook success rate: >99%
- Index verification: 0 issues
- Subagent synthesis: 200-1000 words (Summary section)
- Subagent sources: 100% include full metadata
- Context savings: 50k → 500-1000 tokens per search
- Follow-up efficiency: 50% of searches refined via subagent (not direct read)
- Search latency: <1 second
- Index latency: <30 seconds per conversation

**User experience:**
- Claude searches past conversations automatically when relevant
- Results are synthesized, never raw
- Main conversation context stays clean
- Historical insights inform current work
- No manual intervention needed (hook handles indexing)

---

## Implementation Order

1. **Task 1:** Hook installation script (foundation)
2. **Task 2:** Recovery modes (reliability)
3. **Task 3:** Subagent template (context savings)
4. **Task 4:** Getting-started integration (workflow)
5. **Task 5:** Docs cross-reference (discoverability)
6. **Task 6:** End-to-end testing (validation)
7. **Task 7:** Deployment checklist (operationalization)

Each task builds on previous tasks. Test thoroughly before moving to next task.

**Estimated effort:** 3-4 hours for implementation + testing
**Estimated cost:** $1-2 for indexing tests (API calls)

## Notes

- Subagent pattern is THE critical feature preventing context bloat
- Getting-started integration makes this automatic (not opt-in)
- Recovery modes handle real-world messiness (missed sessions, updates)
- Hook installation respects existing hooks (merge, don't replace)
- Change detection enables incremental updates (not just append-only)

This deployment plan makes conversation search production-ready and context-efficient.
