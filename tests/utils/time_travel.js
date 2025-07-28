/**
 * Time travel utility for testing - similar to Ruby's Timecop
 * Allows freezing time at specific dates for consistent testing
 */

class TimeTraveler {
  constructor() {
    this.originalDate = Date;
    this.frozen = false;
    this.frozenTime = null;
  }

  /**
   * Freeze time at a specific date (like Timecop.freeze)
   * @param {Date|string} dateTime - Date to freeze at
   */
  freeze(dateTime) {
    if (this.frozen) {
      throw new Error('Time is already frozen. Call unfreeze() first.');
    }

    const frozenDate = new Date(dateTime);
    this.frozenTime = frozenDate.getTime();
    this.frozen = true;

    // Mock the global Date constructor
    const self = this;
    global.Date = function(...args) {
      if (args.length === 0) {
        // new Date() returns frozen time
        return new self.originalDate(self.frozenTime);
      } else {
        // new Date(args) works normally
        return new self.originalDate(...args);
      }
    };

    // Copy static methods
    Object.setPrototypeOf(global.Date, this.originalDate);
    Object.getOwnPropertyNames(this.originalDate).forEach(prop => {
      if (typeof this.originalDate[prop] === 'function') {
        global.Date[prop] = this.originalDate[prop];
      }
    });

    // Override Date.now() to return frozen time
    global.Date.now = () => self.frozenTime;

    return frozenDate;
  }

  /**
   * Travel to a specific date and execute a function (like Timecop.travel)
   * @param {Date|string} dateTime - Date to travel to
   * @param {Function} fn - Function to execute at that time
   */
  travel(dateTime, fn) {
    this.freeze(dateTime);
    try {
      return fn();
    } finally {
      this.unfreeze();
    }
  }

  /**
   * Unfreeze time and restore normal Date behavior
   */
  unfreeze() {
    if (!this.frozen) {
      return;
    }

    global.Date = this.originalDate;
    this.frozen = false;
    this.frozenTime = null;
  }

  /**
   * Get the currently frozen time (if any)
   */
  getCurrentTime() {
    return this.frozen ? new Date(this.frozenTime) : new Date();
  }

  /**
   * Check if time is currently frozen
   */
  isFrozen() {
    return this.frozen;
  }
}

// Export a singleton instance
const timeTraveler = new TimeTraveler();

module.exports = timeTraveler;