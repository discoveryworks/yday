/**
 * Alastair Timeline Regression Tests
 * 
 * Prevents regression of the "no commits found" bug in Alastair mode
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Alastair Timeline Regression Tests', () => {
  
  test('should find commits in Alastair mode when workspace has recent commits', async () => {
    const ydayPath = path.join(__dirname, '../../bin/yday');
    
    // Test yday -a (should work if there are any recent commits in workspace)
    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', [ydayPath, '-a', '--verbose'], { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yday -a --verbose failed: ${stderr}`));
          return;
        }
        resolve({ stdout, stderr });
      });
      
      child.on('error', reject);
    });
    
    // Should show "Step 2 - Commits found: N" where N >= 0
    expect(result.stdout).toMatch(/Step 2 - Commits found: \d+/);
    
    // Should complete all 4 steps successfully
    expect(result.stdout).toMatch(/Step 1 - Timespan:/);
    expect(result.stdout).toMatch(/Step 2 - Commits found:/);
    expect(result.stdout).toMatch(/Step 3 - Timeline generated:/);
    expect(result.stdout).toMatch(/Step 4 - Validation passed/);
    
    // Should produce properly formatted timeline output
    expect(result.stdout).toMatch(/### Alastair timeline in `/);
    expect(result.stdout).toMatch(/MTWRFSs.*Repo.*Commits/);
  }, 15000);
  
  test('should use correct git-standup arguments after fix', async () => {
    const CommitAnalyzer = require('../../src/commit-analyzer');
    const TimespanAnalyzer = require('../../src/timespan');
    
    const timespanAnalyzer = new TimespanAnalyzer();
    const commitAnalyzer = new CommitAnalyzer();
    
    // Test yesterday timespan
    const timespan = timespanAnalyzer.determineTimespan({});
    const args = commitAnalyzer.buildStandupArgs(timespan);
    
    // After fix: should use -d (days back) instead of -A/-B (date range)  
    // because git-standup's -A/-B flags don't work reliably
    expect(args).toContain('-d');
    expect(args).toContain('-D');
    expect(args).toContain('iso');
    
    // Should not use the broken -A/-B flags
    expect(args).not.toContain('-A');
    expect(args).not.toContain('-B');
  });
  
  test('should handle timespan filtering correctly', async () => {
    const CommitAnalyzer = require('../../src/commit-analyzer');
    const TimespanAnalyzer = require('../../src/timespan');
    
    const timespanAnalyzer = new TimespanAnalyzer();
    const commitAnalyzer = new CommitAnalyzer();
    
    // Create a test timespan for Aug 5, 2025
    const testDate = new Date('2025-08-05');
    
    const timespan = {
      type: 'test',
      startDate: new Date(Date.UTC(2025, 7, 5, 0, 0, 0, 0)), // Aug 5, 2025
      endDate: new Date(Date.UTC(2025, 7, 5, 23, 59, 59, 999))
    };
    
    // Create mock git-standup output with mixed dates
    const mockOutput = `
/test/repo1
abc123 - Test commit from Aug 5 (2025-08-05 10:00:00 -0400) <User>
def456 - Test commit from Aug 6 (2025-08-06 14:00:00 -0400) <User>

/test/repo2  
ghi789 - Another Aug 5 commit (2025-08-05 16:00:00 -0400) <User>
`;
    
    // Analyze commits - should filter to only yesterday's commits
    const commits = commitAnalyzer.analyzeCommits(timespan, mockOutput);
    
    // Should find repos with commits
    expect(commits.length).toBeGreaterThan(0);
    
    // Each repo should only have commits from the target timespan
    for (const repo of commits) {
      expect(repo.commitCount).toBeGreaterThan(0);
      for (const commit of repo.commits) {
        expect(commitAnalyzer.isCommitInTimespan(commit, timespan)).toBe(true);
      }
    }
  });
});