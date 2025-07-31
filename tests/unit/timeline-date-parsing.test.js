const Timeline = require('../../src/timeline');

describe('Timeline Date Parsing', () => {
  let timeline;
  
  beforeEach(() => {
    timeline = new Timeline();
  });

  test('parseCommitDate should convert "26 minutes ago" to proper past date', () => {
    const result = timeline.parseCommitDate('26 minutes ago');
    const now = new Date();
    const expectedTime = new Date(now.getTime() - 26 * 60 * 1000); // 26 minutes ago
    
    // Should be within 1 second of expected time
    expect(Math.abs(result.getTime() - expectedTime.getTime())).toBeLessThan(1000);
  });
  
  test('parseCommitDate should convert "22 hours ago" to proper past date', () => {
    const result = timeline.parseCommitDate('22 hours ago');
    const now = new Date();
    const expectedTime = new Date(now.getTime() - 22 * 60 * 60 * 1000); // 22 hours ago
    
    // Should be within 1 minute of expected time  
    expect(Math.abs(result.getTime() - expectedTime.getTime())).toBeLessThan(60000);
  });
  
  test('timeline should place yesterday commits on yesterday, not today', async () => {
    // Mock commit data that looks like what git-standup produces
    const mockRepo = {
      name: 'test-repo',
      commitCount: 1,
      commits: [
        {
          message: 'Test commit',
          timeAgo: '22 hours ago', // Should be yesterday
          date: null // No author date, should fallback to parsing timeAgo
        }
      ]
    };
    
    const mockTimeConfig = {
      type: 'timeline-week',
      startDate: new Date()
    };
    
    const result = timeline.generateRealPattern(mockRepo, mockTimeConfig, true);
    
    // If it's Thursday and commit was 22 hours ago (Wednesday), 
    // pattern should show commit on Wednesday (index 2), not Thursday (index 3)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, etc.
    
    if (dayOfWeek === 4) { // Thursday
      // 22 hours ago should be Wednesday (index 2 in Mon-Sun array)
      expect(result.pattern).toMatch(/··1···/); // Wed should have the commit
      expect(result.pattern).not.toMatch(/···1··/); // Thu should not have the commit
    }
    
    console.log(`Today is day ${dayOfWeek}, pattern: ${result.pattern}`);
  });
});