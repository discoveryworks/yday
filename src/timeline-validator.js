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
        const result = this.validatePatternCommits(item.pattern, item.commits);
        
        if (!result.isValid) {
          errors.push(`${item.repo}: ${result.error}`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate pattern commits against actual commit count
   * @param {string} pattern - MTWRFSs pattern string
   * @param {number} actualCommits - Actual commit count
   * @returns {Object} Validation result
   */
  validatePatternCommits(pattern, actualCommits) {
    const patternAnalysis = this.analyzePattern(pattern);
    
    // Check if the pattern count is consistent with actual commits
    if (patternAnalysis.hasOverflow) {
      // Pattern has '+' symbols, so actual count should be >= minimum count
      if (actualCommits >= patternAnalysis.minCommits) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error: `Pattern shows at least ${patternAnalysis.minCommits} commits but total is only ${actualCommits}`
        };
      }
    } else {
      // Pattern has no '+' symbols, so counts should match exactly
      if (actualCommits === patternAnalysis.exactCommits) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error: `Pattern shows exactly ${patternAnalysis.exactCommits} commits but total is ${actualCommits}`
        };
      }
    }
  }
  
  /**
   * Analyze a pattern to determine commit counts and overflow status
   * @param {string} pattern - MTWRFSs pattern string
   * @returns {Object} Pattern analysis
   */
  analyzePattern(pattern) {
    let exactCommits = 0;
    let minCommits = 0;
    let hasOverflow = false;
    
    pattern.split('').forEach(char => {
      if (char === '·') {
        // No commits this day
        return;
      } else if (char === '+') {
        // 10 or more commits this day
        hasOverflow = true;
        minCommits += 10;
        exactCommits += 10; // For exact calculations, assume minimum
      } else {
        // Specific number of commits
        const num = parseInt(char);
        if (!isNaN(num)) {
          exactCommits += num;
          minCommits += num;
        }
      }
    });
    
    return {
      exactCommits,
      minCommits,
      hasOverflow
    };
  }
  
  /**
   * Count total commits represented in a pattern (legacy method)
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