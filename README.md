<div align="center">

# Agent Lore

**Browse AI agent tutorials for Claude Code, Cursor, and local AI**

[![Live][badge-site]][url-site]
[![HTML5][badge-html]][url-html]
[![CSS3][badge-css]][url-css]
[![JavaScript][badge-js]][url-js]
[![Claude Code][badge-claude]][url-claude]
[![License][badge-license]](LICENSE)

</div>

---

## Overview

**Agent Lore** is a fast, searchable field guide for developers who want to stop treating AI as a chatbot and start using it as a reliable coding partner. It focuses on the most capable agentic coding tools — **Claude Code**, **Cursor**, and **local AI stacks** — and turns their sprawling feature sets into short, copy-paste-ready tutorials you can actually use at your desk.

The site is built for working developers, indie builders, and technical leads who already write code but want to move faster with AI. Every tutorial is a card first and a deep guide second: scan for the topic, click to expand, copy the commands, and go. The value proposition is **practical fluency** — not marketing fluff, just the exact flags, files, prompts, and workflows that make AI agents produce better output with fewer tokens and fewer surprises.

**Live:** [agentlore.neorgon.com](https://agentlore.neorgon.com/)

## Features

- **40+ tutorials** across 8 categories -- Setup, Skills, Commands, Context, Diagrams, Tips, MCPs, and Local AI
- **Hybrid cards** -- scan titles at a glance, click to expand into full step-by-step guides
- **Tool badges** -- filter by Claude, Cursor, or local AI tools
- **Difficulty levels** -- beginner, intermediate, advanced with color-coded badges
- **Category filters** -- dropdown filtering with result count
- **Live search** -- instant keyword matching with `/` keyboard shortcut
- **Code blocks** -- fenced code with one-click copy buttons
- **Learning paths** -- guided Core Agent Skills and Local AI tracks with progress tracking
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
│   ├── data.js          # 40+ tutorial entries with markdown content
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
