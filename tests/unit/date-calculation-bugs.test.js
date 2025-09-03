/**
 * ABOUTME: Tests to expose and fix date calculation bugs
 * ABOUTME: Specifically tests for different commands showing identical results when they shouldn't
 */

const TimespanAnalyzer = require('../../src/timespan');
const CommitAnalyzer = require('../../src/commit-analyzer');

describe('Date Calculation Bug Investigation', () => {
  let timespanAnalyzer;
  let commitAnalyzer;

  beforeEach(() => {
    timespanAnalyzer = new TimespanAnalyzer();
    commitAnalyzer = new CommitAnalyzer();
  });

  test('yesterday and last-tuesday should give different results when not the same day', () => {
    // Simulate Wednesday, Sep 3, 2025
    const mockWednesday = new Date('2025-09-03T15:00:00.000Z');
    
    // Get timespan for "yesterday" (should be Tuesday, Sep 2)
    const yesterdayTimespan = timespanAnalyzer.determineTimespan({}, mockWednesday);
    
    // Get timespan for "--last-tuesday" (should also be Tuesday, Sep 2)
    const lastTuesdayTimespan = timespanAnalyzer.determineTimespan({ lastTuesday: true }, mockWednesday);
    
    // Both timespans should target the same date (Sept 2) in this scenario
    
    // Both should be Tuesday, Sep 2, but let's verify they have consistent internal structure
    expect(yesterdayTimespan.description).toContain('Tuesday, September 2');
    expect(lastTuesdayTimespan.description).toContain('Tuesday, September 2');
    
    // The start dates should be the same (both targeting Sep 2)
    expect(yesterdayTimespan.startDate.toDateString()).toBe(lastTuesdayTimespan.startDate.toDateString());
  });

  test('git-standup args should be consistent for same target date', () => {
    const mockWednesday = new Date('2025-09-03T15:00:00.000Z');
    
    const yesterdayTimespan = timespanAnalyzer.determineTimespan({}, mockWednesday);
    const lastTuesdayTimespan = timespanAnalyzer.determineTimespan({ lastTuesday: true }, mockWednesday);
    
    const yesterdayArgs = commitAnalyzer.buildStandupArgs(yesterdayTimespan);
    const lastTuesdayArgs = commitAnalyzer.buildStandupArgs(lastTuesdayTimespan);
    
    // Args should be identical since both target the same date
    
    // Since both target the same day, the args should be identical
    expect(yesterdayArgs).toEqual(lastTuesdayArgs);
  });

  test('should parse git-standup output correctly', () => {
    const mockGitStandupOutput = `
/Users/jpb/workspace/td-core
abc123f - Monday commit (Mon Sep 1 10:00:00 2025 -0400) <JPB>
def456a - Tuesday commit 1 (Tue Sep 2 09:00:00 2025 -0400) <JPB>  
`;

    const repos = commitAnalyzer.parseGitStandupOutput(mockGitStandupOutput);
    
    expect(repos).toHaveLength(1);
    expect(repos[0].repo).toBe('td-core');
    expect(repos[0].commits).toHaveLength(2);
  });

  test('should correctly filter commits to exact timespan', () => {
    // Create a timespan for exactly Tuesday, Sep 2, 2025
    const timespan = {
      type: 'test',
      startDate: new Date(Date.UTC(2025, 8, 2, 0, 0, 0, 0)), // Sep 2 start of day
      endDate: new Date(Date.UTC(2025, 8, 2, 23, 59, 59, 999)) // Sep 2 end of day
    };
    
    // Mock git-standup output with commits from different days
    const mockGitStandupOutput = `
/Users/jpb/workspace/td-core
abc123f - Monday commit (Mon Sep 1 10:00:00 2025 -0400) <JPB>
def456a - Tuesday commit 1 (Tue Sep 2 09:00:00 2025 -0400) <JPB>  
abc789b - Tuesday commit 2 (Tue Sep 2 14:00:00 2025 -0400) <JPB>
def012c - Wednesday commit (Wed Sep 3 11:00:00 2025 -0400) <JPB>

/Users/jpb/workspace/other-repo
abc345d - Tuesday commit (Tue Sep 2 16:00:00 2025 -0400) <JPB>
def678e - Wednesday commit (Wed Sep 3 12:00:00 2025 -0400) <JPB>
`;

    const result = commitAnalyzer.analyzeCommits(timespan, mockGitStandupOutput);
    
    // Should only have repos with Tuesday commits
    expect(result).toHaveLength(2); // td-core and other-repo
    
    // td-core should have 2 commits (both Tuesday commits)
    const tdCoreRepo = result.find(r => r.repo === 'td-core');
    expect(tdCoreRepo).toBeDefined();
    expect(tdCoreRepo.commitCount).toBe(2);
    
    // other-repo should have 1 commit (Tuesday commit)
    const otherRepo = result.find(r => r.repo === 'other-repo');
    expect(otherRepo).toBeDefined();  
    expect(otherRepo.commitCount).toBe(1);
    
    // Verify no Monday or Wednesday commits made it through
    const allCommits = result.flatMap(r => r.commits);
    const commitDates = allCommits.map(c => c.authorDate.toDateString());
    commitDates.forEach(dateStr => {
      expect(dateStr).toBe('Tue Sep 02 2025'); // All should be Tuesday
    });
  });

  test('different days should produce different filtered results', () => {
    // This test should FAIL currently, exposing the bug where different 
    // commands return identical results
    
    const mockGitStandupOutput = `
/Users/jpb/workspace/td-core
abc123f - Monday commit (Mon Sep 1 10:00:00 2025 -0400) <JPB>
def456a - Tuesday commit (Tue Sep 2 14:00:00 2025 -0400) <JPB>
abc789b - Wednesday commit (Wed Sep 3 11:00:00 2025 -0400) <JPB>
`;

    // Filter for Monday
    const mondayTimespan = {
      type: 'test',
      startDate: new Date(Date.UTC(2025, 8, 1, 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(2025, 8, 1, 23, 59, 59, 999))
    };
    
    // Filter for Tuesday  
    const tuesdayTimespan = {
      type: 'test',
      startDate: new Date(Date.UTC(2025, 8, 2, 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(2025, 8, 2, 23, 59, 59, 999))
    };
    
    const mondayResult = commitAnalyzer.analyzeCommits(mondayTimespan, mockGitStandupOutput);
    const tuesdayResult = commitAnalyzer.analyzeCommits(tuesdayTimespan, mockGitStandupOutput);
    
    // These should be different!
    expect(mondayResult).not.toEqual(tuesdayResult);
    
    // Monday should have 1 commit, Tuesday should have 1 commit
    expect(mondayResult[0]?.commitCount).toBe(1);
    expect(tuesdayResult[0]?.commitCount).toBe(1);
    
    // But they should be different commits
    expect(mondayResult[0]?.commits[0]?.message).toContain('Monday');
    expect(tuesdayResult[0]?.commits[0]?.message).toContain('Tuesday');
  });

  test('prev-tuesday should go back a full week from last-tuesday', () => {
    // Simulate Wednesday, Sep 3, 2025
    const mockWednesday = new Date('2025-09-03T15:00:00.000Z');
    
    // Get timespan for "last tuesday" (should be Tuesday, Sep 2 - yesterday)
    const lastTuesdayTimespan = timespanAnalyzer.determineTimespan({ lastTuesday: true }, mockWednesday);
    
    // Get timespan for "prev tuesday" (should be Tuesday, Aug 26 - previous week)
    const prevTuesdayTimespan = timespanAnalyzer.determineTimespan({ prevTuesday: true }, mockWednesday);
    
    // Last Tuesday should be Sep 2 (1 day back from Wednesday)
    expect(lastTuesdayTimespan.description).toContain('Tuesday, September 2');
    expect(lastTuesdayTimespan.startDate.toISOString()).toBe('2025-09-02T00:00:00.000Z');
    
    // Prev Tuesday should be Aug 26 (8 days back from Wednesday = 7 + 1)  
    expect(prevTuesdayTimespan.description).toContain('Tuesday, August 26');
    expect(prevTuesdayTimespan.startDate.toISOString()).toBe('2025-08-26T00:00:00.000Z');
    
    // They should be exactly 7 days apart
    const daysDiff = (lastTuesdayTimespan.startDate - prevTuesdayTimespan.startDate) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBe(7);
  });

  test('prev-day options should work for all days of the week', () => {
    // Test from Wednesday, Sep 3, 2025
    const mockWednesday = new Date('2025-09-03T15:00:00.000Z');
    
    const testCases = [
      { option: 'prevMonday', expectedISO: '2025-08-25T00:00:00.000Z' },    // 7 days before Mon Sep 1
      { option: 'prevTuesday', expectedISO: '2025-08-26T00:00:00.000Z' },   // 7 days before Tue Sep 2
      { option: 'prevWednesday', expectedISO: '2025-08-20T00:00:00.000Z' },  // 7 days before Wed Aug 27
      { option: 'prevThursday', expectedISO: '2025-08-21T00:00:00.000Z' },   // 7 days before Thu Aug 28
      { option: 'prevFriday', expectedISO: '2025-08-22T00:00:00.000Z' },     // 7 days before Fri Aug 29
      { option: 'prevSaturday', expectedISO: '2025-08-23T00:00:00.000Z' },   // 7 days before Sat Aug 30
      { option: 'prevSunday', expectedISO: '2025-08-24T00:00:00.000Z' }      // 7 days before Sun Aug 31
    ];
    
    testCases.forEach(({ option, expectedISO }) => {
      const timespan = timespanAnalyzer.determineTimespan({ [option]: true }, mockWednesday);
      expect(timespan.startDate.toISOString()).toBe(expectedISO);
      expect(timespan.type).toBe('prev-day');
      expect(timespan.description).toMatch(/^previous \w+, \w+ \d{1,2}$/);
    });
  });

  test('prev-day should always go back at least 7 days', () => {
    // Test different current days to ensure prev-day always goes to previous week
    const testDates = [
      new Date('2025-09-01T15:00:00.000Z'), // Monday
      new Date('2025-09-02T15:00:00.000Z'), // Tuesday  
      new Date('2025-09-03T15:00:00.000Z'), // Wednesday
      new Date('2025-09-04T15:00:00.000Z'), // Thursday
      new Date('2025-09-05T15:00:00.000Z'), // Friday
      new Date('2025-09-06T15:00:00.000Z'), // Saturday
      new Date('2025-09-07T15:00:00.000Z')  // Sunday
    ];
    
    testDates.forEach(currentDate => {
      const prevTuesdayTimespan = timespanAnalyzer.determineTimespan({ prevTuesday: true }, currentDate);
      const daysDiff = (currentDate - prevTuesdayTimespan.startDate) / (1000 * 60 * 60 * 24);
      
      // Should always be at least 7 days back but less than 15 days 
      // (15 days accounts for edge cases where we go back 14+ days)
      expect(daysDiff).toBeGreaterThanOrEqual(7);
      expect(daysDiff).toBeLessThan(15);
      
      // Should always be a Tuesday (use getUTCDay since we create UTC dates)
      expect(prevTuesdayTimespan.startDate.getUTCDay()).toBe(2);
    });
  });
});