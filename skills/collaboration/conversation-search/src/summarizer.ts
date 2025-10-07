import { ConversationExchange } from './types.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

export function formatConversationText(exchanges: ConversationExchange[]): string {
  return exchanges.map(ex => {
    return `User: ${ex.userMessage}\n\nAgent: ${ex.assistantMessage}`;
  }).join('\n\n---\n\n');
}

async function callClaude(prompt: string, useSonnet = false): Promise<string> {
  const model = useSonnet ? 'sonnet' : 'haiku';

  for await (const message of query({
    prompt,
    options: {
      model,
      maxTokens: 4096,
      systemPrompt: 'Write concise, factual summaries. Output ONLY the summary - no preamble, no "Here is", no "I will". Your output will be indexed directly.'
    }
  })) {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'result') {
      const result = (message as any).result;

      // Check if result is an API error (SDK returns errors as result strings)
      if (typeof result === 'string' && result.includes('API Error') && result.includes('thinking.budget_tokens')) {
        if (!useSonnet) {
          console.log(`    Haiku hit thinking budget error, retrying with Sonnet`);
          return await callClaude(prompt, true);
        }
        // If Sonnet also fails, return error message
        return result;
      }

      return result;
    }
  }
  return '';
}

function chunkExchanges(exchanges: ConversationExchange[], chunkSize: number): ConversationExchange[][] {
  const chunks: ConversationExchange[][] = [];
  for (let i = 0; i < exchanges.length; i += chunkSize) {
    chunks.push(exchanges.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function summarizeConversation(exchanges: ConversationExchange[]): Promise<string> {
  // Handle trivial conversations
  if (exchanges.length === 0) {
    return 'Trivial conversation with no substantive content.';
  }

  if (exchanges.length === 1) {
    const text = formatConversationText(exchanges);
    if (text.length < 100 || exchanges[0].userMessage.trim() === '/exit') {
      return 'Trivial conversation with no substantive content.';
    }
  }

  // For short conversations (≤15 exchanges), summarize directly
  if (exchanges.length <= 15) {
    const conversationText = formatConversationText(exchanges);
    const prompt = `One paragraph summary (150 words max): what was requested, what was done, notable insights. No preamble - output goes directly to index.

${conversationText}`;

    return await callClaude(prompt);
  }

  // For long conversations, use hierarchical summarization
  console.log(`  Long conversation (${exchanges.length} exchanges) - using hierarchical summarization`);

  // Chunk into groups of 8 exchanges
  const chunks = chunkExchanges(exchanges, 8);
  console.log(`  Split into ${chunks.length} chunks`);

  // Summarize each chunk
  const chunkSummaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = formatConversationText(chunks[i]);
    const prompt = `3-4 sentences summarizing this part. No preamble.

${chunkText}`;

    try {
      const summary = await callClaude(prompt);
      chunkSummaries.push(summary);
      console.log(`  Chunk ${i + 1}/${chunks.length}: ${summary.split(/\s+/).length} words`);
    } catch (error) {
      console.log(`  Chunk ${i + 1} failed, skipping`);
    }
  }

  if (chunkSummaries.length === 0) {
    return 'Error: Unable to summarize conversation.';
  }

  // Synthesize chunks into final summary
  const synthesisPrompt = `One paragraph (200 words max) synthesizing the goal, what was accomplished, and key challenges. No preamble - output goes directly to index.

Part summaries:
${chunkSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

  console.log(`  Synthesizing final summary...`);
  try {
    return await callClaude(synthesisPrompt);
  } catch (error) {
    console.log(`  Synthesis failed, using chunk summaries`);
    return chunkSummaries.join(' ');
  }
}
