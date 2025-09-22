module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower'],
    'jira-ticket': [2, 'always']
  },
  plugins: [
    {
      rules: {
        'jira-ticket': ({ subject }) => {
          const jiraTicketRegex = /\bJIRA-[0-9]+\b/;
          return [
            jiraTicketRegex.test(subject),
            'Your commit message must contain a JIRA ticket reference (e.g. JIRA-1234)'
          ];
        }
      }
    }
  ],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)(?:\(([a-zA-Z-_]+)\))?: ((?:JIRA-[0-9]+\s)+)(.+)$/,
      headerCorrespondence: ['type', 'scope', 'ticket', 'subject']
    }
  }
};
