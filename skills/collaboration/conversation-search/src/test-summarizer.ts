import { parseConversation } from './parser.js';
import { formatConversationText, summarizeConversation } from './summarizer.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function test() {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');

  // Get all conversation files
  const allFiles: Array<{project: string, file: string, path: string}> = [];

  const projects = fs.readdirSync(projectsDir);
  for (const project of projects) {
    const projectPath = path.join(projectsDir, project);
    if (!fs.statSync(projectPath).isDirectory()) continue;

    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      allFiles.push({
        project,
        file,
        path: path.join(projectPath, file)
      });
    }
  }

  // Pick 3 random files
  const shuffled = allFiles.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  for (const {project, file, path: filePath} of selected) {
    console.log('\n='.repeat(80));
    console.log(`PROJECT: ${project}`);
    console.log(`FILE: ${file}`);
    console.log('='.repeat(80));

    const exchanges = await parseConversation(filePath, project, filePath);

    if (exchanges.length === 0) {
      console.log('No exchanges found in this conversation.');
      continue;
    }

    console.log(`\nExchanges: ${exchanges.length}`);
    console.log('\nFormatted conversation (first 500 chars):');
    const formatted = formatConversationText(exchanges);
    console.log(formatted.substring(0, 500) + '...\n');

    console.log('Generating summary with Claude Haiku...');
    const summary = await summarizeConversation(exchanges);
    console.log('\nSUMMARY:');
    console.log(summary);
    console.log('\n');
  }
}

test().catch(console.error);
