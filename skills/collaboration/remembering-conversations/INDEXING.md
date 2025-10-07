# Managing Conversation Index

How to index, archive, and maintain conversations for search.

## Quick Start

**Index all conversations:**
```bash
~/.claude/skills/collaboration/remembering-conversations/tool/index-conversations
```

**Process unindexed only:**
```bash
~/.claude/skills/collaboration/remembering-conversations/tool/index-conversations --cleanup
```

## Features

- **Semantic search** across all past conversations
- **AI summaries** generated with Claude Haiku (Sonnet fallback)
- **Permanent archive** at `~/.clank/conversation-archive/`
- **Vector database** for fast similarity search
- **Automatic indexing** via sessionEnd hook

## Usage

### Index Modes

```bash
# Index all conversations
./index-conversations

# Index specific session (for hooks)
./index-conversations --session <session-id>

# Process unprocessed conversations (missing summaries)
./index-conversations --cleanup
```

### Search

```bash
./search-conversations "authentication errors"
./search-conversations "React Router data loading"
```

Returns: project, date, snippet, file path, similarity score

### Auto-indexing Setup

Copy the sessionEnd hook to enable automatic indexing after each session:

```bash
cp hooks/sessionEnd ~/.claude/hooks/sessionEnd
chmod +x ~/.claude/hooks/sessionEnd
```

This will automatically index conversations when sessions end (runs in background).

## Storage

- **Archive:** `~/.clank/conversation-archive/<project>/<uuid>.jsonl`
- **Summaries:** `~/.clank/conversation-archive/<project>/<uuid>-summary.txt`
- **Database:** `~/.clank/conversation-index/db.sqlite`

## Technical Details

- **Embeddings:** @xenova/transformers (all-MiniLM-L6-v2, 384 dimensions)
- **Vector search:** sqlite-vec
- **Summaries:** Claude Haiku with automatic Sonnet fallback
- **Parser:** Handles multi-message exchanges and sidechains

## Cost Considerations

- **Embeddings:** Free (local)
- **Summaries:** ~$0.01-0.02 per conversation (Haiku, hierarchical for long conversations)
- **Search:** Free (local vector similarity)

Use `--cleanup` to process only unprocessed conversations and control API costs.
