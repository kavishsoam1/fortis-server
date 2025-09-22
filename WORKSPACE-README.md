# npm Workspaces Guide for Health Services Microservices

This project uses npm workspaces to manage dependencies across multiple microservices. This allows for more efficient dependency management and simpler development workflows.

## Prerequisites

- Node.js 14 or higher
- npm 7 or higher (required for workspaces support)

## Getting Started

### 1. Initial Setup

After cloning the repository, run the following command in the root directory to install all dependencies for all services:

```bash
npm install
```

This single command will:
- Install dependencies for all microservices
- Install shared dependencies
- Set up Husky for commit hooks (automatically via postinstall)

### 2. Database Setup

Initialize the database with all required schemas and tables:

```bash
npm run migrate
```

### 3. Starting Services

You can start all services in parallel:

```bash
npm start
```

Or start individual services:

```bash
npm run start:auth
npm run start:patient
npm run start:doctor
# etc.
```

## Working with Workspaces

### Adding Dependencies to a Specific Service

To add a dependency to a specific service:

```bash
npm install express --workspace=auth-service
```

### Adding Dependencies to Multiple Services

```bash
npm install express --workspace=auth-service --workspace=patient-service
```

### Adding a Dependency to All Services

```bash
npm install lodash -ws
```

### Adding a Development Dependency to the Root

```bash
npm install jest -D -w
```

### Running Scripts in a Specific Workspace

```bash
npm run test --workspace=auth-service
```

### Running the Same Script in All Workspaces

```bash
npm run test --workspaces
```

## Managing Versions

To update a package across all services:

```bash
npm update express -ws
```

## Git Workflow & Husky Integration

This project uses Husky to enforce code quality and consistent commit messages:

### Pre-commit Hook

- Runs ESLint on staged files
- Prevents committing code with linting errors

### Commit Message Format

Commits must follow the format:
```
<type>: JIRA-XXXX <description>
```

Where `<type>` is one of:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes

Example:
```
feat: JIRA-1234 Add user authentication
```

## Troubleshooting

### "Invalid workspace" error

Ensure the service name in your command matches exactly with the directory name.

### Circular dependencies

If you encounter circular dependency warnings, review your package.json files to ensure services don't depend on each other directly.

### Husky not running

If Husky hooks aren't running:

```bash
npm run setup-husky
```

This will ensure all Husky scripts are properly installed and executable.
