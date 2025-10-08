# Conversation Search Implementation Plan

> **For Claude:** Use `@skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Build a conversation search system that indexes Claude Code conversations and enables semantic search.

**Architecture:**
- Indexer: Parses JSONL files, generates embeddings, stores in SQLite
- Search CLI: Queries vector database, returns relevant exchanges
- Skill: Teaches Claude when and how to use conversation search

**Tech Stack:**
- Node.js + TypeScript
- @xenova/transformers for local embeddings
- sqlite-vec for vector similarity search
- Storage: `~/.clank/conversation-archive/` and `~/.clank/conversation-index/`

---

## Task 1: Project Setup

**Files:**
- Create: `skills/collaboration/conversation-search/package.json`
- Create: `skills/collaboration/conversation-search/tsconfig.json`
- Create: `skills/collaboration/conversation-search/.gitignore`

**Step 1: Initialize Node.js project**

```bash
cd ~/.clank/worktrees/conversation-search/skills/collaboration
mkdir -p conversation-search
cd conversation-search
npm init -y
```

Expected: Creates `package.json`

**Step 2: Install dependencies**

```bash
npm install @xenova/transformers sqlite-vec
npm install --save-dev typescript @types/node tsx
```

Expected: Dependencies installed in `node_modules/`

**Step 3: Create TypeScript config**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 4: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
*.log
.DS_Store
```

**Step 5: Commit setup**

```bash
git add skills/collaboration/conversation-search/
git commit -m "feat: initialize conversation-search project"
```

---

## Task 2: Database Schema

**Files:**
- Create: `skills/collaboration/conversation-search/src/db.ts`
- Create: `skills/collaboration/conversation-search/src/types.ts`

**Step 1: Define TypeScript types**

Create `src/types.ts`:
```typescript
export interface ConversationExchange {
  id: string;
  project: string;
  timestamp: string;
  userMessage: string;
  assistantMessage: string;
  archivePath: string;
  lineStart: number;
  lineEnd: number;
}

export interface SearchResult {
  exchange: ConversationExchange;
  similarity: number;
  snippet: string;
}
```

**Step 2: Create database initialization**

Create `src/db.ts`:
```typescript
import Database from 'better-sqlite3';
import { ConversationExchange } from './types.js';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.clank', 'conversation-index', 'db.sqlite');

export function initDatabase(): Database.Database {
  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create exchanges table
  db.exec(`
    CREATE TABLE IF NOT EXISTS exchanges (
      id TEXT PRIMARY KEY,
      project TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      user_message TEXT NOT NULL,
      assistant_message TEXT NOT NULL,
      archive_path TEXT NOT NULL,
      line_start INTEGER NOT NULL,
      line_end INTEGER NOT NULL,
      embedding BLOB
    )
  `);

  // Create vector search index
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_exchanges USING vec0(
      id TEXT PRIMARY KEY,
      embedding FLOAT[384]
    )
  `);

  // Create index on timestamp for sorting
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON exchanges(timestamp DESC)
  `);

  return db;
}

export function insertExchange(
  db: Database.Database,
  exchange: ConversationExchange,
  embedding: number[]
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO exchanges
    (id, project, timestamp, user_message, assistant_message, archive_path, line_start, line_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    exchange.id,
    exchange.project,
    exchange.timestamp,
    exchange.userMessage,
    exchange.assistantMessage,
    exchange.archivePath,
    exchange.lineStart,
    exchange.lineEnd
  );

  // Insert into vector table
  const vecStmt = db.prepare(`
    INSERT OR REPLACE INTO vec_exchanges (id, embedding)
    VALUES (?, ?)
  `);

  vecStmt.run(exchange.id, Buffer.from(new Float32Array(embedding).buffer));
}
```

**Step 3: Test database initialization**

