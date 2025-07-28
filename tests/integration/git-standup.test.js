const { spawn } = require('child_process');
const path = require('path');

// Test git-standup directly to validate our understanding and fixtures
describe('Git-standup Integration', () => {
  const testWorkspace = '/Users/developer/workspace';

  function runGitStandup(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('git-standup', args, {
        cwd: testWorkspace,
        stdio: ['pipe', 'pipe', 'pipe']
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
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`git-standup failed: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  function parseRepoCommits(standupOutput) {
    const repos = new Map();
    const lines = standupOutput.split('\n');
    let currentRepo = '';

    for (const line of lines) {
      // Check if this is a repository header
      if (line.match(/^\/.*\/([^/]+)$/)) {
        currentRepo = path.basename(line);
        if (!repos.has(currentRepo)) {
          repos.set(currentRepo, []);
        }
        continue;
      }

      // Check if this is a commit line
      if (line.match(/^[a-f0-9]+.*\s-\s/) && currentRepo) {
        const commitData = repos.get(currentRepo) || [];
        commitData.push(line);
        repos.set(currentRepo, commitData);
      }
    }

    return repos;
  }

  describe('When querying for commits', () => {
    test('git-standup should be available', async () => {
      const output = await runGitStandup(['-h']);
      expect(output).toContain('Usage:');
    });

    test('different date ranges should return consistent repo sets', async () => {
      // Test our core assumption: broader date ranges should include narrower ones
      const output6Days = await runGitStandup(['-D', 'local', '-d', '6']);
      const output8Days = await runGitStandup(['-D', 'local', '-d', '8']);

      const repos6 = parseRepoCommits(output6Days);
      const repos8 = parseRepoCommits(output8Days);

      // Every repo in the 6-day result should also be in the 8-day result
      for (const [repoName, commits] of repos6) {
        expect(repos8.has(repoName))
          .toBe(true, `Repo ${repoName} found in -d 6 but missing from -d 8`);
        
        // The 8-day result should have at least as many commits
        expect(repos8.get(repoName).length)
          .toBeGreaterThanOrEqual(commits.length);
      }
    }, 15000);

    test('local date format should be parseable', async () => {
      const output = await runGitStandup(['-D', 'local', '-d', '7']);
      const repos = parseRepoCommits(output);

      // Find a repo with commits and test date parsing
      for (const [repoName, commits] of repos) {
        if (commits.length > 0) {
          const firstCommit = commits[0];
          
          // Extract date from commit line
          const dateMatch = firstCommit.match(/\(([^)]+)\)/);
          expect(dateMatch).toBeTruthy();
          
          const dateString = dateMatch[1];
          const parsedDate = new Date(dateString);
          
          expect(parsedDate.getTime()).not.toBeNaN();
          expect(parsedDate.getFullYear()).toBe(2025);
          break;
        }
      }
    }, 10000);
  });

  describe('Tuesday specific queries', () => {
    test('-d 6 should include Tuesday commits when Tuesday was 6 days ago', async () => {
      // Calculate if Tuesday was actually 6 days ago
      const today = new Date();
      const sixDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      const dayOfWeek = sixDaysAgo.getDay(); // 0 = Sunday, 2 = Tuesday
      
      if (dayOfWeek === 2) { // Only run this test if Tuesday was actually 6 days ago
        const output = await runGitStandup(['-D', 'local', '-d', '6']);
        const repos = parseRepoCommits(output);

        // Should have some Tuesday commits
        let foundTuesdayCommits = false;
        for (const [repoName, commits] of repos) {
          for (const commit of commits) {
            const dateMatch = commit.match(/\(([^)]+)\)/);
            if (dateMatch) {
              const commitDate = new Date(dateMatch[1]);
              if (commitDate.getDay() === 2) { // Tuesday
                foundTuesdayCommits = true;
                break;
              }
            }
          }
          if (foundTuesdayCommits) break;
        }

        expect(foundTuesdayCommits).toBe(true);
      } else {
        console.log('Skipping Tuesday test - Tuesday was not 6 days ago');
      }
    });
  });

  describe('Date format consistency', () => {
    test('local format should give more precise dates than relative format', async () => {
      const relativeOutput = await runGitStandup(['-d', '3']);
      const localOutput = await runGitStandup(['-D', 'local', '-d', '3']);

      // Both should have similar repo counts
      const relativeRepos = parseRepoCommits(relativeOutput);
      const localRepos = parseRepoCommits(localOutput);

      expect(Math.abs(relativeRepos.size - localRepos.size))
        .toBeLessThanOrEqual(2); // Allow some variance

      // Local format should have parseable dates
      for (const [repoName, commits] of localRepos) {
        if (commits.length > 0) {
          const firstCommit = commits[0];
          const dateMatch = firstCommit.match(/\(([^)]+)\)/);
          
          if (dateMatch) {
            const dateString = dateMatch[1];
            expect(dateString).not.toMatch(/ago$/); // Should not be relative
            
            const parsedDate = new Date(dateString);
            expect(parsedDate.getTime()).not.toBeNaN();
          }
          break;
        }
      }
    }, 15000);
  });
});