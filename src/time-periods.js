class TimePeriods {
  parseOptions(options) {
    // Handle explicit day options
    if (options.lastMonday) return this.getLastDay('monday');
    if (options.lastTuesday) return this.getLastDay('tuesday');
    if (options.lastWednesday) return this.getLastDay('wednesday');
    if (options.lastThursday) return this.getLastDay('thursday');
    if (options.lastFriday) return this.getLastDay('friday');
    if (options.lastSaturday) return this.getLastDay('saturday');
    if (options.lastSunday) return this.getLastDay('sunday');
    
    // Handle workday option
    if (options.lastWorkday) return this.getLastWorkday();
    
    // Handle today option
    if (options.today) return this.getToday();
    
    // Handle "on that day" option (single day, N days ago)
    if (options.on !== undefined) return this.getOnDay(options.on);
    
    // Handle git-standup style options
    if (options.days !== undefined || options.until !== undefined || options.after || options.before) {
      return this.getGitStandupStyle(options);
    }
    
    // Default: smart yesterday (Friday on Monday)
    return this.getSmartYesterday();
  }

  getToday() {
    const today = new Date();
    return {
      type: 'today',
      startDate: today,
      endDate: today,
      days: 0
    };
  }

  getDaysBack(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return {
      type: 'days',
      startDate,
      endDate,
      days
    };
  }

  getSmartYesterday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (dayOfWeek === 1) { // Monday
      // Show Friday + weekend (since Friday, 3 days ago)
      return {
        type: 'smart-yesterday',
        startDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        endDate: today,
        days: 3,
        description: 'since Friday'
      };
    } else {
      // Show recent work (today + yesterday to catch commits from last 24 hours)
      return {
        type: 'smart-yesterday',
        startDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        endDate: today,
        days: 1,
        description: 'recent work'
      };
    }
  }

  getLastWorkday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let daysBack = 1;
    if (dayOfWeek === 1) daysBack = 3; // Monday -> Friday
    else if (dayOfWeek === 0) daysBack = 2; // Sunday -> Friday
    
    const workday = new Date();
    workday.setDate(workday.getDate() - daysBack);
    
    return {
      type: 'last-workday',
      startDate: workday,
      endDate: workday,
      days: daysBack
    };
  }

  getLastDay(dayName) {
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = this.getDayNumber(dayName);
    
    let daysBack = (currentDay - targetDay + 7) % 7;
    if (daysBack === 0) daysBack = 7; // If today is the target day, go back a week
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);
    
    return {
      type: `last-${dayName}`,
      startDate: targetDate,
      endDate: targetDate,
      days: daysBack
    };
  }

  getDayNumber(dayName) {
    const days = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    return days[dayName.toLowerCase()];
  }

  getDescription(timeConfig) {
    switch (timeConfig.type) {
      case 'today':
        return `today, ${this.formatDate(timeConfig.startDate)}`;
      
      case 'yesterday':
        return `yesterday, ${this.formatDate(timeConfig.startDate)}`;
      
      case 'smart-yesterday':
        if (timeConfig.description) {
          return timeConfig.description;
        }
        const today = new Date();
        if (today.getDay() === 1) { // Monday
          return `since Friday, ${this.formatDate(timeConfig.startDate)}`;
        }
        return `recent work`;
      
      case 'last-workday':
        return `last workday, ${this.formatDate(timeConfig.startDate)}`;
      
      case 'on-day':
        if (timeConfig.days === 0) {
          return `today, ${this.formatDate(timeConfig.startDate)}`;
        } else if (timeConfig.days === 1) {
          return `yesterday, ${this.formatDate(timeConfig.startDate)}`;
        } else {
          return `${timeConfig.days} days ago, ${this.formatDate(timeConfig.startDate)}`;
        }
      
      case 'git-standup':
        if (timeConfig.days && timeConfig.until) {
          return `${timeConfig.until} to ${timeConfig.days} days ago`;
        } else if (timeConfig.days) {
          return `last ${timeConfig.days} days`;
        } else if (timeConfig.after && timeConfig.before) {
          return `from ${timeConfig.after} to ${timeConfig.before}`;
        } else if (timeConfig.after) {
          return `since ${timeConfig.after}`;
        } else if (timeConfig.before) {
          return `before ${timeConfig.before}`;
        }
        return `custom time period`;
      
      case 'days':
        if (timeConfig.days === 1) {
          return `yesterday, ${this.formatDate(timeConfig.startDate)}`;
        }
        return `last ${timeConfig.days} days`;
      
      default:
        if (timeConfig.type.startsWith('last-')) {
          const dayName = timeConfig.type.replace('last-', '');
          return `last ${dayName}, ${this.formatDate(timeConfig.startDate)}`;
        }
        return this.formatDate(timeConfig.startDate);
    }
  }

  getOnDay(daysAgo) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    
    return {
      type: 'on-day',
      startDate: targetDate,
      endDate: targetDate,
      days: daysAgo,
      singleDay: true
    };
  }

  getGitStandupStyle(options) {
    return {
      type: 'git-standup',
      days: options.days,
      until: options.until,
      after: options.after,
      before: options.before,
      standupArgs: this.buildStandupArgs(options)
    };
  }

  buildStandupArgs(options) {
    const args = [];
    
    if (options.days !== undefined) {
      args.push('-d', options.days.toString());
    }
    
    if (options.until !== undefined) {
      args.push('-u', options.until.toString());
    }
    
    if (options.after) {
      args.push('-A', options.after);
    }
    
    if (options.before) {
      args.push('-B', options.before);
    }
    
    return args;
  }

  formatDate(date) {
    const options = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  // Convert to git-standup compatible arguments
  toGitStandupArgs(timeConfig) {
    if (timeConfig.type === 'today') {
      return ['-d', '0', '-u', '0'];
    }
    
    if (timeConfig.days === 1) {
      return ['-d', '1', '-u', '1'];
    }
    
    return ['-d', timeConfig.days.toString()];
  }
}

module.exports = TimePeriods;