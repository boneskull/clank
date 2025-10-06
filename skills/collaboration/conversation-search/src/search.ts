import Database from 'better-sqlite3';
import { initDatabase } from './db.js';
import { initEmbeddings, generateEmbedding } from './embeddings.js';
import { SearchResult, ConversationExchange } from './types.js';

export async function searchConversations(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const db = initDatabase();

  // Generate query embedding
  await initEmbeddings();
  const queryEmbedding = await generateEmbedding(query);

  // Search using vector similarity
  const stmt = db.prepare(`
    SELECT
      e.id,
      e.project,
      e.timestamp,
      e.user_message,
      e.assistant_message,
      e.archive_path,
      e.line_start,
      e.line_end,
      vec.distance
    FROM vec_exchanges AS vec
    JOIN exchanges AS e ON vec.id = e.id
    WHERE vec.embedding MATCH ?
      AND k = ?
    ORDER BY vec.distance ASC
  `);

  const results = stmt.all(
    Buffer.from(new Float32Array(queryEmbedding).buffer),
    limit
  );

  db.close();

  return results.map((row: any) => {
    const exchange: ConversationExchange = {
      id: row.id,
      project: row.project,
      timestamp: row.timestamp,
      userMessage: row.user_message,
      assistantMessage: row.assistant_message,
      archivePath: row.archive_path,
      lineStart: row.line_start,
      lineEnd: row.line_end
    };

    // Create snippet (first 200 chars)
    const snippet = exchange.userMessage.substring(0, 200) +
      (exchange.userMessage.length > 200 ? '...' : '');

    return {
      exchange,
      similarity: 1 - row.distance, // Convert distance to similarity
      snippet
    };
  });
}

export function formatResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No results found.';
  }

  let output = `Found ${results.length} relevant conversations:\n\n`;

  results.forEach((result, index) => {
    const date = new Date(result.exchange.timestamp).toISOString().split('T')[0];
    output += `${index + 1}. [${result.exchange.project}, ${date}]\n`;
    output += `   "${result.snippet}"\n`;
    output += `   File: ${result.exchange.archivePath}:${result.exchange.lineStart}-${result.exchange.lineEnd}\n`;
    output += `   Similarity: ${(result.similarity * 100).toFixed(1)}%\n\n`;
  });

  return output;
}
