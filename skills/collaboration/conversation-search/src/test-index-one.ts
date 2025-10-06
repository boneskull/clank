import { indexConversations } from './indexer.js';

// Index just one small project for testing
indexConversations('-Users-jesse').catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
