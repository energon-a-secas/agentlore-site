export const context = [

  {
    id: 'write-effective-claude-md',
    title: 'Write an Effective CLAUDE.md',
    description: 'Structure project context so AI agents understand your codebase fast',
    category: 'context',
    tools: ['claude', 'cursor'],
    difficulty: 'beginner',
    content: `## Why CLAUDE.md matters

\`CLAUDE.md\` is the first file AI agents read when entering your project. A good one saves minutes per session by eliminating repeated questions.

## Auto-generate with /init

Generate a starter CLAUDE.md automatically. Run this in your project:

\`\`\`bash
claude /init
\`\`\`

Claude scans your codebase and generates a starter CLAUDE.md with structure, commands, and conventions. Review and customize it from there.

## Essential sections

\`\`\`markdown
# CLAUDE.md

## Project Overview
One paragraph: what this project does, who uses it, core tech stack.

## Architecture
Key directories, file naming patterns, data flow summary.

## Commands
How to run, test, build, deploy.

## Conventions
Coding style, naming rules, patterns to follow.

## Gotchas
Non-obvious behaviors, known issues, things that break easily.
\`\`\`

## Tips for great CLAUDE.md files

- **Be specific**: "Use camelCase for JS variables" beats "follow conventions"
- **Include run commands**: agents need exact commands, not vague instructions
- **List file paths**: reference actual files, not abstract concepts
- **Update regularly**: stale context is worse than no context
- **Keep it under 500 lines**: progressive disclosure beats a wall of text

## Progressive disclosure pattern

Put details in separate files, reference them from CLAUDE.md:

\`\`\`markdown
See \`docs/api.md\` for endpoint details.
See \`docs/deployment.md\` for deploy steps.
\`\`\``,
  },

  {
    id: 'setup-cursorrules',
    title: 'Set Up .cursorrules',
    description: 'Configure Cursor-specific behavior with rules files',
    category: 'context',
    tools: ['cursor'],
    difficulty: 'beginner',
    content: `## What are Cursor rules?

Rules are instruction files that Cursor loads based on file patterns, telling the AI how to handle specific parts of your codebase.

## File locations

\`\`\`
.cursor/rules/
  frontend.md       # Rules for React components
  backend.md        # Rules for API routes
  testing.md        # Rules for test files
\`\`\`

## Rule file format

Each rule file uses frontmatter to specify when it applies:

\`\`\`markdown
---
description: Rules for React components
globs: ["src/components/**/*.tsx", "src/components/**/*.ts"]
alwaysApply: false
---

## Component conventions

- Use functional components with TypeScript
- Props interface named \`{ComponentName}Props\`
- Place hooks at the top of the component
- Export components as named exports
\`\`\`

## Frontmatter options

| Field | Purpose |
|-------|---------|
| \`description\` | When the rule applies (shown to the agent) |
| \`globs\` | File patterns that trigger this rule |
| \`alwaysApply\` | If true, loaded for every conversation |

## Tips

- Use \`alwaysApply: true\` sparingly (only for universal project conventions)
- Keep rules focused: one rule per concern
- Include examples of correct and incorrect patterns`,
  },

  {
    id: 'explore-unfamiliar-codebase',
    title: 'Explore Unfamiliar Codebases',
    description: 'Strategies for context switching into repos you have never seen',
    category: 'context',
    tools: ['claude', 'cursor'],
    difficulty: 'intermediate',
    content: `## The cold-start problem

Jumping into an unfamiliar codebase wastes time if you (or your AI agent) don't know where to look. Here's a systematic approach.

## Step 1: Read the entry points

\`\`\`
1. README.md -- what the project does
2. CLAUDE.md / .cursorrules -- AI-specific context
3. package.json / Makefile / Cargo.toml -- commands and deps
4. Directory listing (top-level only)
\`\`\`

## Step 2: Use explore agents

In Cursor, launch an explore agent:

> "Explore the codebase and explain the architecture. Focus on data flow and key entry points."

In Claude Code, use the Task tool with \`subagent_type="explore"\`:

> "Explore the src/ directory. Map the module structure and identify the main entry point, routing, and data layer."

## Step 3: Build a mental model

Ask targeted questions:

- "Where does authentication happen?"
- "How does data flow from the API to the UI?"
- "What are the key abstractions?"

## Step 4: Write what you learned

Create or update CLAUDE.md with what you discovered. Future sessions (yours or someone else's) will start faster.

## Anti-patterns

- Reading every file top-to-bottom (too slow)
- Skipping README and guessing (too error-prone)
- Asking vague questions like "explain everything" (too broad)`,
  },

  {
    id: 'ignore-files',
    title: 'Ignore Files for AI',
    description: 'Use .claudeignore and .cursorignore to exclude files from AI context',
    category: 'context',
    tools: ['claude', 'cursor'],
    difficulty: 'beginner',
    content: `## Why ignore files?

AI agents read your project files for context. Large or irrelevant files waste tokens, slow responses, and can confuse the agent.

## .claudeignore

Works like \`.gitignore\`. Place at your project root:

\`\`\`
node_modules/
dist/
build/
*.min.js
*.lock
.env
coverage/
\`\`\`

Claude Code skips these files when reading your project.

## .cursorignore

Same syntax, same purpose for Cursor:

\`\`\`
node_modules/
dist/
*.min.js
.env
\`\`\`

Place at your project root. Cursor will not index or read these files.

## What to ignore

| Always ignore | Consider ignoring |
|--------------|-------------------|
| node_modules, dist, build | Large data files (.csv, .json dumps) |
| .env, credentials | Generated code |
| Lock files | Binary assets (images, fonts) |
| coverage/ | Vendored dependencies |

## Tip

Start with your \`.gitignore\` as a base, then add project-specific exclusions. Both tools respect their own ignore file independently of git.

Source: [docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)`,
  },

  {
    id: 'cursor-at-references',
    title: 'Cursor @ References',
    description: 'Use @file, @folder, @web, and @docs to give the AI precise context',
    category: 'context',
    tools: ['cursor'],
    difficulty: 'beginner',
    content: `## What are @ references?

In Cursor chat or Composer, type \`@\` to attach specific context to your message. This tells the AI exactly what to look at instead of guessing.

## Reference types

| Reference | What it does |
|-----------|-------------|
| \`@file\` | Attach a specific file to the conversation |
| \`@folder\` | Include all files in a directory |
| \`@code\` | Reference a specific symbol (function, class) |
| \`@web\` | Search the web for current information |
| \`@docs\` | Search indexed documentation |
| \`@git\` | Reference git history (diffs, commits) |
| \`@codebase\` | Search across the entire codebase |
| \`@notepads\` | Include a saved notepad |

## Usage examples

\`\`\`
@auth.ts fix the login validation bug

@src/components/ create a new Button component matching the existing style

@web what is the latest React 19 API for use()

@git review the last 3 commits for issues
\`\`\`

## Tips

- Use \`@file\` for targeted questions about specific code
- Use \`@folder\` when the AI needs to understand a module
- Use \`@codebase\` sparingly — it uses more tokens
- Combine references: \`@auth.ts @types.ts fix the type mismatch\`

Source: [docs.cursor.com/context/@-symbols](https://docs.cursor.com/context/@-symbols)`,
  },

  {
    id: 'cursor-notepads',
    title: 'Notepads in Cursor',
    description: 'Save reusable context blocks that you can attach to any conversation',
    category: 'context',
    tools: ['cursor'],
    difficulty: 'intermediate',
    content: `## What are Notepads?

Notepads are saved text snippets in Cursor that you can attach to any chat with \`@notepads\`. Reusable context blocks — like bookmarks for instructions.

## When to use Notepads vs Rules

| Use Notepads for... | Use Rules for... |
|--------------------|-----------------|
| Context you need sometimes | Rules that always apply |
| API docs, design specs | Coding conventions |
| One-off reference material | File-pattern-based behavior |
| Temporary project notes | Persistent project standards |

## Creating a Notepad

1. Open the Notepads panel (sidebar)
2. Click "New Notepad"
3. Give it a name and paste your content

Example: save your API schema, design system tokens, or a feature spec.

## Using in conversation

\`\`\`
@notepad:api-schema add a new endpoint for user preferences
@notepad:design-tokens create a card component using our color system
\`\`\`

## Tips

- Keep notepads focused on one topic
- Update them as specs change
- Use them for context outside code files (design docs, meeting notes, requirements)

Source: [docs.cursor.com/context/notepads](https://docs.cursor.com/context/notepads)`,
  },

];
