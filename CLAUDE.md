# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`yday` is a Node.js CLI tool for git retrospective analysis that provides smart views of recent development work across multiple repositories. The tool helps developers answer "What have I been working on?" with semantic commit analysis and multiple time period views.

## Development Commands

### Running the Application
```bash
# Run directly from source
node bin/yday

# Or if installed globally
yday

# Common usage patterns
node bin/yday --verbose          # Debug mode
node bin/yday --days 3          # Last 3 days
node bin/yday --projects        # List all git repos
node bin/yday --today           # Today's work
node bin/yday --last-friday     # Last Friday's commits
```

### Testing
```bash
# No formal test suite yet - testing done manually
npm test  # Currently returns error - no tests configured
```

### Dependencies
The project requires these external tools:
- `git-standup` (required): `npm install -g git-standup`
- `gh` CLI (optional, for --shadow mode): `brew install gh`

## Architecture

### Core Components

**Entry Point (`bin/yday`):**
- Commander.js CLI interface with comprehensive flag support
- Dependency checking for git-standup and gh
- Error handling and verbose logging

**Main Application (`src/index.js`):**
- Central routing logic for different modes (semantic, timeline, shadow, projects)
- Table rendering for output formatting
- Coordinates between all modules

**Time Period Analysis (`src/time-periods.js`):**
- Smart time period calculation (e.g., Monday shows Friday's work)
- Supports multiple time formats: --days, --today, --last-friday, --on
- Converts time periods to git-standup compatible arguments

**Git Analysis (`src/git-analysis.js`):**
- Repository discovery in parent directories
- git-standup integration and output parsing
- Commit extraction and filtering

**Semantic Analysis (`src/semantic.js`):**
- Commit message analysis and summarization
- Feature extraction from commit patterns
- Generates human-readable work summaries

**Timeline View (`src/timeline.js`):**
- Placeholder for Alastair-style timeline (MTWRFSs pattern)
- Not yet implemented

**Shadow Analysis (`src/shadow.js`):**
- Placeholder for untracked work analysis
- Not yet implemented

### Key Design Patterns

1. **Modular Architecture:** Each major feature is isolated in its own module
2. **Time Period Abstraction:** Complex time logic centralized in time-periods.js
3. **External Tool Integration:** Uses git-standup for git operations instead of direct git commands
4. **Semantic Analysis:** Extracts meaning from commit messages rather than just listing them

## Implementation Status

### ✅ Working Features
- Semantic analysis of commits across multiple repos
- Smart time period handling (yesterday, Friday on Monday, etc.)
- Full git-standup integration with -d, -u, -A, -B flags
- `--on` flag for specific day analysis
- Verbose debugging mode
- Dependency checking

### ❌ Not Yet Implemented
- `--alastair` timeline view (MTWRFSs pattern)
- `--shadow` mode (GitHub project tracking gaps)
- Configuration file support (~/.config/yday.yml)
- Formal test suite

## Common Development Patterns

### Adding New Time Period Options
1. Add option to bin/yday commander configuration
2. Add parsing logic in time-periods.js parseOptions()
3. Add description formatting in getDescription()
4. Test with various git-standup scenarios

### Extending Semantic Analysis
The semantic analyzer in src/semantic.js can be extended by:
- Adding new commit type patterns in extractCommitTypes()
- Expanding feature detection in extractKeyFeatures()
- Updating action mapping in determinePrimaryAction()

### Output Formatting
All table output is handled in src/index.js render*Table() methods. The tool uses consistent markdown-style table formatting.

## Configuration

### Default Behavior
- Parent directory: `~/workspace` (configurable via --parent)
- Default time period: "smart yesterday" (Friday on Monday, yesterday otherwise)
- Output format: Markdown tables to stdout

### Environment Variables
- `HOME`: Used for default workspace path expansion

## Dependencies

### Runtime Dependencies
- `commander`: CLI argument parsing
- `chalk`: Terminal color output
- `yaml`: Configuration file parsing (planned)

### External Tools
- `git-standup`: Core git commit analysis
- `gh`: GitHub CLI for shadow mode (optional)

## Development Notes

- The tool follows YAGNI principles - features are implemented when needed
- Error handling includes helpful dependency installation messages
- Verbose mode provides detailed debugging information
- All git operations are delegated to git-standup for consistency
- The semantic analyzer prioritizes useful summaries over raw commit lists