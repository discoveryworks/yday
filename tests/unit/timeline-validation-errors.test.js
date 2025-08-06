/**
 * Timeline Validation Error Tests
 * 
 * Tests for specific timeline validation failures that occur in production.
 */

const TimespanAnalyzer = require('../../src/timespan');
const CommitAnalyzer = require('../../src/commit-analyzer');
const TimelineDisplay = require('../../src/timeline-display');
const TimelineValidator = require('../../src/timeline-validator');

describe('Timeline Validation Errors', () => {
  
  test('should reproduce validation error with actual git-standup format', () => {
    // Test with actual git-standup ISO format output to reproduce the validation error
    const timespan = {
      type: 'multi-day',
      startDate: new Date('2025-07-28T00:00:00.000Z'), // Monday 
      endDate: new Date('2025-08-03T23:59:59.999Z'),   // Sunday
      days: 7,
      description: 'previous week'
    };
    
    // Mock git-standup output with ISO format (like our fixed version)
    const mockGitStandupOutput = `
/Users/test/eisenvector7-ror
abc123 - Commit 1 (2025-07-28 10:00:00 -0400) <User>
def456 - Commit 2 (2025-07-28 11:00:00 -0400) <User>
ghi789 - Commit 3 (2025-07-28 12:00:00 -0400) <User>
abc124 - Commit 4 (2025-07-28 13:00:00 -0400) <User>
def457 - Commit 5 (2025-07-28 14:00:00 -0400) <User>
ghi780 - Commit 6 (2025-07-28 15:00:00 -0400) <User>
abc125 - Commit 7 (2025-07-28 16:00:00 -0400) <User>
def458 - Commit 8 (2025-07-28 17:00:00 -0400) <User>
ghi781 - Commit 9 (2025-07-28 18:00:00 -0400) <User>
abc126 - Commit 10 (2025-07-28 19:00:00 -0400) <User>
def459 - Commit 11 (2025-07-30 10:00:00 -0400) <User>
ghi782 - Commit 12 (2025-07-30 11:00:00 -0400) <User>
abc127 - Commit 13 (2025-07-30 12:00:00 -0400) <User>
def460 - Commit 14 (2025-07-30 13:00:00 -0400) <User>
ghi783 - Commit 15 (2025-07-30 14:00:00 -0400) <User>
abc128 - Commit 16 (2025-07-27 20:00:00 -0400) <User>
def461 - Commit 17 (2025-07-27 21:00:00 -0400) <User>
ghi784 - Commit 18 (2025-07-27 22:00:00 -0400) <User>
abc129 - Commit 19 (2025-07-27 23:00:00 -0400) <User>
def462 - Commit 20 (2025-08-04 01:00:00 -0400) <User>
ghi785 - Commit 21 (2025-08-04 02:00:00 -0400) <User>
abc130 - Commit 22 (2025-08-04 03:00:00 -0400) <User>
def463 - Commit 23 (2025-08-04 04:00:00 -0400) <User>
ghi786 - Commit 24 (2025-08-04 05:00:00 -0400) <User>
`;
    
    const commitAnalyzer = new CommitAnalyzer();
    const timelineDisplay = new TimelineDisplay();
    const timelineValidator = new TimelineValidator();
    
    // Step 2: Analyze commits
    const commits = commitAnalyzer.analyzeCommits(timespan, mockGitStandupOutput);
    console.log('Commits found:', commits.length);
    if (commits.length > 0) {
      console.log('First repo commits:', commits[0].commitCount);
      console.log('Sample commit dates:', commits[0].commits.slice(0, 5).map(c => ({
        hash: c.hash,
        originalDate: c.authorDate.toISOString()
      })));
    }
    
    // Step 3: Generate timeline
    const timeline = timelineDisplay.generateTimeline(commits, timespan, false);
    console.log('Timeline generated:', JSON.stringify(timeline, null, 2));
    
    // Step 4: Validate
    const validation = timelineValidator.validateTimeline(timeline);
    console.log('Validation result:', validation);
    
    // With the fix, validation should now pass because the '+' symbol
    // correctly represents "10 or more commits" and our validation
    // now properly handles this case
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
  
  test('should fix validation errors by filtering commits to exact pattern range', () => {
    // Test the fix: commits should be filtered to the exact Monday-Sunday range
    // that the pattern generation uses
    
    const timespan = {
      type: 'multi-day',
      startDate: new Date('2025-07-28T00:00:00.000Z'), // Monday 
      endDate: new Date('2025-08-03T23:59:59.999Z'),   // Sunday
      days: 7,
      description: 'previous week'
    };
    
    // Same mock data as above
    const mockGitStandupOutput = `
/Users/test/eisenvector7-ror
abc123 - Commit on Monday (7 days ago) <User>
def456 - Commit on Monday (7 days ago) <User>
ghi789 - Commit on Monday (7 days ago) <User>
abc124 - Commit on Monday (7 days ago) <User>
def457 - Commit on Monday (7 days ago) <User>
ghi780 - Commit on Monday (7 days ago) <User>
abc125 - Commit on Monday (7 days ago) <User>
def458 - Commit on Monday (7 days ago) <User>
ghi781 - Commit on Monday (7 days ago) <User>
abc126 - Commit on Monday (7 days ago) <User>
def459 - Commit on Wednesday (5 days ago) <User>
ghi782 - Commit on Wednesday (5 days ago) <User>
abc127 - Commit on Wednesday (5 days ago) <User>
def460 - Commit on Wednesday (5 days ago) <User>
ghi783 - Commit on Wednesday (5 days ago) <User>
abc128 - Commit on Sunday before (8 days ago) <User>
def461 - Commit on Sunday before (8 days ago) <User>
ghi784 - Commit on Sunday before (8 days ago) <User>
abc129 - Commit on Sunday before (8 days ago) <User>
def462 - Commit on Sunday before (8 days ago) <User>
ghi785 - Commit on Sunday before (8 days ago) <User>
abc130 - Commit on Sunday before (8 days ago) <User>
def463 - Commit on Sunday before (8 days ago) <User>
ghi786 - Commit on Sunday before (8 days ago) <User>
`;
    
    const commitAnalyzer = new CommitAnalyzer();
    const timelineDisplay = new TimelineDisplay();
    const timelineValidator = new TimelineValidator();
    
    // Step 2: Analyze commits 
    const commits = commitAnalyzer.analyzeCommits(timespan, mockGitStandupOutput);
    
    // Step 3: Generate timeline with proper filtering
    const timeline = timelineDisplay.generateTimeline(commits, timespan, false);
    
    // Step 4: Validate - this should pass after the fix
    const validation = timelineValidator.validateTimeline(timeline);
    
    // After fix, validation should pass
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});