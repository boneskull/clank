import { parseConversation } from './parser.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function test() {
  // Find a real conversation file
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projects = fs.readdirSync(projectsDir);

  for (const project of projects) {
    const projectPath = path.join(projectsDir, project);
    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));

    if (files.length > 0) {
      const testFile = path.join(projectPath, files[0]);
      console.log(`Testing parser on: ${testFile}`);

      const exchanges = await parseConversation(testFile, project, testFile);
      console.log(`Found ${exchanges.length} exchanges`);

      if (exchanges.length > 0) {
        console.log('\nFirst exchange:');
        console.log('User:', exchanges[0].userMessage.substring(0, 100) + '...');
        console.log('Assistant:', exchanges[0].assistantMessage.substring(0, 100) + '...');
      }

      break;
    }
  }
}

test().catch(console.error);
