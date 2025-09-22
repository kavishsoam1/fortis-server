#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}=== Setting up Husky for commit message formatting ===${colors.reset}\n`);

// Get the path to the node executable
function getNodePath() {
  // First check if we can get it from process.execPath (most reliable)
  if (process.execPath) {
    return process.execPath;
  }

  // Try to find node using 'where' on Windows or 'which' on Unix
  try {
    const command = os.platform() === 'win32' ? 'where node' : 'which node';
    return execSync(command, { encoding: 'utf8' }).trim().split('\n')[0];
  } catch (error) {
    // If that fails, use a default path based on platform
    if (os.platform() === 'win32') {
      // Try common Windows paths
      const commonPaths = [
        'C:\\Program Files\\nodejs\\node.exe',
        'C:\\Program Files (x86)\\nodejs\\node.exe'
      ];
      for (const nodePath of commonPaths) {
        if (fs.existsSync(nodePath)) {
          return nodePath;
        }
      }
    }
    // If all else fails, just use 'node' and hope it works
    return 'node';
  }
}

// Function to run shell commands
function runCommand(command) {
  try {
    console.log(`${colors.yellow}> ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to execute: ${command}${colors.reset}`);
    console.error(`${colors.red}Error details: ${error.message}${colors.reset}`);
    return false;
  }
}

// Install necessary packages
console.log(`${colors.bright}Installing required dependencies...${colors.reset}`);
if (!runCommand('npm install')) {
  process.exit(1);
}

// Make husky scripts executable
console.log(`\n${colors.bright}Making Husky scripts executable...${colors.reset}`);
const huskyDir = path.join(__dirname, '.husky');
const huskyScripts = ['pre-commit', 'commit-msg', 'pre-push'];

huskyScripts.forEach(script => {
  const scriptPath = path.join(huskyDir, script);
  if (fs.existsSync(scriptPath)) {
    try {
      fs.chmodSync(scriptPath, '755');
      console.log(`${colors.green}Made ${script} executable${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Failed to make ${script} executable: ${error.message}${colors.reset}`);
    }
  } else {
    console.error(`${colors.red}Script ${script} not found${colors.reset}`);
  }
});

// Also make husky.sh executable
const huskyShPath = path.join(huskyDir, '_', 'husky.sh');
if (fs.existsSync(huskyShPath)) {
  try {
    fs.chmodSync(huskyShPath, '755');
    console.log(`${colors.green}Made husky.sh executable${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to make husky.sh executable: ${error.message}${colors.reset}`);
  }
}

// Initialize Husky
console.log(`\n${colors.bright}Initializing Husky...${colors.reset}`);

// Get Node path for more reliable execution
const nodePath = getNodePath();
console.log(`${colors.green}Using Node from: ${nodePath}${colors.reset}`);

try {
  console.log(`${colors.yellow}> npx husky install${colors.reset}`);
  const result = spawnSync('npx', ['husky', 'install'], { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`${colors.red}Failed to initialize Husky with exit code: ${result.status}${colors.reset}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`${colors.red}Failed to initialize Husky: ${error.message}${colors.reset}`);
  process.exit(1);
}

console.log(`\n${colors.bright}${colors.green}Setup complete!${colors.reset}`);
console.log(`\n${colors.bright}Commit Format:${colors.reset}`);
console.log(`  ${colors.yellow}<type>: JIRA-XXXX <description>${colors.reset}`);
console.log(`\n${colors.bright}Example:${colors.reset}`);
console.log(`  ${colors.green}feat: JIRA-1234 Add user authentication${colors.reset}`);
console.log(`  ${colors.green}fix: JIRA-5678 Fix database connection issue${colors.reset}`);

console.log(`\n${colors.bright}Available commit types:${colors.reset}`);
console.log(`  ${colors.blue}feat${colors.reset}     - A new feature`);
console.log(`  ${colors.blue}fix${colors.reset}      - A bug fix`);
console.log(`  ${colors.blue}docs${colors.reset}     - Documentation changes`);
console.log(`  ${colors.blue}style${colors.reset}    - Formatting changes`);
console.log(`  ${colors.blue}refactor${colors.reset} - Code restructuring`);
console.log(`  ${colors.blue}perf${colors.reset}     - Performance improvements`);
console.log(`  ${colors.blue}test${colors.reset}     - Adding/updating tests`);
console.log(`  ${colors.blue}build${colors.reset}    - Build system changes`);
console.log(`  ${colors.blue}ci${colors.reset}       - CI configuration changes`);
console.log(`  ${colors.blue}chore${colors.reset}    - Other changes`);

console.log(`\n${colors.bright}For more information, see HUSKY_README.md${colors.reset}`);
