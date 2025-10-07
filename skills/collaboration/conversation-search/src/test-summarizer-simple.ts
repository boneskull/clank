import { parseConversation } from './parser.js';
import { formatConversationText, summarizeConversation } from './summarizer.js';
import fs from 'fs';
import path from 'path';

async function test() {
  // Test with 3 specific small conversations
  const testFiles = [
    '/Users/jesse/.claude/projects/-Users-jesse/1ea5bd90-aba7-4967-aaa1-b080d19c41e1.jsonl',
    '/Users/jesse/.claude/projects/-Users-jesse/8e28314d-13a5-43c2-9387-4dc293033f65.jsonl',
    '/Users/jesse/.claude/projects/-Users-jesse/e5b8477a-2f3e-4013-a55b-e82cc5ad3899.jsonl'
  ];

  for (const filePath of testFiles) {
    const filename = path.basename(filePath);

    console.log('\n' + '='.repeat(80));
    console.log(`FILE: ${filename}`);
    console.log('='.repeat(80));

    const exchanges = await parseConversation(filePath, 'test', filePath);

    if (exchanges.length === 0) {
      console.log('No exchanges found.');
      continue;
    }

    console.log(`Exchanges: ${exchanges.length}\n`);

    const formatted = formatConversationText(exchanges);
    console.log('Formatted conversation:');
    console.log(formatted.substring(0, 300) + '...\n');

    console.log('Generating summary...');
    const summary = await summarizeConversation(exchanges);
    console.log('\n--- SUMMARY ---');
    console.log(summary);
    console.log('');
  }
}

test().catch(console.error);
