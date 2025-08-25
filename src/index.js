const chalk = require('chalk');
const GitAnalysis = require('./git-analysis');
const TimePeriods = require('./time-periods');
const Semantic = require('./semantic');
const Timeline = require('./timeline');
const Shadow = require('./shadow');

// New clean architecture components
const TimespanAnalyzer = require('./timespan');
const CommitAnalyzer = require('./commit-analyzer');
const TimelineDisplay = require('./timeline-display');
const TimelineValidator = require('./timeline-validator');

class Yday {
  constructor() {
    // Legacy components (still used for semantic and shadow modes)
    this.gitAnalysis = new GitAnalysis();
    this.timePeriods = new TimePeriods();
    this.semantic = new Semantic();
    this.timeline = new Timeline();
    this.shadow = new Shadow();
    
    // New clean architecture components (used for timeline mode)
    this.timespanAnalyzer = new TimespanAnalyzer();
    this.commitAnalyzer = new CommitAnalyzer();
    this.timelineDisplay = new TimelineDisplay();
    this.timelineValidator = new TimelineValidator();
  }

  async run(options) {
    // Store verbose flag globally for other modules
    this.verbose = options.verbose;
    
    // Ensure parent directory is set and expanded
    if (!options.parent) {
      options.parent = process.env.HOME + '/workspace';
    }
    
    // Expand tilde if present
    options.parent = options.parent.replace(/^~/, process.env.HOME);
    
    // Log options if verbose
    if (this.verbose) {
      console.log(chalk.gray('Options:', JSON.stringify(options, null, 2)));
    }
    
    // Determine time period
    const timeConfig = this.timePeriods.parseOptions(options);
    
    if (this.verbose) {
      console.log(chalk.gray('Time config:', JSON.stringify(timeConfig, null, 2)));
      console.log(chalk.gray('Parent directory:', options.parent));
    }
    
    // Handle special modes first
    if (options.projects) {
      return this.showProjects(options);
    }
    
    if (options.shadow) {
      return this.showShadowWork(options, timeConfig);
    }
    
    if (options.alastair) {
      return this.showTimelineClean(options);
    }
    
    // Default: semantic analysis
    return this.showSemantic(options, timeConfig);
  }

  async showProjects(options) {
    const repos = await this.gitAnalysis.findRepositories(options.parent);
    console.log(repos.map(repo => `- ${repo.name}`).join('\n'));
  }

  async showShadowWork(options, timeConfig) {
    const analysis = await this.shadow.analyze(options.parent, timeConfig, {
      org: options.org,
      project: options.project
    });
    
    this.renderShadowTable(analysis);
  }

  async showTimelineClean(options) {
    // Step 1: Determine timespan from CLI options
    const timespan = this.timespanAnalyzer.determineTimespan(options);
    
    if (this.verbose) {
      console.log(chalk.gray('Step 1 - Timespan:', JSON.stringify(timespan, null, 2)));
    }
    
    // Step 2: Analyze git commits within timespan
    const commits = await this.commitAnalyzer.analyzeCommitsFromGit(options.parent, timespan);
    
    if (this.verbose) {
      console.log(chalk.gray('Step 2 - Commits found:', commits.length));
    }
    
    // Step 3: Generate timeline display
    // For Alastair mode, use different logic based on timespan type:
    // - Single-day queries (like yesterday): force week pattern display
    // - Multi-day queries: use normal logic
    const alastairMode = timespan.type === 'single-day' || timespan.type === 'smart-yesterday';
    const timeline = this.timelineDisplay.generateTimeline(commits, timespan, alastairMode);
    
    if (this.verbose) {
      console.log(chalk.gray('Step 3 - Timeline generated:', timeline.displayType));
    }
    
    // Step 4: Validate timeline math
    const validation = this.timelineValidator.validateTimeline(timeline);
    
    if (!validation.isValid) {
      console.error(chalk.red('Timeline validation failed:'), validation.errors.join(', '));
      if (this.verbose) {
        console.error(chalk.gray('Timeline data:', JSON.stringify(timeline, null, 2)));
      }
      process.exit(1);
    }
    
    if (this.verbose) {
      console.log(chalk.gray('Step 4 - Validation passed'));
    }
    
    // Render the timeline
    this.renderTimelineTableClean(timeline, timespan, options.parent, options.details, !options.symbols);
  }

  async showSemantic(options, timeConfig) {
    const commits = await this.gitAnalysis.getCommits(options.parent, timeConfig);
    const analysis = this.semantic.analyze(commits);
    
    this.renderSemanticTable(analysis, timeConfig);
  }

