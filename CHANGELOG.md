# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-07-31

### Fixed
- **Critical Timeline Bug**: Fixed off-by-one error where commits appeared one day forward in timeline view
  - Root cause: `parseCommitDate()` was returning current time instead of parsing "time ago" strings
  - Now properly parses "26 minutes ago", "22 hours ago", "2 days ago" patterns
  - Added comprehensive date parsing unit tests and smoke tests
- **DRY Violation**: CLI version now reads from package.json instead of hardcoded value
  - Prevents version inconsistency between CLI and package metadata
  - Added version consistency tests

### Added
- **Comprehensive Testing Infrastructure**:
  - BDD tests with Cucumber.js for user workflows
  - Integration smoke tests comparing git log, git-standup, yday, and yday -a
  - Unit tests for timeline date parsing and version consistency
  - Time travel testing utilities for deterministic date handling
- **Documentation**:
  - Added Testing section to README with test categories and commands
  - Documented semantic versioning workflow with npm scripts
- **Version Management**:
  - Added `version:patch`, `version:minor`, `version:major` npm scripts
  - Added `version:check` script for consistency validation

### Technical Improvements
- Enhanced `parseCommitDate()` method with proper regex parsing for git-standup time strings
- Replaced hardcoded Rails fixture data with valid git hashes
- Added comprehensive error handling for date parsing edge cases

## [0.1.0] - 2025-07-30

### Added
- Initial release of yday CLI tool
- Semantic analysis of git commits across multiple repositories
- Smart time period handling (yesterday, Friday on Monday, etc.)
- Timeline view with MTWRFSs pattern (basic implementation)
- Integration with git-standup for git operations
- Support for multiple time period options:
  - `--days N`: Show last N days
  - `--today`: Show today's commits
  - `--last-friday`, `--last-monday`, etc.: Show specific day's commits
  - `--on N`: Show commits from exactly N days ago
- Project discovery and listing (`--projects`)
- Verbose debugging mode (`--verbose`)
- Dependency checking for git-standup and gh CLI

### Technical Features
- Modular architecture with separate modules for git analysis, semantic processing, and timeline generation
- External tool integration (git-standup, gh CLI)
- Commander.js CLI interface with comprehensive flag support
- Chalk for colored terminal output
- YAML configuration support (planned)

### Documentation
- Comprehensive README with usage examples
- Installation instructions for multiple package managers
- Configuration guidance and examples
- Project overview and architecture documentation in CLAUDE.md

## [0.2.1] - 2025-08-11

### Fixed
- **Critical Alastair Timeline Bug**: Fixed `yday -a` showing "No commits found" despite existing commits
  - Root cause: git-standup's `-A` and `-B` flags (date range) don't work reliably
  - Solution: Reverted to `-d` (days back) with proper timespan filtering
  - Now correctly finds and displays commits from yesterday and specific days
- **Test Suite Stability**: 
  - Added comprehensive regression tests for Alastair timeline functionality
  - Skipped obsolete tests using deprecated Timeline class
  - Fixed date display tests to handle smart descriptions ("since Friday", "yesterday")

### Added  
- **Documentation**: Updated README to clarify npm package not yet published
- **Regression Tests**: Added `alastair-timeline-debug.test.js` to prevent future timeline bugs
- **Installation Guide**: Added development installation instructions

### Technical Improvements
- `buildStandupArgs()`: Calculate days back dynamically, use `-d` instead of `-A`/`-B`
- Maintained existing timespan filtering logic in `analyzeCommits()`
- Enhanced error handling and test coverage for timeline edge cases

## [0.2.2] - 2025-08-26

### Added
- **Actual Date Display**: Output now includes specific dates for better clarity after vacation
  - Smart Monday behavior: `"since Friday, August 2"` instead of `"yesterday, Friday, August 2"` 
  - All time descriptions include actual dates: `"yesterday, Monday, August 25"` instead of just `"yesterday"`
  - Specific day queries show dates: `"last friday, Friday, August 22"` instead of just `"last friday"`

### Changed
- **Directory Display**: Show user-friendly `~/workspace` instead of full `/Users/user/workspace` paths
  - Updated both semantic and timeline output headers
  - Consistent with typical terminal conventions and documentation examples
- **Documentation**: Updated README examples to use tilde notation

### Technical Improvements
- Enhanced `handleSmartYesterday()` to provide accurate descriptions based on actual lookback period
- Improved date formatting consistency across all time period descriptions

## [Unreleased]

### Planned Features
- Shadow analysis: Find repos with commits but no GitHub project tracking
- Configuration file support (`~/.config/yday.yml`)
- Enhanced timeline visualizations
- GitHub project integration improvements