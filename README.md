<div align="center">

# Agent Lore

**Browse AI agent tutorials for Claude and Cursor**

[![Live][badge-site]][url-site]
[![HTML5][badge-html]][url-html]
[![CSS3][badge-css]][url-css]
[![JavaScript][badge-js]][url-js]
[![Claude Code][badge-claude]][url-claude]
[![License][badge-license]](LICENSE)

</div>

---

## Overview

Agent Lore is a searchable tutorial hub for AI-assisted development workflows. It covers agent skills, slash commands, context switching strategies, Mermaid diagrams, and MCP configuration -- with quick reference cards that expand into full tutorials on click.

**Live:** [agentlore.neorgon.com](https://agentlore.neorgon.com/)

## Features

- **17 tutorials** across 6 categories -- Skills, Commands, Context, Diagrams, Tips, MCPs
- **Hybrid cards** -- scan titles at a glance, click to expand into full step-by-step guides
- **Tool badges** -- filter by Claude, Cursor, or both
- **Difficulty levels** -- beginner, intermediate, advanced with color-coded badges
- **Category filters** -- dropdown filtering with result count
- **Live search** -- instant keyword matching with `/` keyboard shortcut
- **Code blocks** -- fenced code with one-click copy buttons
- **MCP dimming** -- MCP tutorials are visually deprioritized (lower opacity)
- **Markdown-lite renderer** -- headings, lists, tables, bold, inline code, links

## Running locally

```bash
cd agentlore-site
make serve    # → http://localhost:8818
```

Or directly:

```bash
python3 -m http.server 8818
```

ES modules require an HTTP server -- `file://` won't work.

## Architecture

![Architecture](docs/architecture.svg)

```
agentlore-site/
├── index.html           # App shell -- header, search, filters, grid
├── path/
│   └── index.html       # Learning path page (path-app.js), URL: /path/
├── css/
│   └── style.css        # Design tokens, card styles, responsive grid
├── js/
│   ├── app.js           # Entry point (10 lines)
│   ├── path-app.js      # Learning path page logic
│   ├── state.js         # Filter state (search, category, tool, difficulty)
│   ├── render.js        # Card rendering, dropdown population
│   ├── events.js        # Search, filter, expand/collapse, copy delegation
│   ├── data.js          # 17 tutorial entries with markdown content
│   └── utils.js         # escHtml, showToast, debounce, renderMarkdown
├── docs/
│   ├── architecture.mmd # Mermaid source
│   └── architecture.svg # Generated diagram
├── Makefile             # PORT = 8818
├── CNAME                # agentlore.neorgon.com
├── robots.txt
└── sitemap.xml
```

---

<div align="center">

Part of [Neorgon](https://neorgon.com/)

</div>

<!-- Badge links -->
[badge-site]:    https://img.shields.io/badge/live_site-0063e5?style=for-the-badge&logo=googlechrome&logoColor=white
[badge-html]:    https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[badge-css]:     https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white
[badge-js]:      https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[badge-claude]:  https://img.shields.io/badge/Claude_Code-CC785C?style=for-the-badge&logo=anthropic&logoColor=white
[badge-license]: https://img.shields.io/badge/license-MIT-404040?style=for-the-badge

[url-site]:   https://agentlore.neorgon.com/
[url-html]:   #
[url-css]:    #
[url-js]:     #
[url-claude]: https://claude.ai/code
