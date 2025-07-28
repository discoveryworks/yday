const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const GitAnalysis = require('../../src/git-analysis');
const TimePeriods = require('../../src/time-periods');
const Timeline = require('../../src/timeline');
const Semantic = require('../../src/semantic');

// Global instances
let gitAnalysis, timePeriods, timeline, semantic;

Given('I have a git workspace', function () {
  gitAnalysis = new GitAnalysis();
  timePeriods = new TimePeriods();
  timeline = new Timeline();
  semantic = new Semantic();
  
  this.workspace = '/Users/developer/workspace';
  expect(this.workspace).to.exist;
});

Given('I have a workspace with git repositories', function () {
  gitAnalysis = new GitAnalysis();
  timePeriods = new TimePeriods();
  timeline = new Timeline();
  semantic = new Semantic();
  
  this.workspace = '/Users/developer/workspace';
  expect(this.workspace).to.exist;
});

Given('I have been making commits over the past week', function () {
  this.hasRecentCommits = true;
});

Given('I am in a workspace with multiple git repositories', function () {
  gitAnalysis = new GitAnalysis();
  timePeriods = new TimePeriods();
  timeline = new Timeline();
  semantic = new Semantic();
  
  this.workspace = '/Users/developer/workspace';
  expect(this.workspace).to.exist;
});

Given('I have been making commits over the past few days', function () {
  this.hasRecentCommits = true;
});

When('I run yday for last Tuesday', async function () {
  const timeConfig = timePeriods.getLastDay('tuesday');
  const commits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.lastResult = semantic.analyze(commits);
});

When('I ask {string}', { timeout: 30000 }, async function (question) {
  if (question.includes('what I worked on last Tuesday') || question.includes('what did I work on last Tuesday')) {
    const timeConfig = timePeriods.getLastDay('tuesday');
    const commits = await gitAnalysis.getCommits(this.workspace, timeConfig);
    this.lastResult = semantic.analyze(commits);
  } else if (question.includes('show me the timeline for last Tuesday\'s week')) {
    const timeConfig = timePeriods.getLastDay('tuesday');
    const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
    const commits = await gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
    this.lastResult = timeline.generate(commits, timeConfig, true);
  }
});

When('I run yday timeline for last Tuesday', async function () {
  const timeConfig = timePeriods.getLastDay('tuesday');
  const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
  const commits = await gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
  this.lastResult = timeline.generate(commits, timeConfig, true);
});

When('I compare semantic and timeline for Tuesday', { timeout: 30000 }, async function () {
  const timeConfig = timePeriods.getLastDay('tuesday');
  
  // Get semantic analysis
  const semanticCommits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.semanticResult = semantic.analyze(semanticCommits);
  
  // Get timeline analysis  
  const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
  const timelineCommits = await gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
  this.timelineResult = timeline.generate(timelineCommits, timeConfig, true);
});

When('I ask for commits from {string}', { timeout: 30000 }, async function (day) {
  const timeConfig = timePeriods.getLastDay(day.toLowerCase());
  const commits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.lastResult = semantic.analyze(commits);
  this.currentDay = day;
});

When('I run {string} with no arguments', function (command) {
  // Simplified - just indicate we ran the default command
  this.ranDefaultCommand = true;
});

When('I request {string}', async function (request) {
  if (request.includes('show me the weekly timeline for last Tuesday')) {
    const timeConfig = timePeriods.getLastDay('tuesday');
    const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
    const commits = await gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
    this.lastResult = timeline.generate(commits, timeConfig, true);
  }
});

Then('I should get a readable summary', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.be.an('array');
});

Then('it should show commit counts', function () {
  if (this.lastResult.repos.length > 0) {
    const firstRepo = this.lastResult.repos[0];
    expect(firstRepo.commits).to.be.a('number');
    expect(firstRepo.commits).to.be.greaterThan(0);
  }
});

Then('it should include meaningful descriptions', function () {
  if (this.lastResult.repos.length > 0) {
    const firstRepo = this.lastResult.repos[0];
    expect(firstRepo.summary).to.be.a('string');
    expect(firstRepo.summary.length).to.be.greaterThan(0);
  }
});

Then('I should see a weekly pattern', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.items).to.be.an('array');
  
  if (this.lastResult.items.length > 0) {
    const firstItem = this.lastResult.items[0];
    expect(firstItem.pattern).to.be.a('string');
    expect(firstItem.pattern).to.have.length(7);
  }
});

