# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript (outputs to `./bin/`)
- `npm install` - Install dependencies
- `npm install -g .` - Install the CLI tool globally after building

### Running the CLI Tool
- `npm run start` - Start measurement (equivalent to `cursor-efficiency start`)
- `npm run end` - End measurement and output report (equivalent to `cursor-efficiency end`)
- `cursor-efficiency start` - Begin tracking Cursor IDE usage metrics
- `cursor-efficiency end -c` - End tracking with detailed chat entries included

## Architecture Overview

This is a CLI tool that measures Cursor IDE usage efficiency by tracking:
- Token usage and chat interactions
- Git commit changes between measurement periods
- Code adoption rates from AI suggestions

### Key Components

**Command Structure:**
- `src/cli.ts` - Main CLI entry point using Commander.js
- `src/commands/start.ts` - Initializes measurement session, saves config to `.log/{project-name}/.cursor-efficiency.json`
- `src/commands/end.ts` - Processes measurement data and outputs JSON report

**Core Utilities:**
- `src/utils/chatLogs.ts` - Analyzes Cursor's SQLite workspace databases to extract chat history, token usage, and code suggestions
- `src/utils/cursorWorkspace.ts` - Locates and manages Cursor IDE workspace storage directories
- `src/utils/git.ts` - Git operations for tracking code changes and commits between measurement periods
- `src/utils/requestUsage.ts` - Calculates API usage costs

### Data Flow

1. **Start command** records git state (branch, SHA, timestamp) in config file
2. **End command** compares current git state with start state and queries Cursor's workspace SQLite databases
3. **Chat log analysis** extracts tokens, chat counts, proposed code, and adoption rates from Cursor's internal storage
4. **Output** combines git metrics with Cursor usage data into comprehensive JSON report

### Storage Locations

- Configuration files stored in `{install-dir}/.log/{project-name}/`
- Cursor workspace data read from platform-specific locations via `cursorWorkspace.ts`
- Git operations performed in current working directory

## TypeScript Configuration

- Target: ES2020, CommonJS modules
- Strict mode enabled
- Output directory: `./bin/`
- Source directory: `./src/`