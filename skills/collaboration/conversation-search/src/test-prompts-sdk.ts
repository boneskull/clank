import { parseConversation } from './parser.js';
import { formatConversationText } from './summarizer.js';
import { query } from '@anthropic-ai/claude-agent-sdk';
import fs from 'fs';

const PROMPTS = [
  {
    name: 'V1: Reporter style (current)',
    wordLimit: 250,
    prompt: (text: string) => `Write a technical summary (MAXIMUM 250 words - count them!) documenting what happened in this engineering session. Focus on facts: what was asked, what was built, what went wrong, what was learned.

If the conversation was trivial (just "/exit" or one-word questions with no follow-up), respond with only: "Trivial conversation with no substantive content."

Be ruthlessly concise. Skip filler words.

Conversation:
${text}`
  },
  {
    name: 'V2: Strict ruthless',
    wordLimit: 200,
    prompt: (text: string) => `200 words MAXIMUM. Not 201.

What was requested. What was delivered. What was notable. Facts only.

Skip:
- Introductions
- Meta-commentary
- Filler

Conversation:
${text}`
  },
  {
    name: 'V3: Bullet executive brief',
    wordLimit: 250,
    prompt: (text: string) => `Executive brief (max 250 words):

**Requested:**
**Delivered:**
**Issues/Insights:**

Conversation:
${text}`
  },
  {
    name: 'V4: Telegram message',
    wordLimit: 300,
    prompt: (text: string) => `Imagine explaining this conversation to a colleague via Telegram. Write 2-3 short messages (total <300 words) covering: what happened, key decisions, anything surprising.

Conversation:
${text}`
  },
  {
    name: 'V5: Engineering log entry',
    wordLimit: 250,
    prompt: (text: string) => `You're writing an engineering log entry for this session. Document (max 250 words):
- Problem/goal
- Solution approach
- Blockers encountered
- Final status

Conversation:
${text}`
  },
  {
    name: 'V6: One sentence + bullets',
    wordLimit: 250,
    prompt: (text: string) => `One sentence summary, then bullet points (max 250 words total).

Conversation:
${text}`
  }
];

async function callSummarizer(prompt: string, maxTokens: number): Promise<string> {
  for await (const message of query({
    prompt,
    options: {
      model: 'claude-3-5-haiku-20241022',
      maxTokens,
      systemPrompt: 'You are a technical reporter. Summarize conversations concisely and factually. Do not use skills, workflows, or any special behaviors - just summarize as requested.'
    }
  })) {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'result') {
      return (message as any).result;
    }
  }
  return '';
}

async function test() {
  // Use ESP32 conversation (substantive, multi-turn)
  const testFile = '/Users/jesse/.claude/projects/-Users-jesse/4f594254-e72b-4b7b-bf93-53971b481559.jsonl';

  const exchanges = await parseConversation(testFile, 'test', testFile);
  const conversationText = formatConversationText(exchanges);

  let report = '# Conversation Summary Prompt Testing Report (SDK Version)\n\n';
  report += `**Test Date:** ${new Date().toISOString()}\n`;
  report += `**Test Conversation:** ESP32 Bluetooth Microphone (39 exchanges)\n`;
  report += `**Conversation length:** ${conversationText.length} characters\n\n`;
  report += `**Conversation preview (first 500 chars):**\n\`\`\`\n${conversationText.substring(0, 500)}...\n\`\`\`\n\n`;
  report += '---\n\n';

  for (const {name, wordLimit, prompt} of PROMPTS) {
    console.log(`\nTesting: ${name}...`);
    report += `## ${name}\n\n`;

    const fullPrompt = prompt(conversationText);
    report += `**Word limit:** ${wordLimit}\n\n`;
    report += `**Prompt:**\n\`\`\`\n${fullPrompt.substring(0, 400)}...\n\`\`\`\n\n`;

    try {
      const maxTokens = Math.ceil(wordLimit * 1.5);  // tokens ≈ words * 1.3
      const summary = await callSummarizer(fullPrompt, maxTokens);
      const wordCount = summary.split(/\s+/).length;

      report += `**Result (${wordCount} words):**\n\n${summary}\n\n`;

      if (wordCount > wordLimit) {
        report += `⚠️ OVER LIMIT by ${wordCount - wordLimit} words\n\n`;
      } else {
        report += `✅ Within limit\n\n`;
      }

      report += '---\n\n';
      console.log(`  ✅ Complete (${wordCount} words)`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      report += `**Error:** ${errorMsg}\n\n---\n\n`;
      console.log(`  ❌ Failed: ${errorMsg.substring(0, 100)}`);
    }
  }

  // Save report
  fs.writeFileSync('prompt-testing-report-sdk.txt', report);
  console.log('\n✅ Report saved to prompt-testing-report-sdk.txt');
}

test().catch(console.error);
