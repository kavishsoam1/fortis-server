# Commit Message Guidelines

We have precise rules over how our Git commit messages must be formatted. This leads to more readable messages that are easy to follow when looking through the project history and helps with automated JIRA tracking.

## Commit Message Format

Each commit message consists of a **header** that must follow this format:

```
<type>: JIRA-XXXX <subject>
```

The `<type>` and `JIRA-XXXX` must be in lowercase as shown in the example below.

### Examples

```
feat: JIRA-1234 add login functionality
fix: JIRA-5678 fix database connection timeout
docs: JIRA-9101 update API documentation
```

### Type

Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests or correcting existing tests
* **build**: Changes that affect the build system or external dependencies
* **ci**: Changes to our CI configuration files and scripts
* **chore**: Other changes that don't modify src or test files
* **revert**: Reverts a previous commit

### JIRA Ticket

* Must follow the format: `JIRA-XXXX` where `XXXX` is the ticket number
* Must be present in every commit message
* Multiple tickets can be referenced: `JIRA-1234 JIRA-5678`

### Subject

The subject contains a succinct description of the change:

* Use the imperative, present tense: "change" not "changed" nor "changes"
* Don't capitalize the first letter
* No period (.) at the end
* Limit to 50-70 characters

## Rejected Commit Messages

Examples of rejected commit messages:

```
updated login page                    # missing type and JIRA ticket
feat: add login page                  # missing JIRA ticket
FIX JIRA-1234: Login bug             # wrong format, uppercase
fix: JIRA-1234 Fixed login bug.      # not using imperative tense and has period
```
