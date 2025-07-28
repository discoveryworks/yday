#!/usr/bin/env node

/**
 * Convert parsed git log data to markdown table
 * Usage: node gitlog_to_md.js <gitlog-file> [output-file]
 */

const fs = require('fs');
const GitLogParser = require('./parse_gitlog');

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateMarkdownTable(parsedData) {
  const { repos, totalCommits, dateRange } = parsedData;
  
  let markdown = '# Git Commit Activity Report\n\n';
  
  // Header
  markdown += '| Repository | Commit Hash | Date | Message | Author |\n';
  markdown += '|------------|-------------|------|---------|--------|\n';
  
  // Data rows
  repos.forEach(repo => {
    repo.commits.forEach(commit => {
      const repoName = repo.name;
      const hash = commit.hash.substring(0, 7); // Short hash
      const date = formatDate(commit.authorDate);
      const message = commit.message.replace(/\|/g, '\\|'); // Escape pipes
      const author = commit.author;
      
      markdown += `| ${repoName} | ${hash} | ${date} | ${message} | ${author} |\n`;
    });
  });
  
  // Summary
  if (dateRange) {
    markdown += `\n## Summary\n\n`;
    markdown += `- **Total Commits**: ${totalCommits}\n`;
    markdown += `- **Date Range**: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}\n`;
    markdown += `- **Repositories**: ${repos.length} active repositories\n`;
    
    // Most active repositories
    const sortedRepos = [...repos]
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 5);
    
    markdown += `\n## Most Active Repositories\n`;
    sortedRepos.forEach((repo, i) => {
      markdown += `${i + 1}. **${repo.name}**: ${repo.commitCount} commits\n`;
    });
    
    // Activity by date
    const commitsByDate = {};
    repos.forEach(repo => {
      repo.commits.forEach(commit => {
        const dateKey = formatDate(commit.authorDate);
        commitsByDate[dateKey] = (commitsByDate[dateKey] || 0) + 1;
      });
    });
    
    markdown += `\n## Activity by Date\n`;
    Object.entries(commitsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, count]) => {
        markdown += `- **${date}**: ${count} commits\n`;
      });
  }
  
  return markdown;
}

// CLI usage
if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  
  if (!inputFile) {
    console.error('Usage: node gitlog_to_md.js <gitlog-file> [output-file]');
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    const parser = new GitLogParser();
    const parsedData = parser.parse(content);
    const markdown = generateMarkdownTable(parsedData);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, markdown);
      console.log(`Markdown table written to ${outputFile}`);
    } else {
      console.log(markdown);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateMarkdownTable };