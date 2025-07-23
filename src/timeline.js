class Timeline {
  generate(gitData, timeConfig) {
    const { repos } = gitData;
    
    const items = repos.map(repo => ({
      pattern: this.generateRealPattern(repo),
      project: repo.name,
      commits: repo.commitCount
    }));
    
    return { items };
  }

  generateRealPattern(repo) {
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
    
    // Count commits for each day
    if (repo.commits && Array.isArray(repo.commits)) {
      repo.commits.forEach(commit => {
        if (commit.date) {
          const commitDate = new Date(commit.date);
          commitDate.setHours(0, 0, 0, 0); // Normalize to start of day
          
          // Find which day of the week this commit belongs to
          const dayIndex = weekDays.findIndex(day => 
            day.date.getTime() === commitDate.getTime()
          );
          
          if (dayIndex >= 0) {
            weekDays[dayIndex].commits++;
          }
        }
      });
    }
    
    // Generate pattern symbols based on commit counts
    const pattern = weekDays.map(day => {
      if (day.commits === 0) return '·';
      if (day.commits >= 3) return 'x';
      return '/';
    });
    
    return pattern.join('');
  }
}

module.exports = Timeline;