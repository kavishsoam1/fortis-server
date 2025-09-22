#!/usr/bin/env node

/**
 * This script sets up the repository without requiring husky.
 * It's useful for CI environments or when you just want to install dependencies without git hooks.
 */

const { execSync } = require('child_process');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}=== Setting up Health Services Microservices Repository ===${colors.reset}\n`);

// Function to run a command and handle errors
function runCommand(command, errorMessage) {
  try {
    console.log(`${colors.yellow}> ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}${errorMessage}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Skip husky in the install process
process.env.HUSKY = '0';
console.log(`${colors.yellow}Husky installation disabled for this setup${colors.reset}`);

// Install dependencies
console.log(`\n${colors.bright}Installing dependencies...${colors.reset}`);
if (!runCommand('npm install --no-audit', 'Failed to install dependencies')) {
  process.exit(1);
}

// Update workspace references
console.log(`\n${colors.bright}Updating workspace references...${colors.reset}`);
if (!runCommand('node update-workspace-refs.js', 'Failed to update workspace references')) {
  console.log(`${colors.yellow}Continuing despite workspace reference update failure${colors.reset}`);
}

// Set up any other configurations here if needed
// For example, copying example env files to .env files

console.log(`\n${colors.bright}${colors.green}Repository setup complete!${colors.reset}`);
console.log(`\n${colors.bright}Next steps:${colors.reset}`);
console.log(`  1. ${colors.yellow}Set up the database:${colors.reset} npm run migrate`);
console.log(`  2. ${colors.yellow}Start the services:${colors.reset} npm start`);
console.log(`\nTo set up Husky git hooks later (optional):${colors.reset}`);
console.log(`  ${colors.yellow}npm run setup-husky${colors.reset}`);