  renderSemanticTable(analysis, timeConfig) {
    const timeDesc = this.timePeriods.getDescription(timeConfig);
    const displayDir = analysis.parentDir.replace(process.env.HOME, '~');
    
    console.log(`### Git Repository Activity in \`${displayDir}\` (${timeDesc})...\n`);
    
    if (analysis.repos.length === 0) {
      console.log('| Repo | Commits | Summary |');
      console.log('|------|---------|---------|');
      console.log(`| -    | -       | No commits found for ${timeDesc} |`);
      return;
    }
    
    // Calculate column widths
    const maxRepoWidth = Math.max(4, ...analysis.repos.map(r => r.name.length));
    const maxCommitsWidth = Math.max(7, ...analysis.repos.map(r => r.commits.toString().length));
    const maxSummaryWidth = Math.max(7, ...analysis.repos.map(r => r.summary.length));
    
    // Print header
    const repoHeader = 'Repo'.padEnd(maxRepoWidth);
    const commitsHeader = 'Commits'.padEnd(maxCommitsWidth);
    const summaryHeader = 'Summary'.padEnd(maxSummaryWidth);
    
    console.log(`| ${repoHeader} | ${commitsHeader} | ${summaryHeader} |`);
    console.log(`|${'-'.repeat(maxRepoWidth + 2)}|${'-'.repeat(maxCommitsWidth + 2)}|${'-'.repeat(maxSummaryWidth + 2)}|`);
    
    // Print rows
    for (const repo of analysis.repos) {
      const name = repo.name.padEnd(maxRepoWidth);
      const commits = repo.commits.toString().padEnd(maxCommitsWidth);
      const summary = repo.summary.padEnd(maxSummaryWidth);
      
      console.log(`| ${name} | ${commits} | ${summary} |`);
    }
  }

  renderTimelineTableClean(timeline, timespan, parentDir, showDetails = false, showNumbers = true) {
    // Create a consistent header format like the semantic output
    const displayDir = parentDir.replace(process.env.HOME, '~');
    console.log(`### Alastair timeline in \`${displayDir}\` for ${timeline.title} (${timespan.description})\n`);
    
    if (timeline.displayType === 'single-day') {
      // Simple list view for single-day queries
      if (timeline.items.length === 0) {
        console.log('| Repo | Commits |');
        console.log('|------|---------|');
        console.log('| -    | No commits found |');
        return;
      }
      
      const maxRepoWidth = Math.max(4, ...timeline.items.map(item => item.repo.length));
      const maxCommitsWidth = Math.max(7, ...timeline.items.map(item => item.commits.toString().length));
      
      const repoHeader = 'Repo'.padEnd(maxRepoWidth);
      const commitsHeader = 'Commits'.padEnd(maxCommitsWidth);
      
      console.log(`| ${repoHeader} | ${commitsHeader} |`);
      console.log(`|${'-'.repeat(maxRepoWidth + 2)}|${'-'.repeat(maxCommitsWidth + 2)}|`);
      
      for (const item of timeline.items) {
        const repo = item.repo.padEnd(maxRepoWidth);
        const commits = item.commits.toString().padEnd(maxCommitsWidth);
        console.log(`| ${repo} | ${commits} |`);
      }
    } else {
      // Week pattern view for multi-day queries or forced Alastair mode
      if (timeline.items.length === 0) {
        console.log('| MTWRFSs | Repo | Commits |');
        console.log('|---------|------|---------|');
        console.log('| ······· | -    | No commits found |');
        return;
      }
      
      const maxRepoWidth = Math.max(4, ...timeline.items.map(item => item.repo.length));
      const maxCommitsWidth = Math.max(7, ...timeline.items.map(item => item.commits.toString().length));
      
      const patternHeader = 'MTWRFSs'.padEnd(7);
      const repoHeader = 'Repo'.padEnd(maxRepoWidth);
      const commitsHeader = 'Commits'.padEnd(maxCommitsWidth);
      
      console.log(`| ${patternHeader} | ${repoHeader} | ${commitsHeader} |`);
      console.log(`|${'-'.repeat(9)}|${'-'.repeat(maxRepoWidth + 2)}|${'-'.repeat(maxCommitsWidth + 2)}|`);
      
      for (const item of timeline.items) {
        const pattern = item.pattern.padEnd(7);
        const repo = item.repo.padEnd(maxRepoWidth);
        const commits = item.commits.toString().padEnd(maxCommitsWidth);
        
        console.log(`| ${pattern} | ${repo} | ${commits} |`);
      }
      
      // Add legend only if details flag is set
      if (showDetails) {
        console.log('\nLegend:');
        if (showNumbers) {
          console.log('  0-9 = Number of commits that day');
          console.log('  + = 10 or more commits');
          console.log('  · = No activity');
        } else {
          console.log('  x = High activity day (3+ commits)');
          console.log('  / = Some activity day (1-2 commits)');
          console.log('  · = No activity');
        }
        console.log('  M T W R F S s = Mon Tue Wed Thu Fri Sat Sun');
      }
    }
  }