Create `src/test-db.ts`:
```typescript
import { initDatabase } from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const dbDir = path.join(os.homedir(), '.clank', 'conversation-index');
fs.mkdirSync(dbDir, { recursive: true });

const db = initDatabase();
console.log('Database initialized successfully');

// Verify tables exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table'
`).all();

console.log('Tables:', tables);
db.close();
```

**Step 4: Run test**

```bash
cd skills/collaboration/conversation-search
npx tsx src/test-db.ts
```

Expected: "Database initialized successfully" and list of tables including `exchanges` and `vec_exchanges`

**Step 5: Commit database schema**

```bash
git add skills/collaboration/conversation-search/src/
git commit -m "feat: add database schema for conversation search"
```

---

## Task 3: Conversation Parser

**Files:**
- Create: `skills/collaboration/conversation-search/src/parser.ts`

**Step 1: Implement JSONL parser**

Create `src/parser.ts`:
```typescript
import fs from 'fs';
import readline from 'readline';
import { ConversationExchange } from './types.js';
import crypto from 'crypto';

interface JSONLMessage {
  type: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string }>;
  };
  timestamp?: string;
  uuid?: string;
}

export async function parseConversation(
  filePath: string,
  projectName: string,
  archivePath: string
): Promise<ConversationExchange[]> {
  const exchanges: ConversationExchange[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  let currentUser: { message: string; line: number } | null = null;

  for await (const line of rl) {
    lineNumber++;

    try {
      const parsed: JSONLMessage = JSON.parse(line);

      // Skip non-message types
      if (parsed.type !== 'user' && parsed.type !== 'assistant') {
        continue;
      }

      if (!parsed.message) {
        continue;
      }

      // Extract text from message content
      let text = '';
      if (typeof parsed.message.content === 'string') {
        text = parsed.message.content;
      } else if (Array.isArray(parsed.message.content)) {
        text = parsed.message.content
          .filter(block => block.type === 'text' && block.text)
          .map(block => block.text)
          .join('\n');
      }

      if (parsed.message.role === 'user') {
        currentUser = { message: text, line: lineNumber };
      } else if (parsed.message.role === 'assistant' && currentUser) {
        // Create exchange
        const exchange: ConversationExchange = {
          id: crypto
            .createHash('md5')
            .update(`${archivePath}:${currentUser.line}-${lineNumber}`)
            .digest('hex'),
          project: projectName,
          timestamp: parsed.timestamp || new Date().toISOString(),
          userMessage: currentUser.message,
          assistantMessage: text,
          archivePath,
          lineStart: currentUser.line,
          lineEnd: lineNumber
        };

        exchanges.push(exchange);
        currentUser = null;
      }
    } catch (error) {
      // Skip malformed JSON lines
      continue;
    }
  }

  return exchanges;
}
```

**Step 2: Create test for parser**

Create `src/test-parser.ts`:
```typescript
import { parseConversation } from './parser.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function test() {
  // Find a real conversation file
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projects = fs.readdirSync(projectsDir);

  for (const project of projects) {
    const projectPath = path.join(projectsDir, project);
    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));

    if (files.length > 0) {
      const testFile = path.join(projectPath, files[0]);
      console.log(`Testing parser on: ${testFile}`);

      const exchanges = await parseConversation(testFile, project, testFile);
      console.log(`Found ${exchanges.length} exchanges`);

      if (exchanges.length > 0) {
        console.log('\nFirst exchange:');
        console.log('User:', exchanges[0].userMessage.substring(0, 100) + '...');
        console.log('Assistant:', exchanges[0].assistantMessage.substring(0, 100) + '...');
      }

      break;
    }
  }
}

test().catch(console.error);
```

**Step 3: Run parser test**

```bash
npx tsx src/test-parser.ts
```

Expected: Parses a conversation file and shows exchange count + sample

**Step 4: Commit parser**

```bash
git add skills/collaboration/conversation-search/src/
git commit -m "feat: add JSONL conversation parser"
```

---

## Task 4: Embedding Generator

**Files:**
- Create: `skills/collaboration/conversation-search/src/embeddings.ts`

**Step 1: Implement embedding generator**

Create `src/embeddings.ts`:
```typescript
import { pipeline, Pipeline } from '@xenova/transformers';

