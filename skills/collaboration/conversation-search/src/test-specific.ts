import { parseConversation } from './parser.js';

async function test() {
  const testFile = '/Users/jesse/.claude/projects/-Users-jesse/4f594254-e72b-4b7b-bf93-53971b481559.jsonl';
  console.log(`Testing parser on: ${testFile}`);

  const exchanges = await parseConversation(testFile, 'test-project', testFile);
  console.log(`Found ${exchanges.length} exchanges`);

  if (exchanges.length > 0) {
    console.log('\nFirst 3 exchanges:');
    for (let i = 0; i < Math.min(3, exchanges.length); i++) {
      console.log(`\n--- Exchange ${i + 1} ---`);
      console.log('User:', exchanges[i].userMessage.substring(0, 100) + '...');
      console.log('Assistant:', exchanges[i].assistantMessage.substring(0, 100) + '...');
    }
  }
}

test().catch(console.error);
