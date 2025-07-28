class Timeline {
  generate(gitData, timeConfig, showNumbers = false) {
    const { repos } = gitData;
    const exceptions = [];
    
    const items = repos.map(repo => {
      const result = this.generateRealPattern(repo, showNumbers);
      
      // Track repos that needed to use commit dates
      if (result.usedCommitDate) {
        exceptions.push(repo.name);
      }
      
      return {
        pattern: result.pattern,
        project: repo.name,
        commits: repo.commitCount
      };
    });
    
    return { items, exceptions };
  }

  generateRealPattern(repo, showNumbers = false) {
    // Get the current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0); // Start of day
    
    // Create array for each day of the week (Mon-Sun)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push({
        date: day,
        commits: 0
      });
    }
    
    let usedCommitDate = false;
    
    // First pass: try with author dates
    if (repo.commits && Array.isArray(repo.commits)) {
      repo.commits.forEach(commit => {
        if (commit.date) {
          const authorDate = new Date(commit.date);
          authorDate.setHours(0, 0, 0, 0); // Normalize to start of day
          
          // Find which day of the week this commit belongs to
          const dayIndex = weekDays.findIndex(day => 
            day.date.getTime() === authorDate.getTime()
          );
          
          if (dayIndex >= 0) {
            weekDays[dayIndex].commits++;
          }
        }
      });
    }
    
    // Smart detection: if week is blank but we have commits, try commit dates
    const totalWeekCommits = weekDays.reduce((sum, day) => sum + day.commits, 0);
    if (totalWeekCommits === 0 && repo.commitCount > 0 && repo.commits && Array.isArray(repo.commits)) {
      usedCommitDate = true;
      
      // Reset and try with commit dates (approximated from "time ago")
      weekDays.forEach(day => day.commits = 0);
      
      repo.commits.forEach(commit => {
        if (commit.timeAgo) {
          // Parse commit date based on current time (this is an approximation)
          const commitDate = this.parseCommitDate(commit.timeAgo);
          if (commitDate) {
            commitDate.setHours(0, 0, 0, 0); // Normalize to start of day
            
            const dayIndex = weekDays.findIndex(day => 
              day.date.getTime() === commitDate.getTime()
            );
            
            if (dayIndex >= 0) {
              weekDays[dayIndex].commits++;
            }
          }
        }
      });
    }
    
    // Generate pattern based on display mode
    const pattern = weekDays.map(day => {
      if (day.commits === 0) return '·';
      
      if (showNumbers) {
        if (day.commits >= 10) return '+';
        return day.commits.toString();
      } else {
        if (day.commits >= 3) return 'x';
        return '/';
      }
    });
    
    return {
      pattern: pattern.join(''),
      usedCommitDate
    };
  }
  
  // Helper to parse commit date from current time (for commit date fallback)
  parseCommitDate(timeAgo) {
    const now = new Date();
    
    // This is a simplified version - we assume commits were made "now" if we can't parse author date
    // In a real implementation, we'd need to get actual commit timestamps from git
    return now;
  }
}

module.exports = Timeline;