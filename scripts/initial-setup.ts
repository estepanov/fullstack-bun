#!/usr/bin/env bun

// @ts-ignore
import { execSync } from 'child_process';
// @ts-ignore
import { join } from 'path';

const directories = ['apps/api', 'apps/frontend'];


function copyEnvFile(directory: string) {
  try {
    console.log(`Processing ${directory}...`);
    const command = `cp ${join(directory, '.env.example')} ${join(directory, '.env')}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Successfully copied .env.example to .env in ${directory}`);
  } catch (error) {
    console.error(`❌ Error processing ${directory}:`, error);
  }
}

function main() {
  console.log('Starting environment file setup...');
  
  for (const directory of directories) {
    copyEnvFile(directory);
  }
  
  console.log('Environment file setup completed!');
}

main();