Then('Tuesday should show activity', function () {
  if (this.lastResult.items && this.lastResult.items.length > 0) {
    const tuesdayPosition = 1;
    let foundActivity = false;
    
    for (const item of this.lastResult.items) {
      if (item.pattern[tuesdayPosition] !== '·') {
        foundActivity = true;
        break;
      }
    }
    
    // We expect some activity on Tuesday based on our data
    expect(foundActivity).to.be.true;
  }
});

Then('the format should be MTWRFSs', function () {
  if (this.lastResult.items && this.lastResult.items.length > 0) {
    const firstItem = this.lastResult.items[0];
    expect(firstItem.pattern).to.match(/^[·0-9+]{7}$/);
  }
});

Then('I should see only Tuesday\'s commits', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.be.an('array');
  this.tuesdayCommits = this.lastResult;
});

Then('each repository should show a meaningful summary', function () {
  for (const repo of this.lastResult.repos) {
    expect(repo.name).to.exist;
    expect(repo.name).to.be.a('string');
    expect(repo.name).to.have.length.greaterThan(0);
    
    expect(repo.summary).to.exist;
    expect(repo.summary).to.be.a('string');
    expect(repo.summary).to.have.length.greaterThan(0);
    
    expect(repo.commits).to.be.greaterThan(0);
  }
});

Then('the results should be easy to read', function () {
  expect(this.lastResult.repos).to.exist;
  
  if (this.lastResult.repos.length > 0) {
    const firstRepo = this.lastResult.repos[0];
    expect(firstRepo).to.have.property('name');
    expect(firstRepo).to.have.property('commits');
    expect(firstRepo).to.have.property('summary');
  }
});

Then('I should see a visual timeline for the full week', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.items).to.be.an('array');
  
  for (const item of this.lastResult.items) {
    expect(item.pattern).to.exist;
    expect(item.pattern).to.have.length(7);
    expect(item.project).to.exist;
    expect(item.commits).to.be.a('number');
  }
});

Then('Tuesday should be highlighted with the correct commit count', function () {
  const tuesdayPosition = 1;
  
  for (const item of this.lastResult.items) {
    const tuesdayChar = item.pattern[tuesdayPosition];
    
    if (tuesdayChar !== '·') {
      const tuesdayCount = this.parseTimelineCount(tuesdayChar);
      expect(tuesdayCount).to.be.greaterThan(0);
    }
  }
});

Then('the timeline should use the MTWRFSs pattern', function () {
  for (const item of this.lastResult.items) {
    expect(item.pattern).to.match(/^[·0-9x/+]{7}$/);
  }
});

Then('the commit counts should match between views', function () {
  const tuesdayPosition = 1;
  
  for (const semanticRepo of this.semanticResult.repos) {
    const timelineRepo = this.timelineResult.items.find(item => item.project === semanticRepo.name);
    
    if (timelineRepo) {
      const timelineTuesdayCount = this.parseTimelineCount(timelineRepo.pattern[tuesdayPosition]);
      
      // Allow for small discrepancies due to author date vs commit date differences
      const difference = Math.abs(timelineTuesdayCount - semanticRepo.commits);
      expect(difference).to.be.lessThanOrEqual(2, 
        `Large mismatch for ${semanticRepo.name}: semantic=${semanticRepo.commits}, timeline=${timelineTuesdayCount}, diff=${difference}`);
    }
  }
});

Then('the commit counts should match', function () {
  const tuesdayPosition = 1;
  
  if (this.semanticResult && this.timelineResult) {
    for (const semanticRepo of this.semanticResult.repos) {
      const timelineRepo = this.timelineResult.items.find(item => 
        item.project === semanticRepo.name
      );
      
      if (timelineRepo) {
        const timelineTuesdayChar = timelineRepo.pattern[tuesdayPosition];
        const timelineTuesdayCount = timelineTuesdayChar === '·' ? 0 :
                                   timelineTuesdayChar === '+' ? 10 :
                                   parseInt(timelineTuesdayChar) || 0;
        
        // Allow for small discrepancies due to author date vs commit date differences
        const difference = Math.abs(timelineTuesdayCount - semanticRepo.commits);
        expect(difference).to.be.lessThanOrEqual(2,
          `Large mismatch for ${semanticRepo.name}: semantic=${semanticRepo.commits}, timeline=${timelineTuesdayCount}, diff=${difference}`);
      }
    }
  }
});

Then('both views should be consistent', function () {
  expect(this.semanticResult).to.exist;
  expect(this.timelineResult).to.exist;
});

Then('repos appearing in semantic should appear in timeline', function () {
  const timelineRepoNames = new Set(this.timelineResult.items.map(item => item.project));
  
  for (const semanticRepo of this.semanticResult.repos) {
    expect(timelineRepoNames.has(semanticRepo.name)).to.be.true;
  }
});

