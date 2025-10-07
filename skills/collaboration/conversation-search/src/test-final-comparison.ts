import { parseConversation } from './parser.js';
import { summarizeConversation } from './summarizer.js';

async function test() {
  const testFiles = [
    {
      name: 'ESP32 Bluetooth (39 exchanges)',
      path: '/Users/jesse/.claude/projects/-Users-jesse/4f594254-e72b-4b7b-bf93-53971b481559.jsonl'
    },
    {
      name: 'Conversation Search (20 exchanges)',
      path: '/Users/jesse/.claude/projects/-Users-jesse--clank/26c0fca0-1a22-4ff7-b544-5c3517b1994c.jsonl'
    },
    {
      name: 'Process Documentation (29 exchanges)',
      path: '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl'
    }
  ];

  for (const { name, path } of testFiles) {
    console.log('\n' + '='.repeat(80));
    console.log(`CONVERSATION: ${name}`);
    console.log('='.repeat(80));

    const exchanges = await parseConversation(path, 'test', path);
    console.log(`Exchanges: ${exchanges.length}\n`);

    const summary = await summarizeConversation(exchanges);
    const wordCount = summary.split(/\s+/).length;

    console.log('--- SUMMARY ---');
    console.log(summary);
    console.log(`\n(${wordCount} words)`);
  }
}

test().catch(console.error);
