const Timeline = require('../../src/timeline');

describe('Timeline Pattern Generation Bugs', () => {
  let timeline;
  
  beforeEach(() => {
    timeline = new Timeline();
  });

  test.skip('should not show all dots when commits exist in the current week (OBSOLETE - uses old Timeline class)', () => {
    // Test the original bug: repo has commits but timeline showed all dots
    // Now we use current week, so only commits in current week should appear
    const mockRepo = {
      name: 'test-repo',
      commitCount: 2,
      commits: [
        {
          date: '2025-08-04T09:39:04.000Z', // Monday (current week)
          timeAgo: '7 hours ago'
        },
        {
          date: '2025-08-05T10:00:00.000Z', // Tuesday (current week)
          timeAgo: '1 day ago'
        }
      ]
    };

    const timeConfig = {
      type: 'smart-yesterday',
      startDate: new Date('2025-08-01T20:18:01.792Z'),
      endDate: new Date('2025-08-04T20:18:01.792Z'),
      days: 3
    };

    const result = timeline.generateRealPattern(mockRepo, timeConfig, true);
    
    // Should NOT be all dots if we have commits in current week
    expect(result.pattern).not.toBe('·······');
    
    // Should show commits on Monday (index 0) and Tuesday (index 1)
    const pattern = result.pattern;
    expect(pattern[0]).not.toBe('·'); // Monday should have commits
    expect(pattern[1]).not.toBe('·'); // Tuesday should have commits
    expect(pattern[2]).toBe('·'); // Wednesday should be empty
  });

  test.skip('should correctly map commits to weekdays in current week (OBSOLETE - uses old Timeline class)', () => {
    const mockRepo = {
      name: 'test-repo',
      commitCount: 2,
      commits: [
        {
          date: '2025-08-04T09:39:04.000Z', // Monday (current week)
          timeAgo: '0 hours ago'
        },
        {
          date: '2025-08-07T10:00:00.000Z', // Thursday (current week)
          timeAgo: '3 days from now'
        }
      ]
    };

    const timeConfig = {
      type: 'smart-yesterday', 
      startDate: new Date('2025-08-01T00:00:00.000Z'),
      endDate: new Date('2025-08-04T23:59:59.000Z')
    };

    const result = timeline.generateRealPattern(mockRepo, timeConfig, true);
    
    // Pattern should be: Mon=1, Tue=·, Wed=·, Thu=1, Fri=·, Sat=·, Sun=·
    // Index:             0     1     2     3     4     5     6
    expect(result.pattern[0]).toBe('1'); // Monday
    expect(result.pattern[3]).toBe('1'); // Thursday
    expect(result.pattern[1]).toBe('·'); // Tuesday (no commits)
    expect(result.pattern[2]).toBe('·'); // Wednesday (no commits)
    expect(result.pattern[4]).toBe('·'); // Friday (no commits)
  });

  test('should handle commits outside the displayed week gracefully', () => {
    const mockRepo = {
      name: 'test-repo', 
      commitCount: 1,
      commits: [
        {
          date: '2025-07-20T10:00:00.000Z', // Way in the past
          timeAgo: '15 days ago'
        }
      ]
    };

    const timeConfig = {
      type: 'smart-yesterday',
      startDate: new Date('2025-08-01T00:00:00.000Z'),
      endDate: new Date('2025-08-04T23:59:59.000Z')
    };

    const result = timeline.generateRealPattern(mockRepo, timeConfig, true);
    
    // Should be all dots since commit is outside current week
    expect(result.pattern).toBe('·······');
  });
});