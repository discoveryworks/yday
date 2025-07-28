#!/usr/bin/env node

/**
 * Parse git standup output into structured data
 * Usage: node parse_gitlog.js <gitlog-file>
 */

const fs = require('fs');
const path = require('path');

class GitLogParser {
  constructor() {
    this.repos = [];
    this.currentRepo = null;
  }

  parse(gitlogContent) {
    const lines = gitlogContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      if (line.startsWith('/')) {
        // New repository path
        this.currentRepo = {
          path: line.trim(),
          name: path.basename(line.trim()),
          commits: []
        };
        this.repos.push(this.currentRepo);
      } else if (line.match(/^[a-f0-9]+ - /) && this.currentRepo) {
        // Commit line: hash - message (date) <author>
        const match = line.match(/^([a-f0-9]+) - (.+) \(([^)]+)\) <([^>]+)>/);
        if (match) {
          const [, hash, message, dateStr, author] = match;
          
          // Parse the date - git standup uses various formats
          let authorDate;
          try {
            // Handle formats like "2025-07-24", "5 days ago", etc.
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              authorDate = new Date(dateStr);
            } else if (dateStr.includes('days ago')) {
              const daysAgo = parseInt(dateStr.match(/(\d+) days ago/)[1]);
              authorDate = new Date();
              authorDate.setDate(authorDate.getDate() - daysAgo);
            } else if (dateStr.includes('day ago')) {
              authorDate = new Date();
              authorDate.setDate(authorDate.getDate() - 1);
            } else {
              // Try parsing as-is
              authorDate = new Date(dateStr);
            }
          } catch (e) {
            console.warn(`Failed to parse date: ${dateStr}`);
            authorDate = new Date();
          }
          
          this.currentRepo.commits.push({
            hash: hash.trim(),
            message: message.trim(),
            authorDate: authorDate,
            authorDateString: dateStr,
            author: author.trim()
          });
        }
      }
    }
    
    // Calculate commit counts and date ranges for each repo
    this.repos.forEach(repo => {
      repo.commitCount = repo.commits.length;
      if (repo.commits.length > 0) {
        const dates = repo.commits.map(c => c.authorDate).sort();
        repo.dateRange = {
          start: dates[0],
          end: dates[dates.length - 1]
        };
      }
    });
    
    return {
      repos: this.repos,
      totalCommits: this.repos.reduce((sum, repo) => sum + repo.commitCount, 0),
      dateRange: this.calculateOverallDateRange()
    };
  }
  
  calculateOverallDateRange() {
    const allDates = this.repos
      .flatMap(repo => repo.commits.map(c => c.authorDate))
      .sort();
    
    if (allDates.length === 0) return null;
    
    return {
      start: allDates[0],
      end: allDates[allDates.length - 1]
    };
  }
}

// CLI usage
if (require.main === module) {
  const filename = process.argv[2];
  if (!filename) {
    console.error('Usage: node parse_gitlog.js <gitlog-file>');
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const parser = new GitLogParser();
    const result = parser.parse(content);
    
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = GitLogParser;