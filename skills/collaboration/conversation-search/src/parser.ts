import fs from 'fs';
import readline from 'readline';
import { ConversationExchange } from './types.js';
import crypto from 'crypto';

interface JSONLMessage {
  type: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string }>;
  };
  timestamp?: string;
  uuid?: string;
}

export async function parseConversation(
  filePath: string,
  projectName: string,
  archivePath: string
): Promise<ConversationExchange[]> {
  const exchanges: ConversationExchange[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  let currentUser: { message: string; line: number } | null = null;

  for await (const line of rl) {
    lineNumber++;

    try {
      const parsed: JSONLMessage = JSON.parse(line);

      // Skip non-message types
      if (parsed.type !== 'user' && parsed.type !== 'assistant') {
        continue;
      }

      if (!parsed.message) {
        continue;
      }

      // Extract text from message content
      let text = '';
      if (typeof parsed.message.content === 'string') {
        text = parsed.message.content;
      } else if (Array.isArray(parsed.message.content)) {
        text = parsed.message.content
          .filter(block => block.type === 'text' && block.text)
          .map(block => block.text)
          .join('\n');
      }

      if (parsed.message.role === 'user') {
        currentUser = { message: text, line: lineNumber };
      } else if (parsed.message.role === 'assistant' && currentUser) {
        // Create exchange
        const exchange: ConversationExchange = {
          id: crypto
            .createHash('md5')
            .update(`${archivePath}:${currentUser.line}-${lineNumber}`)
            .digest('hex'),
          project: projectName,
          timestamp: parsed.timestamp || new Date().toISOString(),
          userMessage: currentUser.message,
          assistantMessage: text,
          archivePath,
          lineStart: currentUser.line,
          lineEnd: lineNumber
        };

        exchanges.push(exchange);
        currentUser = null;
      }
    } catch (error) {
      // Skip malformed JSON lines
      continue;
    }
  }

  return exchanges;
}
