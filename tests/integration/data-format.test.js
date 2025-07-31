const GitLogParser = require('../../scripts/parse_gitlog');
const GitAnalysis = require('../../src/git-analysis');
const Semantic = require('../../src/semantic');
const fs = require('fs');
const path = require('path');

describe('Data Format Integration', () => {
  test('GitLogParser and GitAnalysis should produce compatible data formats', () => {
    // Load our Rails fixture data
    const fixturePath = path.join(__dirname, '../fixtures/rails_sample.gitlog');
    const gitlogContent = fs.readFileSync(fixturePath, 'utf8');
    
    // Parse with GitLogParser (used in BDD tests)
    const parser = new GitLogParser();
    const fixtureData = parser.parse(gitlogContent);
    
    // This is what semantic.js expects based on BDD tests
    console.log('Fixture data structure:', JSON.stringify(fixtureData.repos[0], null, 2));
    
    // Test semantic analysis with fixture data
    const semantic = new Semantic();
    const fixtureAnalysis = semantic.analyze(fixtureData);
    
    expect(fixtureAnalysis.repos).toBeDefined();
    expect(fixtureAnalysis.repos.length).toBeGreaterThan(0);
    
    // This should NOT fail, but currently does because the data formats don't match
    const railsRepo = fixtureAnalysis.repos.find(r => r.name === 'rails');
    expect(railsRepo).toBeDefined();
    expect(railsRepo.commits).toBe(6); // Should find 6 Rails commits
  });
});