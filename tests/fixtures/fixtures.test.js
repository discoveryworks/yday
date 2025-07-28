const fs = require('fs').promises;
const path = require('path');
const GitAnalysis = require('../../src/git-analysis');

describe('Test Fixtures Validation', () => {
  let gitAnalysis;

  beforeEach(() => {
    gitAnalysis = new GitAnalysis();
  });

  describe('Git-standup fixture files', () => {
    test('should contain valid git-standup output format', async () => {
      const fixtureFiles = [
        'git-standup-week.txt',
        'git-standup-tuesday-only.txt'
      ];

      for (const filename of fixtureFiles) {
        const fixturePath = path.join(__dirname, filename);
        const content = await fs.readFile(fixturePath, 'utf8');

        // Should have repository headers
        expect(content).toMatch(/^\/.*\/[^/]+$/m);
        
        // Should have commit lines
        expect(content).toMatch(/^[a-f0-9]+.*\s-\s/m);
        
        // Should be parseable by our parser
        const mockTimeConfig = { type: 'test', days: 7 };
        const result = gitAnalysis.parseStandupOutput(content, '/Users/developer/workspace', mockTimeConfig);
        
        expect(result.repos).toBeDefined();
        expect(Array.isArray(result.repos)).toBe(true);
        expect(result.repos.length).toBeGreaterThan(0);
      }
    });

    test('week fixture should contain more repos than tuesday-only fixture', async () => {
      const weekPath = path.join(__dirname, 'git-standup-week.txt');
      const tuesdayPath = path.join(__dirname, 'git-standup-tuesday-only.txt');

      const weekContent = await fs.readFile(weekPath, 'utf8');
      const tuesdayContent = await fs.readFile(tuesdayPath, 'utf8');

      const mockTimeConfig = { type: 'test', days: 7 };
      
      const weekResult = gitAnalysis.parseStandupOutput(weekContent, '/Users/developer/workspace', mockTimeConfig);
      const tuesdayResult = gitAnalysis.parseStandupOutput(tuesdayContent, '/Users/developer/workspace', mockTimeConfig);

      expect(weekResult.repos.length).toBeGreaterThanOrEqual(tuesdayResult.repos.length);
      
      // Tuesday repos should be a subset of week repos
      const weekRepoNames = new Set(weekResult.repos.map(r => r.name));
      const tuesdayRepoNames = new Set(tuesdayResult.repos.map(r => r.name));

      for (const tuesdayRepo of tuesdayRepoNames) {
        expect(weekRepoNames.has(tuesdayRepo)).toBe(true);
      }
    });

    test('fixtures should have consistent date formats', async () => {
      const weekPath = path.join(__dirname, 'git-standup-week.txt');
      const content = await fs.readFile(weekPath, 'utf8');

      const mockTimeConfig = { type: 'test', days: 7 };
      const result = gitAnalysis.parseStandupOutput(content, '/Users/developer/workspace', mockTimeConfig);

      // Check that all commits have valid dates
      for (const repo of result.repos) {
        for (const commit of repo.commits) {
          expect(commit.date).toBeDefined();
          expect(commit.date).toBeInstanceOf(Date);
          expect(commit.date.getTime()).not.toBeNaN();
          
          // Should be a reasonable date (not too far in past or future)
          const now = new Date();
          const daysDiff = Math.abs(now - commit.date) / (24 * 60 * 60 * 1000);
          expect(daysDiff).toBeLessThan(365); // Within a year
        }
      }
    });
  });

  describe('Expected results validation', () => {
    test('expected-results.json should be valid JSON with required structure', async () => {
      const expectedPath = path.join(__dirname, '../expected-results.json');
      const content = await fs.readFile(expectedPath, 'utf8');
      
      const expected = JSON.parse(content);

      // Should have required sections
      expect(expected.lastTuesdayScenarios).toBeDefined();
      expect(expected.lastTuesdayScenarios.semantic).toBeDefined();
      expect(expected.lastTuesdayScenarios.timeline).toBeDefined();
      expect(expected.consistency).toBeDefined();

      // Semantic section should have expected repos
      expect(Array.isArray(expected.lastTuesdayScenarios.semantic.expectedRepos)).toBe(true);
      expect(expected.lastTuesdayScenarios.semantic.expectedRepos.length).toBeGreaterThan(0);

      // Each expected repo should have required fields
      for (const repo of expected.lastTuesdayScenarios.semantic.expectedRepos) {
        expect(repo.name).toBeDefined();
        expect(typeof repo.commits).toBe('number');
        expect(repo.commits).toBeGreaterThan(0);
        expect(typeof repo.summary).toBe('string');
      }

      // Timeline section should have patterns
      expect(typeof expected.lastTuesdayScenarios.timeline.expectedPatterns).toBe('object');
      
      // Consistency section should have expected matches
      expect(Array.isArray(expected.consistency.expected_matches)).toBe(true);
    });

    test('expected results should be consistent with fixture data', async () => {
      const expectedPath = path.join(__dirname, '../expected-results.json');
      const tuesdayFixturePath = path.join(__dirname, 'git-standup-tuesday-only.txt');

      const expected = JSON.parse(await fs.readFile(expectedPath, 'utf8'));
      const fixtureContent = await fs.readFile(tuesdayFixturePath, 'utf8');

      const mockTimeConfig = { 
        type: 'test-no-filter',
        days: 6
      };

      const result = gitAnalysis.parseStandupOutput(fixtureContent, '/Users/developer/workspace', mockTimeConfig);

      // The fixture should contain all expected repos
      const fixtureRepoNames = new Set(result.repos.map(r => r.name));
      const expectedRepoNames = new Set(expected.lastTuesdayScenarios.semantic.expectedRepos.map(r => r.name));

      for (const expectedRepo of expectedRepoNames) {
        expect(fixtureRepoNames.has(expectedRepo)).toBe(true, 
          `Expected repo ${expectedRepo} not found in fixture. Available: ${Array.from(fixtureRepoNames).join(', ')}`);
      }
    });
  });

  describe('Live vs Fixture consistency check', () => {
    test('our fixtures should represent real git-standup behavior', async () => {
      // This test validates that our fixtures aren't too far from reality
      const weekFixturePath = path.join(__dirname, 'git-standup-week.txt');
      const fixtureContent = await fs.readFile(weekFixturePath, 'utf8');

      const mockTimeConfig = { type: 'test', days: 7 };
      const fixtureResult = gitAnalysis.parseStandupOutput(fixtureContent, '/Users/developer/workspace', mockTimeConfig);

      // Fixture should have reasonable data
      expect(fixtureResult.repos.length).toBeGreaterThan(0);
      expect(fixtureResult.repos.length).toBeLessThan(50); // Not too many

      // Should have reasonable commit distribution
      const totalCommits = fixtureResult.repos.reduce((sum, repo) => sum + repo.commits.length, 0);
      expect(totalCommits).toBeGreaterThan(5);
      expect(totalCommits).toBeLessThan(200);

      // Should have some repos with multiple commits
      const reposWithMultipleCommits = fixtureResult.repos.filter(repo => repo.commits.length > 1);
      expect(reposWithMultipleCommits.length).toBeGreaterThan(0);
    });
  });
});