const GitAnalysis = require('../src/git-analysis');
const TimePeriods = require('../src/time-periods');
const Timeline = require('../src/timeline');
const Semantic = require('../src/semantic');

async function debugLiveData() {
  const gitAnalysis = new GitAnalysis();
  const timePeriods = new TimePeriods();
  const timeline = new Timeline();
  const semantic = new Semantic();

  console.log('🔍 DEBUGGING LIVE DATA FOR --last-tuesday\n');

  // Get Tuesday timeConfig
  const timeConfig = timePeriods.getLastDay('tuesday');
  console.log('Time config:', JSON.stringify(timeConfig, null, 2));

  // Get semantic data (single day)
  console.log('\n--- SEMANTIC ANALYSIS (Tuesday only) ---');
  const semanticCommits = await gitAnalysis.getCommits('/Users/jpb/workspace', timeConfig);
  const semanticAnalysis = semantic.analyze(semanticCommits);
  
  console.log(`Found ${semanticAnalysis.repos.length} repos in semantic analysis:`);
  semanticAnalysis.repos.forEach(repo => {
    console.log(`  - ${repo.name}: ${repo.commits} commits`);
    repo.commits.forEach(commit => {
      console.log(`    * ${commit.message} (${commit.timeAgo})`);
    });
  });

  // Get timeline data (full week)
  console.log('\n--- TIMELINE ANALYSIS (Full week) ---');
  
  // Create a week-based timeConfig manually for debugging
  const targetDate = new Date(timeConfig.startDate);
  const dayOfWeek = targetDate.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  const daysDiff = Math.ceil((today - monday) / (24 * 60 * 60 * 1000));
  
  const weekTimeConfig = {
    type: 'timeline-week',
    startDate: monday,
    endDate: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000),
    days: daysDiff
  };

  const timelineCommits = await gitAnalysis.getCommits('/Users/jpb/workspace', weekTimeConfig);
  const timelineAnalysis = timeline.generate(timelineCommits, timeConfig, true);
  
  console.log(`Found ${timelineAnalysis.items.length} repos in timeline analysis:`);
  
  // Check for the missing repos
  const missingRepos = ['gday-cli', 'foam'];
  
  missingRepos.forEach(repoName => {
    console.log(`\n📊 ANALYSIS FOR ${repoName.toUpperCase()}:`);
    
    // Check if repo exists in semantic
    const semanticRepo = semanticAnalysis.repos.find(r => r.name === repoName);
    console.log(`  Semantic: ${semanticRepo ? `${semanticRepo.commits} commits` : 'NOT FOUND'}`);
    
    // Check if repo exists in timeline  
    const timelineRepo = timelineAnalysis.items.find(r => r.project === repoName);
    if (timelineRepo) {
      console.log(`  Timeline: ${timelineRepo.pattern} (${timelineRepo.commits} total)`);
      console.log(`  Tuesday (pos 1): ${timelineRepo.pattern[1]}`);
    } else {
      console.log(`  Timeline: NOT FOUND`);
    }
    
    // Check raw commit data
    const rawRepo = timelineCommits.repos.find(r => r.name === repoName);
    if (rawRepo) {
      console.log(`  Raw commits (${rawRepo.commits.length}):`);
      rawRepo.commits.forEach(commit => {
        const commitDate = new Date(commit.date);
        const dayOfWeek = commitDate.toLocaleDateString('en-US', { weekday: 'long' });
        console.log(`    * ${commit.message} (${commit.timeAgo}) -> ${dayOfWeek}`);
      });
    } else {
      console.log(`  Raw commits: NOT FOUND`);
    }
  });
}

debugLiveData().catch(console.error);