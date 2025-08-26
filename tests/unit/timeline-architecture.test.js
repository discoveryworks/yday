/**
 * Timeline Architecture Tests
 * 
 * These tests define the CORRECT behavior for the timeline system.
 * They are written to FAIL initially, then we'll implement the clean architecture.
 */

describe('Timeline Architecture - Step 1: Timespan Determination', () => {
  
  test('should determine single-day timespan for --last-tuesday', () => {
    // Mock current date as Monday Aug 4, 2025
    const mockCurrentDate = new Date('2025-08-04T10:00:00.000Z'); // Monday
    
    const options = { lastTuesday: true };
    const timespan = determineTimespan(options, mockCurrentDate);
    
    expect(timespan).toEqual({
      type: 'single-day',
      date: new Date('2025-07-29T00:00:00.000Z'), // Last Tuesday  
      startDate: new Date('2025-07-29T00:00:00.000Z'),
      endDate: new Date('2025-07-29T23:59:59.999Z'),
      description: 'Tuesday, July 29'
    });
  });

  test('should determine smart-yesterday timespan for default behavior', () => {
    // Mock current date as Monday Aug 4, 2025  
    const mockCurrentDate = new Date('2025-08-04T10:00:00.000Z'); // Monday
    
    const options = {}; // Default behavior
    const timespan = determineTimespan(options, mockCurrentDate);
    
    // Monday should show Friday's work (smart behavior)
    expect(timespan).toEqual({
      type: 'smart-yesterday', 
      startDate: new Date('2025-08-01T00:00:00.000Z'), // Friday
      endDate: new Date('2025-08-01T23:59:59.999Z'),
      description: 'since Friday, August 1'
    });
  });

  test('should determine multi-day timespan for --days 3', () => {
    const mockCurrentDate = new Date('2025-08-04T10:00:00.000Z'); // Monday
    
    const options = { days: 3 };
    const timespan = determineTimespan(options, mockCurrentDate);
    
    expect(timespan).toEqual({
      type: 'multi-day',
      startDate: new Date('2025-08-02T00:00:00.000Z'), // 3 days: Aug 2, 3, 4
      endDate: new Date('2025-08-04T23:59:59.999Z'), // Today
      days: 3,
      description: 'last 3 days'
    });
  });
});

describe('Timeline Architecture - Step 2: Git Analysis', () => {
  
  test('should analyze commits for exact timespan only', () => {
    const timespan = {
      type: 'single-day',
      startDate: new Date('2025-07-29T00:00:00.000Z'), // Tuesday
      endDate: new Date('2025-07-29T23:59:59.999Z'),
      description: 'Tuesday, July 29'
    };
    
    // Use ISO format dates that match the timespan (July 29)
    const mockGitStandupOutput = `
/Users/test/repo1
abc123 - Fixed bug (2025-07-29 10:00:00 -0400) <User> 
def456 - Added feature (2025-07-29 14:30:00 -0400) <User>

/Users/test/repo2  
abc789 - Updated docs (2025-07-29 16:15:00 -0400) <User>
`;
    
    const commits = analyzeCommits(timespan, mockGitStandupOutput);
    
    expect(commits).toEqual([
      {
        repo: 'repo1',
        commits: [
          { hash: 'abc123', message: 'Fixed bug', timeAgo: '2025-07-29 10:00:00 -0400', author: 'User', authorDate: expect.any(Date) },
          { hash: 'def456', message: 'Added feature', timeAgo: '2025-07-29 14:30:00 -0400', author: 'User', authorDate: expect.any(Date) }
        ],
        commitCount: 2
      },
      {
        repo: 'repo2', 
        commits: [
          { hash: 'abc789', message: 'Updated docs', timeAgo: '2025-07-29 16:15:00 -0400', author: 'User', authorDate: expect.any(Date) }
        ],
        commitCount: 1
      }
    ]);
  });
});