let embeddingPipeline: Pipeline | null = null;

export async function initEmbeddings(): Promise<void> {
  if (!embeddingPipeline) {
    console.log('Loading embedding model (first run may take time)...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded');
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    await initEmbeddings();
  }

  // Truncate text to avoid token limits (512 tokens max for this model)
  const truncated = text.substring(0, 2000);

  const output = await embeddingPipeline!(truncated, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(output.data);
}

export async function generateExchangeEmbedding(
  userMessage: string,
  assistantMessage: string
): Promise<number[]> {
  // Combine user question and assistant answer for better searchability
  const combined = `User: ${userMessage}\n\nAssistant: ${assistantMessage}`;
  return generateEmbedding(combined);
}
```

**Step 2: Create embedding test**

Create `src/test-embeddings.ts`:
```typescript
import { generateEmbedding, generateExchangeEmbedding } from './embeddings.js';

async function test() {
  console.log('Testing embeddings...');

  const embedding1 = await generateEmbedding('How do I implement authentication?');
  console.log(`Generated embedding with ${embedding1.length} dimensions`);
  console.log(`Sample values: [${embedding1.slice(0, 5).join(', ')}...]`);

  const embedding2 = await generateExchangeEmbedding(
    'How do I handle errors in async code?',
    'Use try/catch blocks around await statements, or use .catch() on promises.'
  );
  console.log(`Exchange embedding: ${embedding2.length} dimensions`);
}

test().catch(console.error);
```

**Step 3: Run embedding test**

```bash
npx tsx src/test-embeddings.ts
```

Expected: Downloads model (first run), generates 384-dimensional embedding

**Step 4: Commit embeddings**

```bash
git add skills/collaboration/conversation-search/src/
git commit -m "feat: add embedding generation with transformers.js"
```

---

## Task 5: Indexing CLI

**Files:**
- Create: `skills/collaboration/conversation-search/index-conversations`
- Modify: `skills/collaboration/conversation-search/src/indexer.ts`

**Step 1: Create indexer logic**

Create `src/indexer.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { initDatabase, insertExchange } from './db.js';
import { parseConversation } from './parser.js';
import { initEmbeddings, generateExchangeEmbedding } from './embeddings.js';
import { ConversationExchange } from './types.js';

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const ARCHIVE_DIR = path.join(os.homedir(), '.clank', 'conversation-archive');

export async function indexConversations(): Promise<void> {
  console.log('Initializing database...');
  const db = initDatabase();

  console.log('Loading embedding model...');
  await initEmbeddings();

  console.log('Scanning for conversation files...');
  const projects = fs.readdirSync(PROJECTS_DIR);

  let totalExchanges = 0;

  for (const project of projects) {
    const projectPath = path.join(PROJECTS_DIR, project);
    const stat = fs.statSync(projectPath);

    if (!stat.isDirectory()) continue;

    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) continue;

    console.log(`\nProcessing project: ${project} (${files.length} conversations)`);

    // Create archive directory for this project
    const projectArchive = path.join(ARCHIVE_DIR, project);
    fs.mkdirSync(projectArchive, { recursive: true });

    for (const file of files) {
      const sourcePath = path.join(projectPath, file);
      const archivePath = path.join(projectArchive, file);

      // Copy to archive
      if (!fs.existsSync(archivePath)) {
        fs.copyFileSync(sourcePath, archivePath);
        console.log(`  Archived: ${file}`);
      }

      // Parse conversation
      const exchanges = await parseConversation(sourcePath, project, archivePath);

      if (exchanges.length === 0) {
        console.log(`  Skipped ${file} (no exchanges)`);
        continue;
      }

      // Generate embeddings and insert
      for (const exchange of exchanges) {
        const embedding = await generateExchangeEmbedding(
          exchange.userMessage,
          exchange.assistantMessage
        );

        insertExchange(db, exchange, embedding);
      }

      totalExchanges += exchanges.length;
      console.log(`  Indexed ${file}: ${exchanges.length} exchanges`);
    }
  }

  db.close();
  console.log(`\n✅ Indexing complete! Total exchanges: ${totalExchanges}`);
}
```

**Step 2: Create CLI script**

Create `index-conversations`:
```bash
#!/usr/bin/env node

