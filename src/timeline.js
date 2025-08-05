class Timeline {
  generate(gitData, timeConfig, showNumbers = false) {
    const { repos } = gitData;
    const exceptions = [];
    
    const items = repos.map(repo => {
      const result = this.generateRealPattern(repo, timeConfig, showNumbers);
      
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

  generateRealPattern(repo, timeConfig, showNumbers = false) {
    // Determine which week to analyze
    // For Alastair timeline, always use current week to show recent activity
    let referenceDate = new Date(); // Always use current date for week calculation
    
    // Note: We used to use timeConfig.startDate, but this caused issues where
    // commits would fall outside the calculated week boundaries
    
    const dayOfWeek = referenceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() - daysFromMonday);
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
    // BUT: disable for single-day queries to maintain precision
    const totalWeekCommits = weekDays.reduce((sum, day) => sum + day.commits, 0);
    const isSingleDayQuery = timeConfig && timeConfig.type && timeConfig.type.startsWith('last-') && 
                            timeConfig.startDate && timeConfig.endDate && 
                            timeConfig.startDate.getTime() === timeConfig.endDate.getTime();
    
    if (totalWeekCommits === 0 && repo.commitCount > 0 && repo.commits && Array.isArray(repo.commits) && !isSingleDayQuery) {
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
  
  // Helper to parse commit date from "time ago" strings (for commit date fallback)
  parseCommitDate(timeAgo) {
    const now = new Date();
    
    // Parse patterns like "26 minutes ago", "22 hours ago", "2 days ago"
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
}

module.exports = Timeline;