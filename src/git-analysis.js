const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class GitAnalysis {
  async findRepositories(parentDir) {
    const repos = [];
    
    try {
      const entries = await fs.readdir(parentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const repoPath = path.join(parentDir, entry.name);
          const isGitRepo = await this.isGitRepository(repoPath);
          
          if (isGitRepo) {
            repos.push({
              name: entry.name,
              path: repoPath
            });
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan directory ${parentDir}: ${error.message}`);
    }
    
    return repos.sort((a, b) => a.name.localeCompare(b.name));
  }

  async isGitRepository(dirPath) {
    try {
      const gitDir = path.join(dirPath, '.git');
      const stat = await fs.stat(gitDir);
      return stat.isDirectory() || stat.isFile(); // Handle both .git directories and worktree .git files
    } catch {
      return false;
    }
  }

  async getCommits(parentDir, timeConfig) {
    // Change to parent directory for git-standup
    const originalCwd = process.cwd();
    process.chdir(parentDir);
    
    try {
      // Use git-standup for commit collection
      const standupArgs = this.buildStandupArgs(parentDir, timeConfig);
      const standupOutput = await this.runGitStandup(standupArgs);
      
      return this.parseStandupOutput(standupOutput, parentDir);
    } finally {
      // Always restore original directory
      process.chdir(originalCwd);
    }
  }

  buildStandupArgs(parentDir, timeConfig) {
    // If this is a git-standup style config, use the prebuilt args
    if (timeConfig.type === 'git-standup' && timeConfig.standupArgs) {
      return timeConfig.standupArgs;
    }
    
    const args = [];
    
    if (timeConfig.type === 'today') {
      // Show only today
      args.push('-d', '0', '-u', '0');
    } else if (timeConfig.type === 'on-day' && timeConfig.singleDay) {
      // Show only that specific day
      args.push('-d', timeConfig.days.toString(), '-u', timeConfig.days.toString());
    } else if (timeConfig.type === 'smart-yesterday') {
      // For smart yesterday, show since N days ago (not limited by -u)
      args.push('-d', timeConfig.days.toString());
    } else if (timeConfig.days === 1) {
      // Show only yesterday - use -d 1 -u 0 to get exactly yesterday
      args.push('-d', '1', '-u', '0');
    } else if (timeConfig.type && timeConfig.type.startsWith('last-') && timeConfig.startDate && timeConfig.endDate && timeConfig.startDate.getTime() === timeConfig.endDate.getTime()) {
      // Single day query (startDate === endDate) - show only that day
      // Use -d X -u (X-1) to get commits from exactly X days ago
      const until = Math.max(0, timeConfig.days - 1);
      args.push('-d', timeConfig.days.toString(), '-u', until.toString());
    } else {
      // For multiple days, -d shows "since N days ago"
      args.push('-d', timeConfig.days.toString());
    }
    
    return args;
  }

  async runGitStandup(args) {
    return new Promise((resolve, reject) => {
      // Access verbose flag from parent module
      const verbose = require('./index').verbose;
      
      if (verbose) {
        console.log(require('chalk').gray(`Running: git-standup ${args.join(' ')}`));
        console.log(require('chalk').gray(`Working directory: ${process.cwd()}`));
      }
      
      const child = spawn('git-standup', args, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
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
        if (verbose) {
          console.log(require('chalk').gray(`git-standup exit code: ${code}`));
          if (stdout) {
            console.log(require('chalk').gray(`git-standup output (${stdout.length} chars):`));
            console.log(require('chalk').gray(stdout.substring(0, 500) + (stdout.length > 500 ? '...' : '')));
          }
        }
        
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`git-standup failed: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error('git-standup not found. Install with: npm install -g git-standup'));
        } else {
          reject(error);
        }
      });
    });
  }

  parseStandupOutput(standupOutput, parentDir) {
    const repoCommits = new Map();
    let currentRepo = '';
    let currentCommits = [];
    
    const lines = standupOutput.split('\n');
    
    // Debug: log the first few lines if verbose is enabled
    const verbose = require('./index').verbose;
    if (verbose) {
      console.log(require('chalk').gray('First 10 lines of git-standup output:'));
      lines.slice(0, 10).forEach((line, i) => {
        console.log(require('chalk').gray(`${i}: ${line}`));
      });
    }
    
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Check if this is a repository header (starts with /, contains git repos)
      if (line.match(/^\/.*\/([^/]+)$/)) {
        // Save previous repo data if we have it
        if (currentRepo && currentCommits.length > 0) {
          const repoName = path.basename(currentRepo);
          repoCommits.set(repoName, [...currentCommits]);
        }
        
        // Extract repo name from path
        currentRepo = line;
        currentCommits = [];
        continue;
      }
      
      // Skip "No commits" lines
      if (line.match(/^No commits from .* during this period\.$/)) {
        continue;
      }
      
      // Check if this line contains commit info (starts with hash and has " - ")
      if (line.match(/^[a-f0-9]+.*\s-\s/)) {
        // Extract commit message and timestamp
        const commitMatch = line.match(/^[a-f0-9]+.*\s-\s(.+)\s\(([^)]*\sago)\)\s<[^>]*>.*$/);
        if (commitMatch) {
          let commitMessage = commitMatch[1].trim();
          const timeAgo = commitMatch[2]; // e.g., "2 minutes ago", "3 hours ago", "1 day ago"
          
          if (commitMessage) {
            // Parse the time ago string to get a date
            const commitDate = this.parseTimeAgo(timeAgo);
            
            currentCommits.push({
              message: commitMessage,
              date: commitDate,
              timeAgo: timeAgo
            });
          }
        }
      }
    }
    
    // Don't forget the last repo
    if (currentRepo && currentCommits.length > 0) {
      const repoName = path.basename(currentRepo);
      repoCommits.set(repoName, [...currentCommits]);
    }
    
    // Convert to the format expected by semantic analysis
    const result = [];
    for (const [repoName, commits] of repoCommits) {
      result.push({
        name: repoName,
        path: currentRepo, // This should be calculated properly, but for now...
        commits: commits,
        commitCount: commits.length
      });
    }
    
    if (verbose) {
      console.log(require('chalk').gray(`Parsed ${result.length} repos with commits`));
    }
    
    return {
      parentDir,
      repos: result
    };
  }

  // Parse "time ago" strings from git-standup into actual dates
  parseTimeAgo(timeAgo) {
    const now = new Date();
    
    // Parse patterns like "2 minutes ago", "3 hours ago", "1 day ago"
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

  // Helper method to get remote repository URL
  async getRemoteUrl(repoPath) {
    try {
      return new Promise((resolve, reject) => {
        const child = spawn('git', ['remote', 'get-url', 'origin'], {
          cwd: repoPath,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve(stdout.trim());
          } else {
            resolve(null); // No remote or error
          }
        });
        
        child.on('error', () => {
          resolve(null);
        });
      });
    } catch {
      return null;
    }
  }
}

module.exports = GitAnalysis;