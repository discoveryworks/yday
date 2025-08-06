/**
 * Timeline Display Logic
 * 
 * Step 3 of clean timeline architecture.
 * Generates different display modes based on timespan type.
 */

class TimelineDisplay {
  
  /**
   * Generate timeline display based on commits and timespan
   * @param {Array} commits - Filtered commits from Step 2
   * @param {Object} timespan - Timespan object from Step 1
   * @param {boolean} alastairMode - Whether to show week pattern (true) or simple list (false)
   * @returns {Object} Timeline display object
   */
  generateTimeline(commits, timespan, alastairMode = false) {
    if (alastairMode) {
      // Alastair mode always shows week pattern, even for single-day queries
      return this.generateWeekPatternDisplay(commits, timespan);
    } else if (timespan.type === 'single-day') {
      return this.generateSingleDayDisplay(commits, timespan);
    } else {
      return this.generateWeekPatternDisplay(commits, timespan);
    }
  }
  
  /**
   * Generate simple list display for single-day queries
   */
  generateSingleDayDisplay(commits, timespan) {
    const items = commits.map(repoData => ({
      repo: repoData.repo,
      commits: repoData.commitCount,
      pattern: null // No MTWRFSs pattern for single day
    }));
    
    return {
      displayType: 'single-day',
      title: timespan.description,
      items
    };
  }
  
  /**
   * Generate week pattern display for multi-day queries
   */
  generateWeekPatternDisplay(commits, timespan) {
    // Calculate the Monday of the week containing the timespan
    // For single-day queries (like yesterday), show the week containing that day
    // For multi-day queries, show the week containing the end date
    const referenceDate = timespan.type === 'single-day' 
      ? (timespan.date || timespan.startDate)
      : timespan.endDate;
      
    const dayOfWeek = referenceDate.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(referenceDate);
    monday.setUTCDate(referenceDate.getUTCDate() - daysFromMonday);
    monday.setUTCHours(0, 0, 0, 0);
    
    
    const items = commits.map(repoData => {
      const pattern = this.generateWeekPattern(repoData, monday);
      
      return {
        repo: repoData.repo,
        commits: repoData.commitCount,
        pattern
      };
    });
    
    const mondayFormatted = monday.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
    
    return {
      displayType: 'week-pattern',
      title: `Week beginning ${mondayFormatted}`,
      items
    };
  }
  
  /**
   * Generate MTWRFSs pattern for a repo
   */
  generateWeekPattern(repoData, monday) {
    // Create array for each day of the week (Mon-Sun)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + i);
      weekDays.push({
        date: day,
        commits: 0
      });
    }
    
    
    // Map commits to week days
    repoData.commits.forEach(commit => {
      if (commit.authorDate) {
        const commitDate = new Date(commit.authorDate);
        commitDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day in UTC
        
        // Find which day of the week this commit belongs to
        const dayIndex = weekDays.findIndex(day => 
          day.date.getTime() === commitDate.getTime()
        );
        
        if (dayIndex >= 0) {
          weekDays[dayIndex].commits++;
        }
      }
    });
    
    // Generate pattern string
    const pattern = weekDays.map(day => {
      if (day.commits === 0) return '·';
      if (day.commits >= 10) return '+';
      return day.commits.toString();
    });
    
    return pattern.join('');
  }
}

module.exports = TimelineDisplay;