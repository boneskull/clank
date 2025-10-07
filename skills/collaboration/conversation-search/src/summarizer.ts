import { ConversationExchange } from './types.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

export function formatConversationText(exchanges: ConversationExchange[]): string {
  return exchanges.map(ex => {
    return `User: ${ex.userMessage}\n\nAgent: ${ex.assistantMessage}`;
  }).join('\n\n---\n\n');
}

function extractSummary(text: string): string {
  const match = text.match(/<summary>(.*?)<\/summary>/s);
  if (match) {
    return match[1].trim();
  }
  // Fallback if no tags found
  return text.trim();
}

async function callClaude(prompt: string, useSonnet = false): Promise<string> {
  const model = useSonnet ? 'sonnet' : 'haiku';

  for await (const message of query({
    prompt,
    options: {
      model,
      maxTokens: 4096,
      maxThinkingTokens: 0,  // Disable extended thinking
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
    const prompt = `Summarize this conversation in one paragraph. Put your summary in <summary></summary> tags.

Good example:
<summary>The user requested help implementing authentication in a React app. We added JWT-based auth with refresh tokens, implemented protected routes, and fixed a token expiration bug. Key challenge was handling token refresh during ongoing requests.</summary>

Bad example:
<summary>Here's a summary of the conversation: The conversation was about authentication...</summary>

Your turn - be direct, factual, concise (150 words max):

${conversationText}`;

    const result = await callClaude(prompt);
    return extractSummary(result);
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
    const prompt = `Summarize this part in 3-4 sentences. Use <summary></summary> tags.

${chunkText}

Example: <summary>User asked about X. We implemented Y using Z library. Hit issue with A, fixed by B.</summary>`;

    try {
      const summary = await callClaude(prompt);
      const extracted = extractSummary(summary);
      chunkSummaries.push(extracted);
      console.log(`  Chunk ${i + 1}/${chunks.length}: ${extracted.split(/\s+/).length} words`);
    } catch (error) {
      console.log(`  Chunk ${i + 1} failed, skipping`);
    }
  }

  if (chunkSummaries.length === 0) {
    return 'Error: Unable to summarize conversation.';
  }

  // Synthesize chunks into final summary
  const synthesisPrompt = `These are summaries from parts of one long conversation. Write one cohesive paragraph covering the overall goal, what was accomplished, and key challenges. Use <summary></summary> tags.

Part summaries:
${chunkSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}

Good example:
<summary>The user wanted to build a conversation search system. We implemented JavaScript-based indexing with local embeddings and sqlite-vec for vector search. Main challenge was handling long conversations via hierarchical summarization. Final system archives conversations and enables semantic search.</summary>

Bad example:
<summary>Here's a synthesis of the parts: The conversation covered several topics...</summary>

Your turn (200 words max):`;

  console.log(`  Synthesizing final summary...`);
  try {
    const result = await callClaude(synthesisPrompt);
    return extractSummary(result);
  } catch (error) {
    console.log(`  Synthesis failed, using chunk summaries`);
    return chunkSummaries.join(' ');
  }
}
