# yday

📜 Why use yday?
=============================

1. Still working your way through that first ☕️, and can't remember where you left off yesterday? (It's even worse on a Monday, trying to remember where Friday took you.)
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
3. offers multiple contextual views of your work (e.g. Alaistair timeline, Monday morning shows Friday's work (not Sunday's nothing)
4. TK retroactively adds unplanned work to your backlog based on commits without tickets ("shadow work")


📜📜📜📜 How do I use it?
=============================

## Installation

### npm
```shell
npm install -g yday
```

### Manual Installation
```shell
git clone https://github.com/discoveryworks/yday.git && cd yday
npm install # Install dependencies
node bin/yday --help
```

## Basic Usage

### Show commits from the last work day

Running `yday` on a Monday might return

    ## Git Repository Activity in /Users/developer/workspace (yesterday, Friday July 05)...

    | Repo                | Commits | Summary                           |
    |---------------------|---------|-----------------------------------|
    | my-app              | 4       | Building authentication system    |
    | my-app-ios          | 2       | Integrate authentication system   |
    | api-service         | 1       | Fixing database connection issue  |
    | docs-site           | 3       | Updating deployment guide         |


### Show an Alastair table
See https://alastairjohnston.com/projects-the-alastair-method/ for more on the Alastair Method.
```shell
yday --alastair

| MTWRFSs | Project     | Commits |
| ------- | ----------- |---------|
| ··3·1·· | my-app      | 4       |
| ··2···· | my-app-ios  | 2       |
| ···1··· | api-service | 1       |
| ·1·2··· | docs-site   | 3       |
```


### Use symbols instead of numbers
```shell
yday -a --symbols

| MTWRFSs | Project     | Commits |
| ------- | ----------- |---------|
| ··/·x·· | my-app      | 4       |
| ··/···· | my-app-ios  | 2       |
| ···/··· | api-service | 1       |
| ·/·/··· | docs-site   | 3       |
```



## Configuration

By default, `yday` scans `~/workspace` for git repositories. Set a different path:

```bash
yday --parent ~/code
```


📜📜📜📜📜 Extras
=============================

## Testing

Data gets pretty hinky here; be careful to protect features with unit tests.

```bash
npm test         # Unit tests (Jest)
npm run test:bdd # BDD/Integration tests (Cucumber)
npm run test:all # All tests

# Individual tests
npm test -- tests/unit/timeline-date-parsing.test.js
npm run test:bdd -- features/user_workflows.feature
```

## Release Process

### npm Publishing
```bash
npm run test:all            # Ensure all tests pass
npm run version:patch       # or version:minor, version:major, following Semantic Versioning
npm publish                 # Publish to npm registry
git push && git push --tags # Push git changes and tags
```

## Why "yday"?

Short for "yesterday" - the tool started as a quick way to check recent work. The name feels right even for `yday --today` because it's fundamentally about **retrospective analysis** of development work.
