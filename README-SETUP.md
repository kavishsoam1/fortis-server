# Setting Up Husky in Health Services Microservices

This guide explains how to set up Husky to enforce commit message formatting with JIRA IDs and prevent pushing code with errors.

## What's Included

1. **Commit Message Formatting**: All commits must follow the format `<type>: JIRA-XXXX <description>`
2. **Pre-commit Linting**: Checks JavaScript files for errors before committing
3. **Pre-push Checks**: Prevents pushing if there are any ESLint errors in the codebase

## Installation Steps

### 1. Install Dependencies

First, install the required npm packages:

```bash
# Navigate to the root of the repository
cd /path/to/health-services-microservices

# Install dependencies from package.json
npm install
```

### 2. Run the Setup Script

We've provided a setup script to make it easy to initialize everything:

```bash
# Run the setup script
npm run setup-husky
```

This will:
- Install all required dependencies
- Make Husky scripts executable
- Initialize Husky hooks

### 3. Verify Installation

After running the setup, you can verify that Husky is working by:

1. Making a change to any file
2. Attempting to commit with an incorrect message format:
   ```bash
   git commit -m "updated something"  # This should fail
   ```
3. Trying with the correct format:
   ```bash
   git commit -m "feat: JIRA-1234 add new feature"  # This should succeed if there are no linting errors
   ```

## Manual Setup (if needed)

If the automatic script doesn't work, you can set up Husky manually:

```bash
# Install dependencies
npm install

# Initialize Husky
npx husky install

# Make scripts executable (on Unix-based systems)
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
chmod +x .husky/_/husky.sh
```

## Commit Message Format

All commits must follow this format:
```
<type>: JIRA-XXXX <description>
```

For example:
```
feat: JIRA-1234 add user authentication
fix: JIRA-5678 fix database connection issue
```

See [COMMIT_CONVENTION.md](./.github/COMMIT_CONVENTION.md) for more details.

## Troubleshooting

### ESLint Errors

If you're getting ESLint errors, you can fix them automatically:

```bash
npm run lint:fix
```

### Bypassing Hooks (Not Recommended)

In case of emergency, you can bypass the hooks:

```bash
git commit --no-verify -m "your message"
git push --no-verify
```

**Note:** This is not recommended and should only be used in exceptional circumstances.
