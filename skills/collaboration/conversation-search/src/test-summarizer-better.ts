import { parseConversation } from './parser.js';
import { summarizeConversation } from './summarizer.js';
import fs from 'fs';
import path from 'path';

async function test() {
  // Test with 3 conversations of different sizes
  const testFiles = [
    // Small conversation
    '/Users/jesse/.claude/projects/-Users-jesse/4f594254-e72b-4b7b-bf93-53971b481559.jsonl',
    // Medium
    '/Users/jesse/.claude/projects/-Users-jesse--clank/26c0fca0-1a22-4ff7-b544-5c3517b1994c.jsonl',
    // Another medium
    '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl'
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

    console.log('Generating summary...\n');
    const summary = await summarizeConversation(exchanges);
    console.log('--- SUMMARY ---');
    console.log(summary);
    console.log('\nWord count:', summary.split(/\s+/).length);
  }
}

test().catch(console.error);