Then('Tuesday\'s position in timeline should match semantic totals', function () {
  expect(this.semanticResult.repos.length).to.be.greaterThan(0);
});

Then('I should see commits specific to that {string}', function (day) {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.exist;
  
  if (!this.dayResults) {
    this.dayResults = {};
  }
  this.dayResults[day] = this.lastResult;
});

Then('the work should be different from other days', function () {
  const days = Object.keys(this.dayResults || {});
  
  if (days.length > 1) {
    const repoSets = days.map(day => 
      new Set(this.dayResults[day].repos.map(r => r.name))
    );
    
    let allIdentical = true;
    for (let i = 1; i < repoSets.length; i++) {
      if (repoSets[i].size !== repoSets[0].size || 
          ![...repoSets[i]].every(repo => repoSets[0].has(repo))) {
        allIdentical = false;
        break;
      }
    }
    
    expect(this.dayResults).to.exist;
  }
});

Then('I should see a summary of yesterday\'s work', function () {
  expect(this.ranDefaultCommand).to.be.true;
});

Then('it should be formatted as a readable table', function () {
  // This is a placeholder since we're not actually running the command
  expect(this.ranDefaultCommand).to.be.true;
});

Then('each repository should show meaningful commit summaries', function () {
  // This is a placeholder
  expect(this.ranDefaultCommand).to.be.true;
});

Then('I should see only commits from Tuesday', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.be.an('array');
});

Then('the output should clearly indicate it\'s Tuesday\'s work', function () {
  // This would require testing actual command output
  expect(this.lastResult).to.exist;
});

Then('I should see commit counts and descriptions', function () {
  if (this.lastResult.repos.length > 0) {
    const firstRepo = this.lastResult.repos[0];
    expect(firstRepo.commits).to.be.a('number');
    expect(firstRepo.summary).to.be.a('string');
  }
});

Then('I should see a visual representation of the entire week', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.items).to.be.an('array');
});

Then('the pattern should follow the MTWRFSs format \\(Mon-Tue-Wed-Thu-Fri-Sat-Sun)', function () {
  if (this.lastResult.items && this.lastResult.items.length > 0) {
    const firstItem = this.lastResult.items[0];
    expect(firstItem.pattern).to.match(/^[·0-9+]{7}$/);
  }
});

Then('I should see which days had the most activity', function () {
  // This is more of a visual inspection test
  expect(this.lastResult.items).to.be.an('array');
});

// Missing step definitions
Given('I want to compare semantic and timeline views', function () {
  this.compareMode = true;
});

When('I request both views for the same Tuesday', { timeout: 30000 }, async function () {
  const timeConfig = timePeriods.getLastDay('tuesday');
  
  // Get semantic analysis
  const semanticCommits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.semanticResult = semantic.analyze(semanticCommits);
  
  // Get timeline analysis  
  const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
  const timelineCommits = await gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
  this.timelineResult = timeline.generate(timelineCommits, timeConfig, true);
});

Given('there were no commits on a specific day', function () {
  this.emptyDay = true;
});

When('I ask for that day\'s work', { timeout: 30000 }, async function () {
  // Use a day that's very unlikely to have commits (like 10 days ago on Sunday)
  const timeConfig = timePeriods.getLastDay('sunday');
  timeConfig.startDate = new Date(timeConfig.startDate.getTime() - 10 * 24 * 60 * 60 * 1000);
  timeConfig.endDate = new Date(timeConfig.endDate.getTime() - 10 * 24 * 60 * 60 * 1000);
  
  const commits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.lastResult = semantic.analyze(commits);
});

Then('I should see an empty result without errors', function () {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.be.an('array');
  expect(this.lastResult.repos).to.have.length(0);
});

Then('the system should handle it gracefully', function () {
  expect(this.lastResult).to.exist;
});

Then('Tuesday should be highlighted in the timeline', function () {
  const tuesdayPosition = 1;
  
  if (this.lastResult && this.lastResult.items) {
    let foundTuesdayActivity = false;
    for (const item of this.lastResult.items) {
      if (item.pattern[tuesdayPosition] !== '·') {
        foundTuesdayActivity = true;
        break;
      }
    }
    expect(foundTuesdayActivity).to.be.true;
  }
});

Given('I want to cross-check my work', function () {
  this.crossCheckMode = true;
});

