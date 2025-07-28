const chalk = require('chalk');
const GitAnalysis = require('./git-analysis');
const TimePeriods = require('./time-periods');
const Semantic = require('./semantic');
const Timeline = require('./timeline');
const Shadow = require('./shadow');

class Yday {
  constructor() {
    this.gitAnalysis = new GitAnalysis();
    this.timePeriods = new TimePeriods();
    this.semantic = new Semantic();
    this.timeline = new Timeline();
    this.shadow = new Shadow();
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
      return this.showTimeline(options, timeConfig);
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

  async showTimeline(options, timeConfig) {
    const commits = await this.gitAnalysis.getCommits(options.parent, timeConfig);
    // Default to numbers mode unless --symbols is specified
    const showNumbers = !options.symbols;
    const timeline = this.timeline.generate(commits, timeConfig, showNumbers);
    
    this.renderTimelineTable(timeline, timeConfig, options.details, showNumbers);
  }

  async showSemantic(options, timeConfig) {
    const commits = await this.gitAnalysis.getCommits(options.parent, timeConfig);
    const analysis = this.semantic.analyze(commits);
    
    this.renderSemanticTable(analysis, timeConfig);
  }

  renderSemanticTable(analysis, timeConfig) {
    const timeDesc = this.timePeriods.getDescription(timeConfig);
    
    console.log(`## Git Repository Activity in \`${analysis.parentDir}\` (${timeDesc})...\n`);
    
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

  renderTimelineTable(timeline, timeConfig, showDetails = false, showNumbers = false) {
    // Calculate the Monday of the week we're analyzing
    let referenceDate;
    
    // Use the timeConfig to determine which week to show
    if (timeConfig.startDate) {
      referenceDate = new Date(timeConfig.startDate);
    } else if (timeConfig.type && timeConfig.type.startsWith('last-')) {
      // For last-day queries, use that specific date
      referenceDate = new Date(timeConfig.startDate);
    } else {
      // Default to current week
      referenceDate = new Date();
    }
    
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
}

module.exports = new Yday();