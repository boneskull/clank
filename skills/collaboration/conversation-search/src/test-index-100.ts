import { indexConversations } from './indexer.js';

// Index first 100 conversations with summaries
indexConversations(undefined, 100).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
