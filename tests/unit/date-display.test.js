/**
 * Test that date ranges are clearly displayed to users
 */

describe('Date Display Requirements', () => {
  test('output should show actual date ranges, not vague descriptions', async () => {
    // Run yday and capture output
    const { spawn } = require('child_process');
    const path = require('path');
    
    const ydayPath = path.join(__dirname, '../../bin/yday');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [ydayPath], { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yday exited with code ${code}: ${stderr}`));
          return;
        }
        
        console.log('Yday output:', stdout);
        
        // CRITICAL: Output must contain actual dates, not vague descriptions
        expect(stdout).not.toMatch(/\(recent work\)/);
        expect(stdout).not.toMatch(/\(yesterday\)/);
        expect(stdout).not.toMatch(/\(last week\)/);
        
        // Should contain actual date information (either ISO format OR month name format)
        const hasISODate = /\d{4}-\d{2}-\d{2}/.test(stdout);
        const hasMonthDate = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/.test(stdout);
        
        expect(hasISODate || hasMonthDate).toBe(true);
        
        resolve();
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }, 10000);
  
  test('timeline output should show week dates clearly', async () => {
    const { spawn } = require('child_process');
    const path = require('path');
    
    const ydayPath = path.join(__dirname, '../../bin/yday');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [ydayPath, '-a'], { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yday -a exited with code ${code}`));
          return;
        }
        
        console.log('Timeline output:', stdout);
        
        // Should show specific week dates
        expect(stdout).toMatch(/week beginning (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/);
        
        resolve();
      });
    });
  }, 10000);
});