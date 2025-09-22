#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of microservices
const services = [
  'auth-service',
  'patient-service',
  'doctor-service',
  'appointment-service',
  'profile-service',
  'payment-service',
  'registration-service'
];

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}=== Updating package.json files for npm workspaces ===${colors.reset}\n`);

// Process each service
services.forEach(service => {
  const packageJsonPath = path.join(__dirname, service, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`${colors.yellow}Skipping ${service}: package.json not found${colors.reset}`);
    return;
  }
  
  try {
    // Read and parse package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let updated = false;
    
    // Update the shared package reference if it exists
    if (packageJson.dependencies && packageJson.dependencies['health-services-shared']) {
      if (packageJson.dependencies['health-services-shared'] !== '*') {
        packageJson.dependencies['health-services-shared'] = '*';
        updated = true;
      }
    }
    
    if (updated) {
      // Write the updated package.json back to file
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`${colors.green}Updated ${service}/package.json${colors.reset}`);
    } else {
      console.log(`${colors.yellow}No changes needed for ${service}/package.json${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error updating ${service}/package.json: ${error.message}${colors.reset}`);
  }
});

console.log(`\n${colors.bright}${colors.green}Workspace references update complete!${colors.reset}`);
console.log(`\nRun ${colors.bright}npm install${colors.reset} to update your node_modules.`);
