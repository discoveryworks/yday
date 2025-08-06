/**
 * Git Commit Analysis Logic
 * 
 * Step 2 of clean timeline architecture.
 * Analyzes git-standup output and filters commits to exact timespan.
 */

const { spawn } = require('child_process');

class CommitAnalyzer {
  
  /**
   * Analyze commits for the exact timespan (test version - takes git-standup output)
   * @param {Object} timespan - Timespan object from Step 1
   * @param {string} gitStandupOutput - Raw output from git-standup
   * @returns {Array} Array of repo objects with filtered commits
   */
  analyzeCommits(timespan, gitStandupOutput) {
    const repos = this.parseGitStandupOutput(gitStandupOutput);
    
    // Filter commits to exact timespan
    const filteredRepos = repos.map(repo => {
      const filteredCommits = repo.commits.filter(commit => {
        return this.isCommitInTimespan(commit, timespan);
      });
      
      return {
        repo: repo.repo,
        commits: filteredCommits,
        commitCount: filteredCommits.length
      };
    }).filter(repo => repo.commitCount > 0); // Only include repos with commits
    
    return filteredRepos;
  }
  
  /**
   * Analyze commits for the exact timespan (production version - runs git-standup)
   * @param {string} parentDir - Parent directory to scan for repos
   * @param {Object} timespan - Timespan object from Step 1
   * @returns {Array} Array of repo objects with filtered commits
   */
  async analyzeCommitsFromGit(parentDir, timespan) {
    // Run git-standup to get commit data
    const gitStandupOutput = await this.runGitStandup(parentDir, timespan);
    
    // Use the test version to parse the output
    return this.analyzeCommits(timespan, gitStandupOutput);
  }
  
  /**
   * Run git-standup command to get commit data
   * @param {string} parentDir - Parent directory to scan for repos
   * @param {Object} timespan - Timespan object from Step 1  
   * @returns {string} git-standup output
   */
  async runGitStandup(parentDir, timespan) {
    const args = this.buildStandupArgs(timespan);
    
    return new Promise((resolve, reject) => {
      const child = spawn('git-standup', args, {
        cwd: parentDir,
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
        if (code !== 0) {
          reject(new Error(`git-standup failed with code ${code}: ${stderr}`));
          return;
        }
        resolve(stdout);
      });
      
      child.on('error', (error) => {
        reject(new Error(`Failed to spawn git-standup: ${error.message}`));
      });
    });
  }
  
  /**
   * Build git-standup arguments from timespan
   * @param {Object} timespan - Timespan object
   * @returns {Array} git-standup arguments
   */
  buildStandupArgs(timespan) {
    // Use git-standup's -A (after) and -B (before) flags for precise date ranges
    // instead of -d (days back) which can include unwanted commits
    
    // Format dates as YYYY-MM-DD for git-standup
    const startDateStr = timespan.startDate.toISOString().substring(0, 10);
    const endDateStr = timespan.endDate.toISOString().substring(0, 10);
    
    
    // Use precise date range and ISO format for exact timestamps
    return ['-A', startDateStr, '-B', endDateStr, '-D', 'iso'];
  }
  
  /**
   * Parse git-standup output into structured data
   * @param {string} output - Raw git-standup output
   * @returns {Array} Array of repo objects
   */
  parseGitStandupOutput(output) {
    const lines = output.trim().split('\n');
    const repos = [];
    let currentRepo = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') continue;
      
      // Check if this is a repo path line (starts with / or ~ or contains workspace)
      if (this.isRepoPathLine(trimmedLine)) {
        // Save previous repo if it exists
        if (currentRepo) {
          repos.push(currentRepo);
        }
        
        // Start new repo
        const repoName = this.extractRepoName(trimmedLine);
        currentRepo = {
          repo: repoName,
          commits: []
        };
        continue;
      }
      
      // Check if this is a "no commits" line
      if (trimmedLine.includes('No commits from') || trimmedLine.includes('during this period')) {
        continue;
      }
      
      // Parse commit line
      if (currentRepo && this.isCommitLine(trimmedLine)) {
        const commit = this.parseCommitLine(trimmedLine);
        if (commit) {
          currentRepo.commits.push(commit);
        }
      }
    }
    
    // Don't forget the last repo
    if (currentRepo) {
      repos.push(currentRepo);
    }
    
    return repos;
  }
  
  /**
   * Check if a line is a repository path
   */
  isRepoPathLine(line) {
    return line.startsWith('/') || line.startsWith('~') || 
           line.includes('/workspace/') || line.includes('/repos/');
  }
  
  /**
   * Extract repository name from path
   */
  extractRepoName(path) {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }
  
  /**
   * Check if a line is a commit line (has hash and message)
   */
  isCommitLine(line) {
    // Commit lines can have two formats:
    // Old format: "abc123 - Message (time ago) <Author>"
    // New ISO format: "abc123 - Message (2025-08-05 13:25:28 -0400) <Author>"
    return /^[a-f0-9]+\s+-\s+.+\s+\(.+\)\s+<.+>/.test(line);
  }
  
  /**
   * Parse a commit line into structured data
   */
  parseCommitLine(line) {
    // Two patterns to support:
    // Old: "abc123 - Message (26 hours ago) <Author>"
    // New: "abc123 - Message (2025-08-05 13:25:28 -0400) <Author>"
    const match = line.match(/^([a-f0-9]+)\s+-\s+(.+?)\s+\((.+?)\)\s+<(.+?)>/);
    
    if (!match) {
      return null;
    }
    
    const [, hash, message, dateInfo, author] = match;
    
    let authorDate;
    if (dateInfo.includes('ago')) {
      // Old relative format
      authorDate = this.parseTimeAgo(dateInfo.trim());
    } else {
      // New ISO format: "2025-08-05 13:25:28 -0400"
      authorDate = new Date(dateInfo.trim());
    }
    
    return {
      hash,
      message: message.trim(),
      timeAgo: dateInfo.trim(),
      author: author.trim(),
      authorDate
    };
  }
  
  /**
   * Convert "time ago" string to actual date
   * @param {string} timeAgo - e.g., "26 hours ago", "2 days ago"
   * @returns {Date} Approximate commit date
   */
  parseTimeAgo(timeAgo) {
    const now = new Date();
    
    const match = timeAgo.match(/^(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago$/);
    if (!match) {
      return now; // Fallback to now if we can't parse
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'minute':
        return new Date(now.getTime() - value * 60 * 1000);
      case 'hour':
        return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
      default:
        return now;
    }
  }
  
  /**
   * Check if a commit falls within the specified timespan
   * @param {Object} commit - Commit object with authorDate
   * @param {Object} timespan - Timespan object from Step 1
   * @returns {boolean} True if commit is within timespan
   */
  isCommitInTimespan(commit, timespan) {
    if (!commit.authorDate) {
      return false;
    }
    
    const commitDate = commit.authorDate;
    
    // Normalize commit date to start of day for comparison
    const commitDay = new Date(Date.UTC(
      commitDate.getUTCFullYear(),
      commitDate.getUTCMonth(),
      commitDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
    const startDay = new Date(Date.UTC(
      timespan.startDate.getUTCFullYear(),
      timespan.startDate.getUTCMonth(),
      timespan.startDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
    const endDay = new Date(Date.UTC(
      timespan.endDate.getUTCFullYear(),
      timespan.endDate.getUTCMonth(),
      timespan.endDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
    return commitDay >= startDay && commitDay <= endDay;
  }
}

module.exports = CommitAnalyzer;