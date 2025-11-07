# CodeFixer - CoPilot-Lite Inline AI Fix Assistant

CodeFixer is an intelligent code editor that performs real-time static analysis and provides AI-powered fix suggestions through minimal unified diff patches. Unlike traditional code formatters, CodeFixer makes surgical changes to fix specific issues without reformatting your entire codebase.

## What Makes CodeFixer Different

- **Minimal Diffs**: AI generates only the necessary changes, preserving your code style and formatting
- **Real-time Analysis**: Background AST-based static checking with immediate feedback
- **Repo-Aware Context**: Understands your project's dependencies and configuration
- **Offline Fallback**: Rule-based fixes work even without an LLM connection
- **Multiple LLM Support**: Works with OpenRouter (Claude, GPT-4) or local Ollama models

## Features

### Static Analysis Rules

CodeFixer includes 4 core diagnostic rules:

- **R1**: Unused imports and variables (quick-fixable)
- **R2**: Missing imports for referenced identifiers
- **R3**: Possible null/undefined access detection
- **R4**: Async/await misuse (missing await on promises)

### AI-Powered Fixes

- Send diagnostics to AI with full code context
- Receive minimal unified diff patches
- Preview changes before applying
- Undo/redo support for all edits

### Monaco Editor Integration

- Full TypeScript/JavaScript language support
- Real-time diagnostics displayed as markers
- Keyboard shortcuts (Ctrl/Cmd + . for quick fixes)
- Dark theme optimized for long coding sessions

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm
- Optional: Ollama for local LLM (or OpenRouter API key)

### Installation

```bash
pnpm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# LLM Provider: 'openrouter' or 'ollama'
LLM_PROVIDER=ollama

# OpenRouter (if using)
OPENROUTER_API_KEY=your_key_here

# Ollama (if using local)
OLLAMA_BASE_URL=http://localhost:11434

# API Server
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### Running Locally

```bash
pnpm dev
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

### Using Ollama (Local LLM)

1. Install Ollama from https://ollama.ai
2. Pull a code model:

```bash
ollama pull qwen2.5-coder
```

3. Set `LLM_PROVIDER=ollama` in your `.env`

### Using OpenRouter

1. Get an API key from https://openrouter.ai
2. Add to `.env`: `OPENROUTER_API_KEY=your_key_here`
3. Set `LLM_PROVIDER=openrouter`

## Docker Deployment

```bash
cd infra
docker-compose up
```

This launches the full stack including Ollama service.

## Project Structure

```
codefixer/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── common/       # Shared types and schemas (Zod)
│   ├── analyzer/     # AST-based static analysis
│   └── diff/         # Unified diff parsing and application
├── examples/
│   └── node-express-demo/  # Sample buggy code
├── infra/
│   └── docker-compose.yml
└── README.md
```

## Demo

1. Click "Load Example" to load sample code with intentional bugs
2. Watch diagnostics appear in real-time (right panel)
3. Click "Ask AI Fix" to generate a fix
4. Preview the unified diff
5. Apply the fix or cancel
6. Use "Undo" to revert changes

## Architecture

### Frontend (React + Monaco)

- **Zustand** for state management
- **Monaco Editor** with custom diagnostics provider
- **Debounced analysis** (500ms) on code changes
- **Diff preview modal** for reviewing AI suggestions

### Backend (Fastify)

- **POST /api/analyze**: Static analysis endpoint
- **POST /api/fix**: AI fix generation endpoint
- **Zod validation** for all requests/responses
- **LLM abstraction** supporting multiple providers

### Analysis Engine

- **Babel parser** for JavaScript AST traversal
- **TypeScript ESTree** for TypeScript support
- **Symbol tracking** for imports, declarations, and references
- **Heuristic checks** for common patterns (null access, missing await)

### Diff System

- **Unified diff format** for all patches
- **Validation** before applying patches
- **Undo stack** for reverting changes
- **Line-based edits** with precise positioning

## LLM Prompt Strategy

The system uses a deterministic prompt structure:

```
System: You are a precise code fixer. Output ONLY a minimal unified diff...

User:
- Language: js/ts
- File path
- Original code (fenced)
- Diagnostics with positions
- Repo context (deps, tsconfig)
- Required JSON output: { diff, rationale, risks }
```

This ensures consistent, parseable responses focused on minimal changes.

## Testing

```bash
pnpm test
```

Runs Vitest test suites for:
- Analyzer rules
- Diff parsing and application
- API endpoints (with mocked LLM)

## Keyboard Shortcuts

- **Ctrl/Cmd + .**: Trigger quick fixes at cursor
- **Ctrl/Cmd + Z**: Undo last change

## Roadmap

- [ ] Multi-file analysis and context
- [ ] Custom rule configuration
- [ ] ESLint/Prettier integration
- [ ] VS Code extension
- [ ] Git integration for commit-time checks
- [ ] Team rule sharing

## Contributing

Contributions welcome! This is an MVP focused on core functionality. See open issues for areas needing improvement.

## License

MIT - see LICENSE file

## Credits

Built with:
- Monaco Editor
- Babel & TypeScript ESTree
- Fastify
- React & Vite
- OpenAI SDK (for LLM clients)
- Ollama for local inference
