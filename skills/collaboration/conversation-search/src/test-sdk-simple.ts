import { query } from '@anthropic-ai/claude-agent-sdk';

async function test() {
  console.log('Testing SDK query...\n');

  const prompt = 'What is 2+2? Just answer with the number.';

  console.log('Calling query...');

  for await (const message of query({
    prompt,
    options: {
      model: 'claude-3-5-haiku-20241022',
      systemPrompt: 'You are a calculator. Just answer questions directly.'
    }
  })) {
    console.log('Message type:', typeof message);
    console.log('Message:', JSON.stringify(message, null, 2));
  }

  console.log('\nDone');
}

test().catch(console.error);
