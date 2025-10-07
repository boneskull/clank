import { parseConversation } from './parser.js';
import { summarizeConversation } from './summarizer.js';

async function test() {
  const testFile = '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl';

  console.log('Testing conversation with thinking budget issue...\n');

  const exchanges = await parseConversation(testFile, 'test', testFile);
  console.log(`Exchanges: ${exchanges.length}\n`);

  console.log('Generating summary (should auto-retry with Sonnet)...\n');
  const summary = await summarizeConversation(exchanges);

  console.log('--- SUMMARY ---');
  console.log(summary);
  console.log(`\n(${summary.split(/\s+/).length} words)`);
}

test().catch(console.error);
