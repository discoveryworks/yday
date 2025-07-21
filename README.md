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

- finds commits across multiple repos (e.g. everything in a `~/workspace` folder)
- groups commits into meaningful chunks of work (and creates terse, semantic descriptions)
- helps find commits representing unplanned work, and retroactively adding that to your backlog

**Multiple Views:**
- `--alastair`: Visual timeline view of commits across time
- `--shadow`: Identifies repos with commits but no project tracking
- `--today`, `--days N`: Flexible time periods

**Smart Behavior:**
- Monday morning shows Friday's work (not Sunday's nothing)
- Filters out merge commits and noise
- Focuses on semantic meaning of changes
- Works across standard git repos and worktrees


📜📜📜📜 How do I use it?
=============================

## Installation

You can install `yday` using one of the options listed below

| Source | Command                                                                                        |
|--------|------------------------------------------------------------------------------------------------|
| curl   | `curl -L https://raw.githubusercontent.com/discoveryworks/yday/master/installer.sh \| sudo sh` |
| npm    | `npm install -g yday`                                                                          |
| brew   | `brew update && brew install yday`                                                             |
| manual | Clone and run `make install`                                                                   |


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

    ## Git Repository Activity in /Users/jpb/workspace (yesterday, Friday July 05)...

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
    | //····· | my-app      | 3       |
    | //x···· | my-app-ios  | 2       |
    | /·o·/x· | api-service | 1       |
    | ·/·/x·· | docs-site   | 2       |


### Find untracked work
```shell
yday --shadow
```

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

## Configuration

Set parent folders, GH tokens, and more in `~/.config/yday.yml`

## Why "yday"?

Short for "yesterday" - the tool started as a quick way to check recent work. The name feels right even for `yday --today` because it's fundamentally about **retrospective analysis** of development work.

## Related Tools

- `git-standup`: Underlying git analysis engine
- `gh`: GitHub CLI for project integration
- `foam`: Knowledge management framework this tool supports
