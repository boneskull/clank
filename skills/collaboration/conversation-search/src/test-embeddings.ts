import { generateEmbedding, generateExchangeEmbedding } from './embeddings.js';

async function test() {
  console.log('Testing embeddings...');

  const embedding1 = await generateEmbedding('How do I implement authentication?');
  console.log(`Generated embedding with ${embedding1.length} dimensions`);
  console.log(`Sample values: [${embedding1.slice(0, 5).join(', ')}...]`);

  const embedding2 = await generateExchangeEmbedding(
    'How do I handle errors in async code?',
    'Use try/catch blocks around await statements, or use .catch() on promises.'
  );
  console.log(`Exchange embedding: ${embedding2.length} dimensions`);
}

test().catch(console.error);
