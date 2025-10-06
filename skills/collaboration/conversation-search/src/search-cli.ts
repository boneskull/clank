import { searchConversations, formatResults } from './search.js';

const query = process.argv[2];

if (!query) {
  console.error('Usage: search-conversations <query>');
  process.exit(1);
}

searchConversations(query)
  .then(results => {
    console.log(formatResults(results));
  })
  .catch(error => {
    console.error('Error searching:', error);
    process.exit(1);
  });