import { indexConversations } from './src/indexer.js';

indexConversations().catch(error => {
  console.error('Error indexing conversations:', error);
  process.exit(1);
});
```

**Step 3: Make executable and test**

```bash
chmod +x index-conversations
./index-conversations
```

Expected: Archives conversations, generates embeddings, indexes into database

**Step 4: Commit indexer**

```bash
git add skills/collaboration/conversation-search/
git commit -m "feat: add conversation indexing CLI"
```

---

## Task 6: Search CLI

**Files:**
- Create: `skills/collaboration/conversation-search/search-conversations`
- Create: `skills/collaboration/conversation-search/src/search.ts`

**Step 1: Implement search logic**

Create `src/search.ts`:
```typescript
import Database from 'better-sqlite3';
import { initDatabase } from './db.js';
import { initEmbeddings, generateEmbedding } from './embeddings.js';
import { SearchResult, ConversationExchange } from './types.js';

export async function searchConversations(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const db = initDatabase();

  // Generate query embedding
  await initEmbeddings();
  const queryEmbedding = await generateEmbedding(query);

  // Search using vector similarity
  const stmt = db.prepare(`
    SELECT
      e.id,
      e.project,
      e.timestamp,
      e.user_message,
      e.assistant_message,
      e.archive_path,
      e.line_start,
      e.line_end,
      vec.distance
    FROM vec_exchanges AS vec
    JOIN exchanges AS e ON vec.id = e.id
    WHERE vec.embedding MATCH ?
    ORDER BY vec.distance ASC
    LIMIT ?
  `);

  const results = stmt.all(
    Buffer.from(new Float32Array(queryEmbedding).buffer),
    limit
  );

  db.close();

  return results.map((row: any) => {
    const exchange: ConversationExchange = {
      id: row.id,
      project: row.project,
      timestamp: row.timestamp,
      userMessage: row.user_message,
      assistantMessage: row.assistant_message,
      archivePath: row.archive_path,
      lineStart: row.line_start,
      lineEnd: row.line_end
    };

    // Create snippet (first 200 chars)
    const snippet = exchange.userMessage.substring(0, 200) +
      (exchange.userMessage.length > 200 ? '...' : '');

    return {
      exchange,
      similarity: 1 - row.distance, // Convert distance to similarity
      snippet
    };
  });
}

export function formatResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No results found.';
  }

  let output = `Found ${results.length} relevant conversations:\n\n`;

  results.forEach((result, index) => {
    const date = new Date(result.exchange.timestamp).toISOString().split('T')[0];
    output += `${index + 1}. [${result.exchange.project}, ${date}]\n`;
    output += `   "${result.snippet}"\n`;
    output += `   File: ${result.exchange.archivePath}:${result.exchange.lineStart}-${result.exchange.lineEnd}\n`;
    output += `   Similarity: ${(result.similarity * 100).toFixed(1)}%\n\n`;
  });

  return output;
}
```

**Step 2: Create search CLI**

Create `search-conversations`:
```bash
#!/usr/bin/env node

import { searchConversations, formatResults } from './src/search.js';

const query = process.argv.slice(2).join(' ');

if (!query) {
  console.error('Usage: search-conversations <query>');
  process.exit(1);
}

searchConversations(query)
  .then(results => {
    console.log(formatResults(results));
  })
  .catch(error => {
    console.error('Error searching:', error);
    process.exit(1);
  });
