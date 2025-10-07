import { parseConversation } from './parser.js';
import { formatConversationText } from './summarizer.js';
import fs from 'fs';

async function dump() {
  const exchanges = await parseConversation(
    '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl',
    'test',
    'test'
  );

  const formatted = formatConversationText(exchanges);
  fs.writeFileSync('/tmp/convo.txt', formatted);
  console.log('Written to /tmp/convo.txt');
  console.log('Length:', formatted.length, 'characters');
  console.log('Exchanges:', exchanges.length);
}

dump().catch(console.error);
