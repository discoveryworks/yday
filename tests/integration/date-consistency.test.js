const { spawn } = require('child_process');
const path = require('path');

// Helper to run shell commands and capture output
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} failed: ${stderr}`));
      }
    });
  });
}

describe('Date Consistency Smoke Test', () => {
  const repoPath = '/Users/jpb/workspace/foam'; // Use foam since we know it has recent commits
  const ydayPath = path.join(__dirname, '../../bin/yday');
  
  test('git log, git-standup, yday, and yday -a should show consistent dates for same time period', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates for git log (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`\nTesting date consistency for ${yesterdayStr} (yesterday)`);
    console.log(`Today is: ${todayStr} (${today.toLocaleString()})`);
    
    // 1. Git log for yesterday only
    const gitLogOutput = await runCommand('git', [
      'log', 
      '--oneline', 
      '--since', `${yesterdayStr} 00:00:00`,
      '--until', `${yesterdayStr} 23:59:59`
    ], repoPath);
    
    console.log('\n1. Git log output (yesterday only):');
    console.log(gitLogOutput || '(no commits)');
    
    // 2. Git standup for yesterday only  
    const gitStandupOutput = await runCommand('git-standup', ['-d', '1', '-u', '0'], repoPath);
    
    console.log('\n2. Git standup output (-d 1 -u 0 = yesterday only):');
    console.log(gitStandupOutput || '(no commits)');
    
    // 3. Yday default (should be yesterday)
    const ydayOutput = await runCommand('node', [ydayPath, '--parent', path.dirname(repoPath)], process.cwd());
    
    console.log('\n3. Yday default output:');
    console.log(ydayOutput);
    
    // 4. Yday timeline for this week
    const ydayTimelineOutput = await runCommand('node', [ydayPath, '-a', '--parent', path.dirname(repoPath)], process.cwd());
    
    console.log('\n4. Yday timeline output:');
    console.log(ydayTimelineOutput);
    
    // Extract commit counts for comparison
    const gitLogCommits = gitLogOutput.trim().split('\n').filter(line => line.trim()).length;
    console.log(`\nCommit counts:`);
    console.log(`- Git log (yesterday): ${gitLogCommits}`);
    
    // Parse git-standup output
    const gitStandupCommits = gitStandupOutput.split('\n').filter(line => 
      line.match(/^[a-f0-9]+.*\s-\s/)
    ).length;
    console.log(`- Git standup (yesterday): ${gitStandupCommits}`);
    
    // Parse yday output for foam repo
    const ydayMatch = ydayOutput.match(/\|\s*foam\s*\|\s*(\d+)\s*\|/);
    const ydayCommits = ydayMatch ? parseInt(ydayMatch[1]) : 0;
    console.log(`- Yday (foam repo): ${ydayCommits}`);
    
    // Parse yday timeline for foam repo
    const timelineMatch = ydayTimelineOutput.match(/\|\s*([·\d]+)\s*\|\s*foam\s*\|\s*(\d+)\s*\|/);
    const timelinePattern = timelineMatch ? timelineMatch[1] : 'not found';
    const timelineCommits = timelineMatch ? parseInt(timelineMatch[2]) : 0;
    console.log(`- Yday timeline (foam): ${timelineCommits} commits, pattern: ${timelinePattern}`);
    
    // Analyze the timeline pattern to see which day commits appear on
    if (timelinePattern !== 'not found') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const pattern = timelinePattern.split('');
      console.log('\nTimeline pattern analysis:');
      pattern.forEach((char, index) => {
        if (char !== '·') {
          console.log(`  ${days[index]}: ${char} commits`);
        }
      });
    }
    
    // The actual assertion - all should show the same number of commits
    // (This might fail, which is what we want to expose the bug)
    expect(gitLogCommits).toBe(gitStandupCommits);
    expect(gitStandupCommits).toBe(ydayCommits);
    expect(ydayCommits).toBe(timelineCommits);
  }, 30000); // 30 second timeout for shell commands
});