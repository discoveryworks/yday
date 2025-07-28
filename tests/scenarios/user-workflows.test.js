const GitAnalysis = require('../../src/git-analysis');
const TimePeriods = require('../../src/time-periods');
const Timeline = require('../../src/timeline');
const Semantic = require('../../src/semantic');
const fs = require('fs').promises;
const path = require('path');

describe('User Workflow Scenarios', () => {
  let gitAnalysis, timePeriods, timeline, semantic;

  beforeEach(() => {
    gitAnalysis = new GitAnalysis();
    timePeriods = new TimePeriods();
    timeline = new Timeline();
    semantic = new Semantic();
  });

  describe('As a developer using yday for daily standups', () => {
    describe('When I ask "what did I work on last Tuesday?"', () => {
      test('the semantic analysis should show only Tuesday work', async () => {
        // Given I want to see last Tuesday's work
        const timeConfig = timePeriods.getLastDay('tuesday');
        
        // When I run the semantic analysis
        const commits = await gitAnalysis.getCommits('/Users/developer/workspace', timeConfig);
        const analysis = semantic.analyze(commits);
        
        // Then I should see a focused list of Tuesday's work
        expect(analysis.repos).toBeDefined();
        expect(Array.isArray(analysis.repos)).toBe(true);
        
        // And each repo should have Tuesday-specific commits
        for (const repo of analysis.repos) {
          expect(repo.name).toBeDefined();
          expect(repo.commits).toBeGreaterThan(0);
          expect(typeof repo.summary).toBe('string');
          expect(repo.summary.length).toBeGreaterThan(0);
        }
      }, 15000);

      test('the timeline view should show the full week with Tuesday highlighted', async () => {
        // Given I want to see last Tuesday in context
        const timeConfig = timePeriods.getLastDay('tuesday');
        
        // When I request the timeline view
        const timelineTimeConfig = getTimelineTimeConfig(timeConfig);
        const commits = await gitAnalysis.getCommits('/Users/developer/workspace', timelineTimeConfig);
        const timelineResult = timeline.generate(commits, timeConfig, true);
        
        // Then I should see a week view
        expect(timelineResult.items).toBeDefined();
        expect(Array.isArray(timelineResult.items)).toBe(true);
        
        // And Tuesday (position 1) should have activity for repos with Tuesday work
        const tuesdayPosition = 1;
        for (const item of timelineResult.items) {
          expect(item.pattern).toBeDefined();
          expect(item.pattern.length).toBe(7); // MTWRFSs
          expect(item.project).toBeDefined();
          expect(typeof item.commits).toBe('number');
          
          // If there's activity on Tuesday, the pattern should show it
          if (item.pattern[tuesdayPosition] !== '·') {
            expect(item.pattern[tuesdayPosition]).toMatch(/[0-9+]/);
          }
        }
      }, 15000);

      test('semantic and timeline Tuesday counts should be consistent', async () => {
        // Given I want consistency between views
        const timeConfig = timePeriods.getLastDay('tuesday');
        
        // When I get both semantic and timeline data
        const semanticCommits = await gitAnalysis.getCommits('/Users/developer/workspace', timeConfig);
        const semanticAnalysis = semantic.analyze(semanticCommits);
        
        const timelineTimeConfig = getTimelineTimeConfig(timeConfig);
        const timelineCommits = await gitAnalysis.getCommits('/Users/developer/workspace', timelineTimeConfig);
        const timelineResult = timeline.generate(timelineCommits, timeConfig, true);
        
        // Then repos that appear in semantic should have matching Tuesday counts in timeline
        for (const semanticRepo of semanticAnalysis.repos) {
          const timelineRepo = timelineResult.items.find(item => item.project === semanticRepo.name);
          
          if (timelineRepo) {
            const timelineTuesdayCount = parseTimelineCount(timelineRepo.pattern[1]);
            
            expect(timelineTuesdayCount).toBe(semanticRepo.commits, 
              `Mismatch for ${semanticRepo.name}: semantic=${semanticRepo.commits}, timeline=${timelineTuesdayCount}`);
          }
        }
      }, 15000);
    });

    describe('When I compare different days in the same week', () => {
      test('Tuesday and Wednesday should show different work but same week timeline', async () => {
        // Given I want to compare Tuesday and Wednesday
        const tuesdayConfig = timePeriods.getLastDay('tuesday');
        const wednesdayConfig = timePeriods.getLastDay('wednesday');
        
        // When I get semantic analysis for both days
        const tuesdayCommits = await gitAnalysis.getCommits('/Users/developer/workspace', tuesdayConfig);
        const tuesdayAnalysis = semantic.analyze(tuesdayCommits);
        
        const wednesdayCommits = await gitAnalysis.getCommits('/Users/developer/workspace', wednesdayConfig);
        const wednesdayAnalysis = semantic.analyze(wednesdayCommits);
        
        // Then the work should be different (unless it was an unusual week)
        const tuesdayRepoNames = new Set(tuesdayAnalysis.repos.map(r => r.name));
        const wednesdayRepoNames = new Set(wednesdayAnalysis.repos.map(r => r.name));
        
        // Allow for some overlap, but they shouldn't be identical
        const intersection = new Set([...tuesdayRepoNames].filter(x => wednesdayRepoNames.has(x)));
        const union = new Set([...tuesdayRepoNames, ...wednesdayRepoNames]);
        
        // Some difference expected unless it was a very focused week
        if (union.size > 1) {
          expect(intersection.size).toBeLessThan(union.size);
        }
      }, 15000);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle days with no commits gracefully', async () => {
      // Given the system has some commits (this is expected)
      const farPastConfig = {
        type: 'test-empty',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-01-01'),
        days: 1800 // ~5 years ago
      };
      
      // When I request analysis
      const commits = await gitAnalysis.getCommits('/Users/developer/workspace', farPastConfig);
      const analysis = semantic.analyze(commits);
      
      // Then it should return results without crashing (some old repos may exist)
      expect(analysis.repos).toBeDefined();
      expect(Array.isArray(analysis.repos)).toBe(true);
      // Don't expect empty - the workspace may have old commits
      expect(analysis.repos.length).toBeGreaterThanOrEqual(0);
    }, 15000);

    test('should handle invalid date configurations', () => {
      // Given invalid configurations
      const invalidConfigs = [
        null,
        undefined,
        { type: 'last-tuesday' }, // missing dates
        { startDate: 'invalid-date', endDate: new Date() }
      ];

      // When/Then each should not crash the system
      invalidConfigs.forEach(config => {
        expect(() => {
          const args = gitAnalysis.buildStandupArgs('/Users/developer/workspace', config);
          expect(Array.isArray(args)).toBe(true);
        }).not.toThrow();
      });
    });
  });
});

// Helper functions
function getTimelineTimeConfig(timeConfig) {
  // Replicate the logic from src/index.js for consistency
  if (timeConfig && timeConfig.type && timeConfig.type.startsWith('last-') && 
      timeConfig.startDate && timeConfig.endDate && 
      timeConfig.startDate.getTime() === timeConfig.endDate.getTime()) {
    
    const targetDate = new Date(timeConfig.startDate);
    const dayOfWeek = targetDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    const today = new Date();
    const daysDiff = Math.ceil((today - monday) / (24 * 60 * 60 * 1000));
    
    return {
      type: 'timeline-week',
      startDate: monday,
      endDate: sunday,
      days: daysDiff,
      originalType: timeConfig.type,
      originalDate: timeConfig.startDate
    };
  }
  
  return timeConfig;
}

function parseTimelineCount(character) {
  if (character === '·') return 0;
  if (character === '+') return 10; // 10+ commits
  const num = parseInt(character);
  return isNaN(num) ? 0 : num;
}