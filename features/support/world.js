const { setWorldConstructor } = require('@cucumber/cucumber');
const GitAnalysis = require('../../src/git-analysis');
const TimePeriods = require('../../src/time-periods');
const Timeline = require('../../src/timeline');
const Semantic = require('../../src/semantic');

class YdayWorld {
  constructor() {
    this.gitAnalysis = new GitAnalysis();
    this.timePeriods = new TimePeriods();
    this.timeline = new Timeline();
    this.semantic = new Semantic();
    
    // Test data storage
    this.lastSemanticResult = null;
    this.lastTimelineResult = null;
    this.lastCommits = null;
    this.lastTimeConfig = null;
    this.workspace = '/Users/jpb/workspace';
  }

  async getSemanticAnalysis(day) {
    const timeConfig = this.getDayTimeConfig(day);
    this.lastTimeConfig = timeConfig;
    this.lastCommits = await this.gitAnalysis.getCommits(this.workspace, timeConfig);
    this.lastSemanticResult = this.semantic.analyze(this.lastCommits);
    return this.lastSemanticResult;
  }

  async getTimelineAnalysis(day, showNumbers = true) {
    const timeConfig = this.getDayTimeConfig(day);
    const timelineTimeConfig = this.getTimelineTimeConfig(timeConfig);
    
    const commits = await this.gitAnalysis.getCommits(this.workspace, timelineTimeConfig);
    this.lastTimelineResult = this.timeline.generate(commits, timeConfig, showNumbers);
    return this.lastTimelineResult;
  }

  getDayTimeConfig(day) {
    const dayMap = {
      'tuesday': 'tuesday',
      'wednesday': 'wednesday', 
      'thursday': 'thursday',
      'friday': 'friday',
      'monday': 'monday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    };

    const normalizedDay = day.toLowerCase();
    if (dayMap[normalizedDay]) {
      return this.timePeriods.getLastDay(dayMap[normalizedDay]);
    }
    
    // Default to yesterday
    return this.timePeriods.getDaysBack(1);
  }

  getTimelineTimeConfig(timeConfig) {
    // Replicate the logic from src/index.js
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

  parseTimelineCount(character) {
    if (character === '·') return 0;
    if (character === '+') return 10;
    const num = parseInt(character);
    return isNaN(num) ? 0 : num;
  }
}

setWorldConstructor(YdayWorld);