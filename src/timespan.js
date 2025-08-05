/**
 * Timespan Determination Logic
 * 
 * Step 1 of clean timeline architecture.
 * Converts CLI options into precise date ranges.
 */

class TimespanAnalyzer {
  
  /**
   * Determine the exact timespan based on CLI options
   * @param {Object} options - CLI options from commander
   * @param {Date} currentDate - Current date (for testing)
   * @returns {Object} Timespan object with type, dates, and description
   */
  determineTimespan(options, currentDate = new Date()) {
    // Handle specific day options (--last-tuesday, etc.)
    if (this.hasSpecificDayOption(options)) {
      return this.handleSpecificDay(options, currentDate);
    }
    
    // Handle explicit date ranges
    if (options.days) {
      return this.handleDaysOption(options.days, currentDate);
    }
    
    if (options.after || options.before) {
      return this.handleDateRangeOptions(options, currentDate);
    }
    
    if (options.on !== undefined) {
      return this.handleOnOption(options.on, currentDate);
    }
    
    if (options.today) {
      return this.handleTodayOption(currentDate);
    }
    
    // Default: smart yesterday logic
    return this.handleSmartYesterday(currentDate);
  }
  
  /**
   * Check if any specific day option is set
   */
  hasSpecificDayOption(options) {
    return options.lastMonday || options.lastTuesday || options.lastWednesday ||
           options.lastThursday || options.lastFriday || options.lastSaturday ||
           options.lastSunday || options.lastWorkday;
  }
  
  /**
   * Handle --last-tuesday, --last-monday, etc.
   */
  handleSpecificDay(options, currentDate) {
    let targetDay;
    let description;
    
    if (options.lastMonday) { targetDay = 1; description = 'Monday'; }
    else if (options.lastTuesday) { targetDay = 2; description = 'Tuesday'; }
    else if (options.lastWednesday) { targetDay = 3; description = 'Wednesday'; }
    else if (options.lastThursday) { targetDay = 4; description = 'Thursday'; }
    else if (options.lastFriday) { targetDay = 5; description = 'Friday'; }
    else if (options.lastSaturday) { targetDay = 6; description = 'Saturday'; }
    else if (options.lastSunday) { targetDay = 0; description = 'Sunday'; }
    else if (options.lastWorkday) {
      return this.handleLastWorkday(currentDate);
    }
    
    const targetDate = this.findLastOccurrenceOfDay(targetDay, currentDate);
    
    // Create UTC dates to avoid timezone issues in tests
    const startDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));
    
    return {
      type: 'single-day',
      date: new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0)),
      startDate,
      endDate,
      description: `${description}, ${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    };
  }
  
  /**
   * Find the most recent occurrence of a specific day of week
   * @param {number} targetDay - 0=Sunday, 1=Monday, ..., 6=Saturday  
   * @param {Date} currentDate - Reference date
   * @returns {Date} The target date
   */
  findLastOccurrenceOfDay(targetDay, currentDate) {
    const current = new Date(currentDate);
    const currentDay = current.getDay();
    
    let daysBack;
    if (currentDay === targetDay) {
      // If it's the same day, go back a full week
      daysBack = 7;
    } else if (currentDay > targetDay) {
      // Target day is earlier in the week
      daysBack = currentDay - targetDay;
    } else {
      // Target day is in the previous week
      daysBack = 7 - (targetDay - currentDay);
    }
    
    const targetDate = new Date(current);
    targetDate.setDate(current.getDate() - daysBack);
    return targetDate;
  }
  
  /**
   * Handle --last-workday (skip weekends)
   */
  handleLastWorkday(currentDate) {
    const current = new Date(currentDate);
    const currentDay = current.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    let daysBack;
    if (currentDay === 1) { // Monday
      daysBack = 3; // Go to Friday
    } else if (currentDay === 0) { // Sunday  
      daysBack = 2; // Go to Friday
    } else {
      daysBack = 1; // Go to previous day
    }
    
    const targetDate = new Date(current);
    targetDate.setDate(current.getDate() - daysBack);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      type: 'single-day',
      date: targetDate,
      startDate: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0),
      endDate: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999),
      description: `${dayNames[targetDate.getDay()]}, ${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    };
  }
  
  /**
   * Handle --days N option
   */
  handleDaysOption(days, currentDate) {
    // Calculate start date (N days ago)
    const startTargetDate = new Date(currentDate);
    startTargetDate.setDate(currentDate.getDate() - days + 1); // Include today
    
    // Create UTC dates to avoid timezone issues
    const startDate = new Date(Date.UTC(startTargetDate.getUTCFullYear(), startTargetDate.getUTCMonth(), startTargetDate.getUTCDate(), 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 23, 59, 59, 999));
    
    return {
      type: 'multi-day',
      startDate,
      endDate,
      days,
      description: `last ${days} day${days === 1 ? '' : 's'}`
    };
  }
  
  /**
   * Handle --on N option (exactly N days ago)
   */
  handleOnOption(daysAgo, currentDate) {
    const targetDate = new Date(currentDate);
    targetDate.setDate(currentDate.getDate() - daysAgo);
    
    return {
      type: 'single-day',
      date: targetDate,
      startDate: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0),
      endDate: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999),
      description: `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
    };
  }
  
  /**
   * Handle --today option
   */
  handleTodayOption(currentDate) {
    return {
      type: 'single-day',
      date: currentDate,
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999),
      description: 'today'
    };
  }
  
  /**
   * Handle default smart yesterday logic
   */
  handleSmartYesterday(currentDate) {
    const currentDay = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    let targetDate;
    if (currentDay === 1) { // Monday
      // Show Friday's work
      targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - 3);
    } else {
      // Show yesterday's work
      targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - 1);
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create UTC dates to avoid timezone issues
    const startDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));
    
    return {
      type: 'smart-yesterday',
      startDate,
      endDate,
      description: `${dayNames[targetDate.getDay()]}, ${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    };
  }
  
  /**
   * Handle --after and --before options
   */
  handleDateRangeOptions(options, currentDate) {
    let startDate, endDate;
    
    if (options.after) {
      startDate = new Date(options.after);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to 30 days ago if only --before is specified
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (options.before) {
      endDate = new Date(options.before);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today if only --after is specified
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    return {
      type: 'date-range',
      startDate,
      endDate,
      days: daysDiff,
      description: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
    };
  }
}

module.exports = TimespanAnalyzer;