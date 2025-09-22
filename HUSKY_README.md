# Husky Setup for Commit Guidelines

This project uses Husky to enforce commit message formatting and code quality checks.

## Commit Message Format

All commits must follow this format:
```
<type>: JIRA-XXXX <description>
```

For example:
```
feat: JIRA-1234 Add user authentication feature
fix: JIRA-5678 Fix database connection issue
```

### Commit Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect the meaning of the code (formatting, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## Installation

After cloning the repository, run:
```bash
npm install
npm run prepare
```

This will install Husky and set up the git hooks.

## Hooks Installed

1. **pre-commit**: Runs ESLint on staged files before committing
2. **commit-msg**: Validates the commit message format
3. **pre-push**: Runs ESLint on all files before pushing

## Bypassing Hooks (not recommended)

In emergencies, you can bypass Husky hooks with:
```bash
git commit --no-verify -m "your message"
git push --no-verify
```

However, this is not recommended and should only be used in exceptional circumstances.
