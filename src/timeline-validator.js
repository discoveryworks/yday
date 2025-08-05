/**
 * Timeline Math Verification Logic
 * 
 * Step 4 of clean timeline architecture.
 * Validates that timeline patterns match commit totals.
 */

class TimelineValidator {
  
  /**
   * Validate timeline math consistency
   * @param {Object} timeline - Timeline object from Step 3
   * @returns {Object} Validation result with errors
   */
  validateTimeline(timeline) {
    const errors = [];
    
    timeline.items.forEach(item => {
      if (item.pattern) {
        const patternCommits = this.countPatternCommits(item.pattern);
        
        if (patternCommits !== item.commits) {
          errors.push(`${item.repo}: Pattern shows ${patternCommits} commits but total is ${item.commits}`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Count total commits represented in a pattern
   */
  countPatternCommits(pattern) {
    return pattern.split('').reduce((sum, char) => {
      if (char === '·') return sum;
      if (char === '+') return sum + 10; // + represents 10 or more
      const num = parseInt(char);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }
}

module.exports = TimelineValidator;