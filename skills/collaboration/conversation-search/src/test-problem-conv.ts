import { parseConversation } from './parser.js';
import { formatConversationText } from './summarizer.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

async function testDirect() {
  const testFile = '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl';

  const exchanges = await parseConversation(testFile, 'test', testFile);
  console.log(`Exchanges: ${exchanges.length}`);

  const conversationText = formatConversationText(exchanges);
  console.log(`Conversation length: ${conversationText.length} chars\n`);

  const prompt = `ONE PARAGRAPH summary of this conversation:\n\n${conversationText}`;

  console.log('Trying with Haiku, maxTokens: 4096...');
  try {
    for await (const message of query({
      prompt,
      options: {
        model: 'haiku',
        maxTokens: 4096,
        systemPrompt: 'Summarize concisely.'
      }
    })) {
      if (message && typeof message === 'object' && 'type' in message) {
        console.log(`Message type: ${message.type}`);
        if (message.type === 'result') {
          console.log('\n--- SUMMARY ---');
          console.log((message as any).result);
          return;
        }
      }
    }
  } catch (error) {
    console.log('\nERROR with Haiku:');
    console.log('  Type:', error?.constructor?.name);
    console.log('  Message:', String(error).substring(0, 200));
    console.log('  Contains "thinking":', String(error).includes('thinking'));

    console.log('\nRetrying with Sonnet...');
    try {
      for await (const message of query({
        prompt,
        options: {
          model: 'sonnet',
          maxTokens: 4096,
          systemPrompt: 'Summarize concisely.'
        }
      })) {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'result') {
          console.log('\n--- SUMMARY (Sonnet) ---');
          console.log((message as any).result);
          return;
        }
      }
    } catch (sonnetError) {
      console.log('\nSonnet also failed:', sonnetError);
    }
  }
}

testDirect().catch(console.error);
