import { query } from '@anthropic-ai/claude-agent-sdk';

async function test() {
  try {
    for await (const message of query({
      prompt: 'test',
      options: {
        model: 'haiku',
        maxTokens: 100,  // Intentionally too low to trigger thinking budget error
        systemPrompt: 'test'
      }
    })) {
      console.log('Got message:', message);
    }
  } catch (error) {
    console.log('Error type:', error?.constructor?.name);
    console.log('Error instanceof Error:', error instanceof Error);
    console.log('Error keys:', Object.keys(error || {}));
    console.log('Error message:', error);
    console.log('Error string contains thinking:', String(error).includes('thinking'));
  }
}

test().catch(err => console.log('Outer catch:', err));
