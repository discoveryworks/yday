const { spawn } = require('child_process');

class Shadow {
  async analyze(parentDir, timeConfig, options = {}) {
    // TODO: Implement shadow work analysis
    // This will identify repos with commits but no project tracking
    
    const { org, project } = options;
    
    // For now, return a placeholder structure
    // TODO: Integrate with GitHub CLI to check project tracking
    
    return {
      untracked: [
        {
          project: 'example-repo',
          commits: 3,
          remote: 'https://github.com/discoveryworks/example-repo.git'
        }
      ]
    };
  }

  async getTrackedRepos(org, projectNumber) {
    // TODO: Use GitHub CLI to get repos already tracked in project
    if (!org || !projectNumber) {
      throw new Error('GitHub organization and project number required for shadow mode');
    }
    
    try {
      return new Promise((resolve, reject) => {
        const child = spawn('gh', [
          'project', 'item-list', projectNumber.toString(),
          '--owner', org,
          '--format', 'json'
        ], {
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
            try {
              const data = JSON.parse(stdout);
              const repos = data.items
                .filter(item => item.content && item.content.repository)
                .map(item => item.content.repository.replace(`${org}/`, ''));
              resolve(repos);
            } catch (error) {
              reject(new Error(`Failed to parse GitHub project data: ${error.message}`));
            }
          } else {
            reject(new Error(`GitHub CLI failed: ${stderr}`));
          }
        });
        
        child.on('error', (error) => {
          if (error.code === 'ENOENT') {
            reject(new Error('GitHub CLI (gh) not found. Install with: brew install gh'));
          } else {
            reject(error);
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to get tracked repos: ${error.message}`);
    }
  }

  async createTrackingIssue(repo, org, commitCount, summary) {
    // TODO: Create GitHub issue for untracked repo
    // This will be called for repos that have commits but no project tracking
    
    const issueTitle = `Track work in ${repo}`;
    const issueBody = `This issue tracks ongoing development work in the \`${repo}\` repository.

**Recent Activity:**
- ${commitCount} commits
- Summary: ${summary}

This issue was automatically created by yday to ensure all active repositories are represented in project tracking.

**Next Steps:**
- [ ] Review recent commits to understand current work
- [ ] Break down work into specific feature/bug issues if needed  
- [ ] Update project status and priority
- [ ] Close this tracking issue once specific work items are created`;

    // TODO: Implement actual issue creation using GitHub CLI
    console.log(`Would create issue: ${issueTitle} in ${org}/${repo}`);
  }
}

module.exports = Shadow;