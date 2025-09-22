#!/usr/bin/env node

/**
 * Database migration script for running all Sequelize migrations
 */

const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Path to the shared directory where migrations are stored
const sharedDir = path.join(__dirname, 'shared');

// Print intro message
console.log(`${colors.bright}${colors.blue}=== Health Services Database Migration Tool ===${colors.reset}\n`);
console.log(`${colors.yellow}This script will run all Sequelize migrations to set up your database schema.${colors.reset}\n`);

// Check if .env file exists, if not create one with sample values
const envPath = path.join(sharedDir, '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.yellow}Creating sample .env file...${colors.reset}`);
  const sampleEnv = 
`POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=health_services
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
`;
  fs.writeFileSync(envPath, sampleEnv);
  console.log(`${colors.green}Created sample .env file at ${envPath}${colors.reset}`);
  console.log(`${colors.yellow}Please update the database credentials if needed before continuing.${colors.reset}\n`);
}

// Check if sequelize-cli is installed
console.log(`${colors.cyan}Checking dependencies...${colors.reset}`);
const npmLsResult = spawnSync('npm', ['ls', 'sequelize-cli', '--depth=0'], { cwd: sharedDir, shell: true });
const hasSeqCli = npmLsResult.stdout.toString().indexOf('sequelize-cli') !== -1;

if (!hasSeqCli) {
  console.log(`${colors.yellow}Installing sequelize-cli...${colors.reset}`);
  const installResult = spawnSync('npm', ['install', '--save-dev', 'sequelize-cli'], { cwd: sharedDir, stdio: 'inherit', shell: true });
  
  if (installResult.status !== 0) {
    console.error(`${colors.red}Failed to install sequelize-cli. Please install it manually with: npm install --save-dev sequelize-cli${colors.reset}`);
    process.exit(1);
  }
}

// Run the migrations
console.log(`\n${colors.cyan}Running migrations...${colors.reset}`);

const migrateResult = spawnSync('npm', ['run', 'migrate'], { cwd: sharedDir, stdio: 'inherit', shell: true });

if (migrateResult.status === 0) {
  console.log(`\n${colors.green}${colors.bright}✓ Migrations completed successfully!${colors.reset}`);
  console.log(`\n${colors.cyan}Your database is now ready to use with the following schemas:${colors.reset}`);
  console.log(`${colors.dim}- auth: User authentication and sessions${colors.reset}`);
  console.log(`${colors.dim}- patient: Patient information${colors.reset}`);
  console.log(`${colors.dim}- doctor: Doctor, department, and specialty information${colors.reset}`);
  console.log(`${colors.dim}- appointment: Appointment scheduling${colors.reset}`);
  console.log(`${colors.dim}- profile: User profiles and health data${colors.reset}`);
  console.log(`${colors.dim}- payment: Invoices and payments${colors.reset}`);
  console.log(`${colors.dim}- registration: Patient registration${colors.reset}`);
} else {
  console.error(`\n${colors.red}Migration failed. Please check the error messages above.${colors.reset}`);
  process.exit(1);
}