  renderTimelineTable(timeline, timeConfig, showDetails = false, showNumbers = false) {
    // Calculate the Monday of the week we're analyzing
    let referenceDate;
    
    // For Alastair timeline, always use current week to match timeline generation
    // This ensures header and timeline show the same week
    referenceDate = new Date();
    
    const dayOfWeek = referenceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday being 0
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() - daysFromMonday);
    
    const mondayFormatted = monday.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    console.log(`Alastair timeline for the week beginning ${mondayFormatted}\n`);
    
    // Calculate column widths for proper alignment
    const maxProjectWidth = Math.max(7, ...timeline.items.map(item => item.project.length)); // Min 7 for "Project"
    const maxCommitsWidth = Math.max(7, ...timeline.items.map(item => item.commits.toString().length)); // Min 7 for "Commits"
    
    // Print header with proper padding
    const patternHeader = 'MTWRFSs'.padEnd(7);
    const projectHeader = 'Project'.padEnd(maxProjectWidth);
    const commitsHeader = 'Commits'.padEnd(maxCommitsWidth);
    
    console.log(`| ${patternHeader} | ${projectHeader} | ${commitsHeader} |`);
    console.log(`|${'-'.repeat(9)}|${'-'.repeat(maxProjectWidth + 2)}|${'-'.repeat(maxCommitsWidth + 2)}|`);
    
    for (const item of timeline.items) {
      const pattern = item.pattern.padEnd(7);
      const project = item.project.padEnd(maxProjectWidth);
      const commits = item.commits.toString().padEnd(maxCommitsWidth);
      
      console.log(`| ${pattern} | ${project} | ${commits} |`);
    }
    
    // Add legend only if details flag is set
    if (showDetails) {
      console.log('\nLegend:');
      if (showNumbers) {
        console.log('  0-9 = Number of commits that day');
        console.log('  + = 10 or more commits');
        console.log('  · = No activity');
      } else {
        console.log('  x = High activity day (3+ commits)');
        console.log('  / = Some activity day (1-2 commits)');
        console.log('  · = No activity');
      }
      console.log('  M T W R F S s = Mon Tue Wed Thu Fri Sat Sun');
    }
    
    // Show exceptions for repos using commit dates instead of author dates
    if (timeline.exceptions && timeline.exceptions.length > 0) {
      console.log('\n⚠️  ***** THESE RESULTS USED COMMIT DATE RATHER THAN AUTHOR DATE *****');
      console.log('The following repos had no activity in the target week based on author dates,');
      console.log('but showed activity when using commit dates (likely due to rebasing):');
      timeline.exceptions.forEach(repo => {
        console.log(`  - ${repo}`);
      });
      console.log('Use single-day queries (--last-tuesday) for precise author date results.');
    }
  }

  renderShadowTable(analysis) {
    console.log('| Project     | Commits | Remote Repository                                 |');
    console.log('|-------------|---------|---------------------------------------------------|');
    
    for (const item of analysis.untracked) {
      const project = item.project.padEnd(11);
      const commits = item.commits.toString();
      const remote = item.remote || 'none';
      
      console.log(`| ${project} | ${commits}       | ${remote.padEnd(49)} |`);
    }
  }

  // Convert single-day queries to week queries for timeline view
  getTimelineTimeConfig(timeConfig) {
    // If this is a single-day query (startDate === endDate), expand to show the full week
    if (timeConfig && timeConfig.type && timeConfig.type.startsWith('last-') && 
        timeConfig.startDate && timeConfig.endDate && 
        timeConfig.startDate.getTime() === timeConfig.endDate.getTime()) {
      
      // Calculate the Monday of the week containing the target date
      const targetDate = new Date(timeConfig.startDate);
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday being 0
      
      const monday = new Date(targetDate);
      monday.setDate(targetDate.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      // Calculate days back from today to Monday
      const today = new Date();
      const daysDiff = Math.ceil((today - monday) / (24 * 60 * 60 * 1000));
      
      return {
        type: 'timeline-week',
        startDate: monday,
        endDate: sunday,
        days: daysDiff,
        originalType: timeConfig.type,
        originalDate: timeConfig.startDate
      };
    }
    
    // For non-single-day queries, return as-is
    return timeConfig;
  }
}

module.exports = new Yday();