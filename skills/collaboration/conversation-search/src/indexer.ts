import fs from 'fs';
import path from 'path';
import os from 'os';
import { initDatabase, insertExchange } from './db.js';
import { parseConversation } from './parser.js';
import { initEmbeddings, generateExchangeEmbedding } from './embeddings.js';
import { summarizeConversation } from './summarizer.js';
import { ConversationExchange } from './types.js';

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const ARCHIVE_DIR = path.join(os.homedir(), '.clank', 'conversation-archive');

// Projects to exclude from indexing (meta-conversations about conversations)
const EXCLUDED_PROJECTS = [
  '-Users-jesse-Documents-GitHub-projects-claude-introspection'
];

export async function indexConversations(limitToProject?: string): Promise<void> {
  console.log('Initializing database...');
  const db = initDatabase();

  console.log('Loading embedding model...');
  await initEmbeddings();

  console.log('Scanning for conversation files...');
  const projects = fs.readdirSync(PROJECTS_DIR);

  let totalExchanges = 0;

  for (const project of projects) {
    // Skip excluded projects
    if (EXCLUDED_PROJECTS.includes(project)) {
      console.log(`\nSkipping excluded project: ${project}`);
      continue;
    }

    // Skip if limiting to specific project
    if (limitToProject && project !== limitToProject) continue;
    const projectPath = path.join(PROJECTS_DIR, project);
    const stat = fs.statSync(projectPath);

    if (!stat.isDirectory()) continue;

    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) continue;

    console.log(`\nProcessing project: ${project} (${files.length} conversations)`);

    // Create archive directory for this project
    const projectArchive = path.join(ARCHIVE_DIR, project);
    fs.mkdirSync(projectArchive, { recursive: true });

    for (const file of files) {
      const sourcePath = path.join(projectPath, file);
      const archivePath = path.join(projectArchive, file);

      // Copy to archive
      if (!fs.existsSync(archivePath)) {
        fs.copyFileSync(sourcePath, archivePath);
        console.log(`  Archived: ${file}`);
      }

      // Parse conversation
      const exchanges = await parseConversation(sourcePath, project, archivePath);

      if (exchanges.length === 0) {
        console.log(`  Skipped ${file} (no exchanges)`);
        continue;
      }

      // Generate and save summary
      const summaryPath = archivePath.replace('.jsonl', '-summary.txt');
      if (!fs.existsSync(summaryPath)) {
        try {
          const summary = await summarizeConversation(exchanges);
          fs.writeFileSync(summaryPath, summary, 'utf-8');
          console.log(`  Summary: ${summary.split(/\s+/).length} words`);
        } catch (error) {
          console.log(`  Summary failed: ${error}`);
        }
      }

      // Generate embeddings and insert
      for (const exchange of exchanges) {
        const embedding = await generateExchangeEmbedding(
          exchange.userMessage,
          exchange.assistantMessage
        );

        insertExchange(db, exchange, embedding);
      }

      totalExchanges += exchanges.length;
      console.log(`  Indexed ${file}: ${exchanges.length} exchanges`);
    }
  }

  db.close();
  console.log(`\n✅ Indexing complete! Total exchanges: ${totalExchanges}`);
}
