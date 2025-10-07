import { parseConversation } from './parser.js';
import { formatConversationText } from './summarizer.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

const PROMPT_TEMPLATE = (text: string) => `Write ONE PARAGRAPH technical summary of this conversation. Include: what the user wanted, what was built/done, and any notable challenges or insights.

If trivial (just "/exit" or no substantive content), respond: "Trivial conversation with no substantive content."

Conversation:
${text}`;

async function summarize(conversationText: string): Promise<string> {
  for await (const message of query({
    prompt: PROMPT_TEMPLATE(conversationText),
    options: {
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 800,
      systemPrompt: 'You are a technical reporter. Write concise, factual summaries. Do not use skills, workflows, or special behaviors - just summarize.'
    }
  })) {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'result') {
      return (message as any).result;
    }
  }
  return '';
}

async function test() {
  const testFiles = [
    '/Users/jesse/.claude/projects/-Users-jesse/4f594254-e72b-4b7b-bf93-53971b481559.jsonl',
    '/Users/jesse/.claude/projects/-Users-jesse--clank/26c0fca0-1a22-4ff7-b544-5c3517b1994c.jsonl',
    '/Users/jesse/.claude/projects/-Users-jesse--claude/469a72aa-64b2-4f8b-9737-5868ac3a4749.jsonl'
  ];

  for (const filePath of testFiles) {
    console.log('\n' + '='.repeat(80));
    console.log(`FILE: ${filePath.split('/').pop()}`);

    const exchanges = await parseConversation(filePath, 'test', filePath);
    console.log(`Exchanges: ${exchanges.length}`);

    if (exchanges.length === 0) {
      console.log('No exchanges - skipping');
      continue;
    }

    const conversationText = formatConversationText(exchanges);

    console.log('\nGenerating summary...\n');
    try {
      const summary = await summarize(conversationText);
      const wordCount = summary.split(/\s+/).length;

      console.log('--- SUMMARY ---');
      console.log(summary);
      console.log(`\n(${wordCount} words)`);
    } catch (error) {
      console.log('ERROR:', error instanceof Error ? error.message : String(error));
    }
  }
}

test().catch(console.error);
