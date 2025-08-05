/**
 * Git Commit Analysis Logic
 * 
 * Step 2 of clean timeline architecture.
 * Analyzes git-standup output and filters commits to exact timespan.
 */

class CommitAnalyzer {
  
  /**
   * Analyze commits for the exact timespan
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
    // Commit lines typically have format: "abc123 - Message (time ago) <Author>"
    return /^[a-f0-9]+\s+-\s+.+\s+\(.+ago\)\s+<.+>/.test(line);
  }
  
  /**
   * Parse a commit line into structured data
   */
  parseCommitLine(line) {
    // Pattern: "abc123 - Message (26 hours ago) <Author>" with optional trailing content
    const match = line.match(/^([a-f0-9]+)\s+-\s+(.+?)\s+\((.+?ago)\)\s+<(.+?)>/);
    
    if (!match) {
      return null;
    }
    
    const [, hash, message, timeAgo, author] = match;
    
    return {
      hash,
      message: message.trim(),
      timeAgo: timeAgo.trim(),
      author: author.trim(),
      authorDate: this.parseTimeAgo(timeAgo.trim())
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