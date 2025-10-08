import { indexConversations } from './indexer.js';

async function main() {
  console.log('Indexing 250 conversations...\n');
  
  const startTime = Date.now();
  await indexConversations(undefined, 250);
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`\n✅ Complete! Indexed 250 conversations in ${duration} minutes`);
}

main().catch(console.error);