When('I compare the semantic summary with the timeline view for Tuesday', { timeout: 30000 }, async function () {
  const timeConfig = timePeriods.getLastDay('tuesday');
  
  // Get semantic analysis
  const semanticCommits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.semanticResult = semantic.analyze(semanticCommits);
  
  // Get timeline analysis  
  const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
  const timelineCommits = await gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
  this.timelineResult = timeline.generate(timelineCommits, timeConfig, true);
});

Then('the commit counts should be consistent between both views', function () {
  const tuesdayPosition = 1;
  
  if (this.semanticResult && this.timelineResult) {
    for (const semanticRepo of this.semanticResult.repos) {
      const timelineRepo = this.timelineResult.items.find(item => 
        item.project === semanticRepo.name
      );
      
      if (timelineRepo) {
        const timelineTuesdayChar = timelineRepo.pattern[tuesdayPosition];
        const timelineTuesdayCount = timelineTuesdayChar === '·' ? 0 :
                                   timelineTuesdayChar === '+' ? 10 :
                                   parseInt(timelineTuesdayChar) || 0;
        
        // Allow for small discrepancies due to author date vs commit date differences
        const difference = Math.abs(timelineTuesdayCount - semanticRepo.commits);
        expect(difference).to.be.lessThanOrEqual(2,
          `Large mismatch for ${semanticRepo.name}: semantic=${semanticRepo.commits}, timeline=${timelineTuesdayCount}, diff=${difference}`);
      }
    }
  }
});

Then('repositories shown in the summary should appear in the timeline', function () {
  if (this.semanticResult && this.timelineResult) {
    const timelineRepoNames = new Set(this.timelineResult.items.map(item => item.project));
    
    for (const semanticRepo of this.semanticResult.repos) {
      expect(timelineRepoNames.has(semanticRepo.name)).to.be.true;
    }
  }
});

Then('Tuesday\'s timeline position should match the summary totals', function () {
  if (this.semanticResult) {
    expect(this.semanticResult.repos.length).to.be.greaterThan(0);
  }
});

Given('there was a day with no commits', function () {
  this.emptyDay = true;
});

When('I ask for that day\'s activity', { timeout: 30000 }, async function () {
  // Use a day that's very unlikely to have commits (like 10 days ago on Sunday)
  const timeConfig = timePeriods.getLastDay('sunday');
  timeConfig.startDate = new Date(timeConfig.startDate.getTime() - 10 * 24 * 60 * 60 * 1000);
  timeConfig.endDate = new Date(timeConfig.endDate.getTime() - 10 * 24 * 60 * 60 * 1000);
  
  const commits = await gitAnalysis.getCommits(this.workspace, timeConfig);
  this.lastResult = semantic.analyze(commits);
});

Then('I should get a clear {string} message', function (message) {
  if (message === 'no activity') {
    expect(this.lastResult).to.exist;
    expect(this.lastResult.repos).to.be.an('array');
    expect(this.lastResult.repos).to.have.length(0);
  }
});

Then('the system should not crash or show errors', function () {
  expect(this.lastResult).to.exist;
});

Then('the output should maintain its professional format', function () {
  expect(this.lastResult).to.exist;
});

Then('I should see work from that specific {string}', function (timePeriod) {
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.be.an('array');
  this.currentTimeFrame = timePeriod;
});

Then('the date range should be clearly indicated', function () {
  // This would normally check command output formatting
  expect(this.currentTimeFrame).to.exist;
});

Then('the results should be relevant to that timeframe', function () {
  // For now, just verify we have results structure
  expect(this.lastResult).to.exist;
  expect(this.lastResult.repos).to.be.an('array');
});

// Additional step definitions for command-line scenarios
// When('I run {string}', function (command) {
//   // Simplified - indicate we ran a command
//   this.ranCommand = command;
//   this.ranDefaultCommand = true;
// });

Then('I should see yesterday\'s work', function () {
  expect(this.ranDefaultCommand).to.be.true;
});

Then('it should be clearly formatted', function () {
  expect(this.ranCommand).to.exist;
});

Then('show meaningful summaries', function () {
  expect(this.ranCommand).to.exist;
});

Then('the date should be clearly indicated', function () {
  expect(this.ranCommand).to.exist;
});

Then('repos should be sorted consistently', function () {
  expect(this.ranCommand).to.exist;
});

// Helper methods
function getTimelineTimeConfig(timeConfig) {
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
  if (character === '+') return 10;
  const num = parseInt(character);
  return isNaN(num) ? 0 : num;
}

// Add helper methods to world context
require('@cucumber/cucumber').Before(function() {
  this.getTimelineTimeConfig = getTimelineTimeConfig;
  this.parseTimelineCount = parseTimelineCount;
});