```

**Step 3: Make executable and test**

```bash
chmod +x search-conversations
./search-conversations "How do I handle authentication?"
```

Expected: Returns ranked results with snippets and file paths

**Step 4: Commit search**

```bash
git add skills/collaboration/conversation-search/
git commit -m "feat: add conversation search CLI"
```

---

## Task 7: Skill Documentation

**Files:**
- Create: `skills/collaboration/conversation-search/SKILL.md`

**Step 1: Write skill documentation**

Create `SKILL.md`:
```markdown
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
```

**Step 2: Commit skill documentation**

```bash
git add skills/collaboration/conversation-search/SKILL.md
git commit -m "docs: add conversation search skill documentation"
```

---

## Task 8: Update Collaboration INDEX

**Files:**
- Modify: `skills/collaboration/INDEX.md`

**Step 1: Add conversation-search to INDEX**

Edit `skills/collaboration/INDEX.md` and add:
```markdown
- @conversation-search/SKILL.md - Search previous Claude Code conversations for facts, patterns, decisions, and context
```

**Step 2: Commit INDEX update**

```bash
git add skills/collaboration/INDEX.md
git commit -m "docs: add conversation-search to collaboration INDEX"
```

---

## Task 9: Integration Testing

**Files:**
- Create: `skills/collaboration/conversation-search/test-integration.sh`

**Step 1: Create integration test**

Create `test-integration.sh`:
```bash
#!/bin/bash
set -e

echo "=== Conversation Search Integration Test ==="

cd "$(dirname "$0")"

echo "1. Running indexer..."
./index-conversations

echo ""
echo "2. Testing search..."
./search-conversations "authentication" | head -20

echo ""
echo "3. Verifying archive exists..."
ls -lh ~/.clank/conversation-archive/ | head -10

echo ""
echo "4. Verifying database exists..."
ls -lh ~/.clank/conversation-index/db.sqlite

echo ""
echo "✅ Integration test complete!"
```

**Step 2: Make executable and run**

```bash
chmod +x test-integration.sh
./test-integration.sh
```

Expected: Indexes conversations, performs search, verifies all components

**Step 3: Commit integration test**

```bash
git add skills/collaboration/conversation-search/test-integration.sh
git commit -m "test: add integration test for conversation search"
```

---

## Task 10: Update package.json scripts

**Files:**
- Modify: `skills/collaboration/conversation-search/package.json`

**Step 1: Add npm scripts**

Edit `package.json` to add:
```json
{
  "name": "conversation-search",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "index": "tsx index-conversations",
    "search": "tsx search-conversations",
    "test": "./test-integration.sh"
  },
  "dependencies": {
    "@xenova/transformers": "^2.17.1",
    "better-sqlite3": "^9.4.3",
    "sqlite-vec": "^0.0.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.9",
    "@types/node": "^20.11.19",
    "typescript": "^5.3.3",
    "tsx": "^4.7.1"
  }
}
```

**Step 2: Test npm scripts**

```bash
npm run index
npm run search "typescript"
```

Expected: Scripts work via npm

**Step 3: Final commit**

```bash
git add skills/collaboration/conversation-search/package.json
git commit -m "chore: add npm scripts for conversation search"
```

---

## Related Skills

- **@skills/getting-started/SKILL.md** - Skills search pattern (similar CLI tool)
- **@skills/collaboration/brainstorming/SKILL.md** - Used this to design the system
- **@skills/testing/test-driven-development/SKILL.md** - Testing approach for tools

## Success Criteria

✅ Conversations archived to `~/.clank/conversation-archive/`
✅ SQLite database with vector search at `~/.clank/conversation-index/db.sqlite`
✅ `index-conversations` CLI indexes all past conversations
✅ `search-conversations "query"` returns relevant results
✅ Skill documentation teaches Claude when/how to use
✅ Integration test validates end-to-end workflow
