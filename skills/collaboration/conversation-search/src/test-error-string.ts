import { parseConversation } from './parser.js';
import { formatConversationText } from './summarizer.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

async function test() {
  const testFile = '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl';
  const exchanges = await parseConversation(testFile, 'test', testFile);
  const conversationText = formatConversationText(exchanges);
  const prompt = `Summarize:\n\n${conversationText}`;

  for await (const message of query({
    prompt,
    options: {
      model: 'haiku',
      maxTokens: 4096,
      systemPrompt: 'Summarize.'
    }
  })) {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'result') {
      const result = (message as any).result;
      console.log('Result type:', typeof result);
      console.log('Result length:', result?.length);
      console.log('First 200 chars:', result?.substring(0, 200));
      console.log('Includes "API Error":', result?.includes('API Error'));
      console.log('Includes "thinking.budget_tokens":', result?.includes('thinking.budget_tokens'));
      console.log('Includes "thinking":', result?.includes('thinking'));
      break;
    }
  }
}

test().catch(console.error);