describe('Timeline Architecture - Step 3: Timeline Display', () => {
  
  test('should display single-day query as simple list (not week pattern)', () => {
    const timespan = {
      type: 'single-day',
      date: new Date('2025-07-29T00:00:00.000Z'),
      description: 'Tuesday, July 29'
    };
    
    const commits = [
      { repo: 'repo1', commitCount: 2, commits: [] },
      { repo: 'repo2', commitCount: 1, commits: [] }
    ];
    
    const timeline = generateTimeline(commits, timespan);
    
    expect(timeline).toEqual({
      displayType: 'single-day',
      title: 'Tuesday, July 29',
      items: [
        { repo: 'repo1', commits: 2, pattern: null }, // No MTWRFSs pattern for single day
        { repo: 'repo2', commits: 1, pattern: null }
      ]
    });
  });

  test('should display multi-day query as week pattern with correct math', () => {
    const timespan = {
      type: 'multi-day',
      startDate: new Date('2025-08-01T00:00:00.000Z'), // Friday
      endDate: new Date('2025-08-04T23:59:59.999Z'), // Monday  
      description: 'last 4 days'
    };
    
    const commits = [
      { 
        repo: 'repo1', 
        commitCount: 3,
        commits: [
          { authorDate: new Date('2025-08-08T10:00:00.000Z') }, // Friday of current week - 1 commit
          { authorDate: new Date('2025-08-04T10:00:00.000Z') }, // Monday - 2 commits  
          { authorDate: new Date('2025-08-04T15:00:00.000Z') }
        ]
      }
    ];
    
    const timeline = generateTimeline(commits, timespan);
    
    expect(timeline).toEqual({
      displayType: 'week-pattern',
      title: 'Week beginning Monday, August 4, 2025',
      items: [
        { 
          repo: 'repo1', 
          commits: 3, 
          pattern: '2···1··' // Mon=2, Tue=0, Wed=0, Thu=0, Fri=1, Sat=0, Sun=0
        }
      ]
    });
    
    // CRITICAL: Pattern commits must equal total commits
    const patternSum = timeline.items[0].pattern.split('').reduce((sum, char) => {
      return sum + (char === '·' ? 0 : parseInt(char) || 0);
    }, 0);
    expect(patternSum).toBe(timeline.items[0].commits);
  });
});

describe('Timeline Architecture - Step 4: Math Verification', () => {
  
  test('should validate that pattern commits equal total commits', () => {
    const timeline = {
      items: [
        { repo: 'repo1', commits: 5, pattern: '2·1·2··' }, // 2+1+2 = 5 ✓
        { repo: 'repo2', commits: 1, pattern: '··1····' }  // 1 = 1 ✓  
      ]
    };
    
    const validation = validateTimeline(timeline);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should catch math errors in timeline patterns', () => {
    const timeline = {
      items: [
        { repo: 'repo1', commits: 14, pattern: '5······' }, // 5 ≠ 14 ✗
        { repo: 'repo2', commits: 3, pattern: '1·1·1··' }   // 1+1+1 = 3 ✓
      ]
    };
    
    const validation = validateTimeline(timeline);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      'repo1: Pattern shows exactly 5 commits but total is 14'
    );
  });
});

const TimespanAnalyzer = require('../../src/timespan');
const CommitAnalyzer = require('../../src/commit-analyzer');
const TimelineDisplay = require('../../src/timeline-display');
const TimelineValidator = require('../../src/timeline-validator');

// Clean architecture functions
function determineTimespan(options, currentDate = new Date()) {
  const analyzer = new TimespanAnalyzer();
  return analyzer.determineTimespan(options, currentDate);
}

function analyzeCommits(timespan, gitStandupOutput) {
  const analyzer = new CommitAnalyzer();
  return analyzer.analyzeCommits(timespan, gitStandupOutput);
}

function generateTimeline(commits, timespan) {
  const display = new TimelineDisplay();
  return display.generateTimeline(commits, timespan);
}

function validateTimeline(timeline) {
  const validator = new TimelineValidator();
  return validator.validateTimeline(timeline);
}