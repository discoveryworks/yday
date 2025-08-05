# yday

📜 Why use yday?
=============================

1. Still working your way through that first cup of coffee, and can't remember where you left off yesterday? (It's even worse on a Monday, trying to remember where Friday took you.)
2. Backlogs are both _Planning_ and _Tracking_ tools. When work isn't explicitly planned, we can DRY up the tracking by using the commit itself to fill in a lot of the blanks.

`yday` provides a semantic analysis of your recent git activity across all repositories, with smart time windows and multiple views to answer the question: **"What have I been working on?"**


📜📜 Who benefits from this?
=============================

Anyone who works in multiple repos and juggles multiple projects.

📜📜📜 What does it do?
=============================

`yday` analyzes git commits across your workspace and provides semantic summaries of recent development work. It:

1. gathers commits across multiple repos (e.g. everything in a `~/workspace` folder)
2. summarizes meaningful chunks of work across commits
3. retroactively adds unplanned work to your backlog based on commits without tickets ("shadow work")
4. offers multiple contextual views of your work (e.g. Alaistair timeline, Monday morning shows Friday's work (not Sunday's nothing)


📜📜📜📜 How do I use it?
=============================

## Installation

### npm (Recommended)
```shell
npm install -g yday
```

### Manual Installation
```shell
# Clone the repository
git clone https://github.com/discoveryworks/yday.git
cd yday

# Install dependencies
npm install

# Link globally for development
npm link

# Or run directly
node bin/yday --help
```

### Other Package Managers
- **Homebrew**: Not yet available (planned for future release)
- **curl installer**: Not yet available (planned for future release)


## Basic Usage

```shell
yday [-a, --alastair]
     [-d, --day <since-days-ago>]
     [--last-workday]
     [--last-monday]
     [--last-tuesday]
     [--last-wednesday]
     [--last-thursday]
     [--last-friday]
     [--last-saturday]
     [--last-sunday]
     [--projects]
     [--shadow]
     [-t, --today]
     [-v, --verbose]
```

### Show yesterday's work (or Friday's on Monday)
```shell
yday
```

might return

    ## Git Repository Activity in /Users/developer/workspace (yesterday, Friday July 05)...

    | Repo                | Commits | Summary                           |
    |---------------------|---------|-----------------------------------|
    | my-app              | 3       | Building authentication system    |
    | my-app-ios          | 2       | Integrate authentication system   |
    | api-service         | 1       | Fixing database connection issue  |
    | docs-site           | 2       | Updating deployment guide         |

### Show the last 3 days
```shell
yday --days 3
```

### Show an Alastair table
```shell
yday --alastair
```

    | MTWRFSs | Project     | Commits |
    | ------- | ----------- |---------|
    | ··3···· | my-app      | 3       |
    | ··2···· | my-app-ios  | 2       |
    | ···1··· | api-service | 1       |
    | ·1·2··· | docs-site   | 2       |

```shell
# Use symbols instead of numbers
yday --alastair --symbols
```

    | MTWRFSs | Project     | Commits |
    | ------- | ----------- |---------|
    | ··x···· | my-app      | 3       |
    | ··/···· | my-app-ios  | 2       |
    | ···/··· | api-service | 1       |
    | ·/·/··· | docs-site   | 2       |


### Find untracked work (NOT YET IMPLEMENTED)
```shell
yday --shadow  # Coming in future release
```

*Planned output:*
    | Project     | Commits | Remote Repository                                 |
    |-------------|---------|---------------------------------------------------|
    | my-app      | 3       | https://github.com/discoveryworks/my-app.git      |
    | my-app-ios  | 2       | https://github.com/discoveryworks/my-app-ios.git  |
    | api-service | 1       | https://github.com/discoveryworks/api-service.git |
    | docs-site   | 2       | none                                              |



### List of projects
```shell
yday --projects
```

    - my-app
    - my-app-ios
    - api-service
    - docs-site

### Debug with verbose output
```shell
yday --verbose -d 3
```

Shows debug information including:
- Dependency paths
- Configuration options
- Time period calculations
- Git-standup command execution


## Configuration

By default, `yday` scans `~/workspace` for git repositories. Set a different path:

```bash
yday --parent ~/code
```

For `--shadow` mode, configure your GitHub organization and project:

```bash
yday --shadow --org mycompany --project 2
```


📜📜📜📜📜 Extras
=============================

## Development & Testing

```bash
# Unit tests (Jest)
npm test

# BDD/Integration tests (Cucumber)
npm run test:bdd

# All tests
npm run test:all

# Specific test files
npm test -- tests/unit/timeline-date-parsing.test.js
npm run test:bdd -- features/user_workflows.feature
```

## Release Process

### npm Publishing
```bash
# Ensure all tests pass
npm run test:all

# Version bump (creates git tag automatically)
npm run version:patch  # or version:minor, version:major

# Publish to npm registry
npm publish

# Push git changes and tags
git push && git push --tags
```

### Future Release Targets

**Homebrew Formula** (planned):
- Create homebrew formula in homebrew-core
- Formula will download tarball from GitHub releases
- Requires: stable release, testing on multiple macOS versions

**curl Installer** (planned):
- Shell script for direct installation
- Downloads latest release from GitHub
- Handles dependency checking (git-standup)

**GitHub Releases** (planned):
- Automated release creation from git tags
- Include pre-built binaries for different platforms
- Release notes generated from CHANGELOG.md

## Configuration

**Current**: Configuration via command-line flags only:
```bash
yday --parent ~/code        # Custom workspace directory
yday --org mycompany        # GitHub organization (for future --shadow mode)
yday --project 2            # GitHub project number (for future --shadow mode)
```

**Planned**: Configuration file support at `~/.config/yday.yml` (not yet implemented)

## Why "yday"?

Short for "yesterday" - the tool started as a quick way to check recent work. The name feels right even for `yday --today` because it's fundamentally about **retrospective analysis** of development work.

## Related Tools

- `git-standup`: Underlying git analysis engine
- `gh`: GitHub CLI for project integration
- `foam`: Knowledge management framework this tool supports
