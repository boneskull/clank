#!/usr/bin/env node
import { verifyIndex, repairIndex } from './verify.js';
import { indexSession, indexUnprocessed, indexConversations } from './indexer.js';
import { initDatabase } from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  try {
    switch (command) {
      case 'index-session':
        if (!arg) {
          console.error('Usage: index-cli index-session <session-id>');
          process.exit(1);
        }
        await indexSession(arg);
        break;

      case 'index-cleanup':
        await indexUnprocessed();
        break;

      case 'verify':
        console.log('Verifying conversation index...');
        const issues = await verifyIndex();

        console.log('\n=== Verification Results ===');
        console.log(`Missing summaries: ${issues.missing.length}`);
        console.log(`Orphaned entries: ${issues.orphaned.length}`);
        console.log(`Outdated files: ${issues.outdated.length}`);
        console.log(`Corrupted files: ${issues.corrupted.length}`);

        if (issues.missing.length > 0) {
          console.log('\nMissing summaries:');
          issues.missing.forEach(m => console.log(`  ${m.path}`));
        }

        if (issues.missing.length + issues.orphaned.length + issues.outdated.length + issues.corrupted.length > 0) {
          console.log('\nRun with --repair to fix these issues.');
          process.exit(1);
        } else {
          console.log('\n✅ Index is healthy!');
        }
        break;

      case 'repair':
        console.log('Verifying conversation index...');
        const repairIssues = await verifyIndex();

        if (repairIssues.missing.length + repairIssues.orphaned.length + repairIssues.outdated.length > 0) {
          await repairIndex(repairIssues);
        } else {
          console.log('✅ No issues to repair!');
        }
        break;

      case 'rebuild':
        console.log('Rebuilding entire index...');

        // Delete database
        const dbPath = path.join(os.homedir(), '.clank', 'conversation-index', 'db.sqlite');
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
          console.log('Deleted existing database');
        }

        // Delete all summary files
        const archiveDir = path.join(os.homedir(), '.clank', 'conversation-archive');
        if (fs.existsSync(archiveDir)) {
          const projects = fs.readdirSync(archiveDir);
          for (const project of projects) {
            const projectPath = path.join(archiveDir, project);
            if (!fs.statSync(projectPath).isDirectory()) continue;

            const summaries = fs.readdirSync(projectPath).filter(f => f.endsWith('-summary.txt'));
            for (const summary of summaries) {
              fs.unlinkSync(path.join(projectPath, summary));
            }
          }
          console.log('Deleted all summary files');
        }

        // Re-index everything
        console.log('Re-indexing all conversations...');
        await indexConversations();
        break;

      case 'index-all':
      default:
        await indexConversations();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
