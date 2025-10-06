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
