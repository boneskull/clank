import { parseConversation } from './parser.js';
import { formatConversationText } from './summarizer.js';
import { spawn } from 'child_process';
import fs from 'fs';

const PROMPTS = [
  {
    name: 'Original (structured)',
    prompt: (text: string) => `Summarize this conversation in no more than 300 words.

Focus on:
1. What work did the user request?
2. What work was ultimately performed?
3. What was surprising, challenging, insightful, or remarkable?

This summary will help future readers (both users and Claude) understand what happened and learn from the experience. Skip pleasantries and focus on technical substance.

If the conversation was trivial (like just "/exit" or one-word questions with no follow-up), say "Trivial conversation with no substantive content."

Conversation:
${text}`
  },
  {
    name: 'Strict word limit',
    prompt: (text: string) => `You have EXACTLY 300 words. Not 301, not 299. Exactly 300.

Summarize: What was requested, what was done, what was notable.

Conversation:
${text}`
  },
  {
    name: 'Terse directive',
    prompt: (text: string) => `In <300 words: requested work, actual work, notable insights.

${text}`
  },
  {
    name: 'Bullet points',
    prompt: (text: string) => `Bullet point summary (<300 words):
- Requested:
- Performed:
- Notable:

${text}`
  },
  {
    name: 'Reporter style',
    prompt: (text: string) => `Write a technical summary (max 300 words) as if you're a reporter documenting what happened in this engineering session. Focus on facts: what was asked, what was built, what went wrong, what was learned.

${text}`
  },
  {
    name: 'Off-the-wall: Haiku then explain',
    prompt: (text: string) => `First write a haiku capturing the essence of this conversation.
Then expand into a 250-word summary of what happened.

${text}`
  },
  {
    name: 'Off-the-wall: Tabloid headline',
    prompt: (text: string) => `Write a tabloid headline for this conversation, then summarize what actually happened in <300 words.

${text}`
  },
  {
    name: 'Off-the-wall: Tweet thread',
    prompt: (text: string) => `Summarize as a Twitter thread (5 tweets max, 280 chars each). Then consolidate into <300 word summary.

${text}`
  }
];

async function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const claude = spawn('claude', ['--model', 'haiku', '-p'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => stdout += data.toString());
    claude.stderr.on('data', (data) => stderr += data.toString());

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Exit ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });

    claude.stdin.write(prompt);
    claude.stdin.end();

    // Timeout after 60s
    setTimeout(() => {
      claude.kill();
      reject(new Error('Timeout after 60s'));
    }, 60000);
  });
}

async function test() {
  // Use the conversation-search conversation (good size, substantive)
  const testFile = '/Users/jesse/.claude/projects/-Users-jesse--clank/26c0fca0-1a22-4ff7-b544-5c3517b1994c.jsonl';

  const exchanges = await parseConversation(testFile, 'test', testFile);
  const conversationText = formatConversationText(exchanges);

  let report = '# Conversation Summary Prompt Testing Report\n\n';
  report += `**Test Conversation:** ${exchanges.length} exchanges\n\n`;
  report += `**Conversation snippet (first 500 chars):**\n\`\`\`\n${conversationText.substring(0, 500)}...\n\`\`\`\n\n`;
  report += '---\n\n';

  for (const {name, prompt} of PROMPTS) {
    console.log(`\nTesting: ${name}...`);
    report += `## Prompt: ${name}\n\n`;

    const fullPrompt = prompt(conversationText);
    report += `**Prompt text:**\n\`\`\`\n${fullPrompt.substring(0, 300)}...\n\`\`\`\n\n`;

    try {
      const summary = await callClaude(fullPrompt);
      const wordCount = summary.split(/\s+/).length;

      report += `**Result (${wordCount} words):**\n\n${summary}\n\n`;
      report += '---\n\n';

      console.log(`  ✅ Complete (${wordCount} words)`);
    } catch (error) {
      report += `**Error:** ${error}\n\n---\n\n`;
      console.log(`  ❌ Failed: ${error}`);
    }
  }

  // Save report
  fs.writeFileSync('prompt-testing-report.txt', report);
  console.log('\n✅ Report saved to prompt-testing-report.txt');
}

test().catch(console.error);
