/**
 * Timeline Header Format Tests
 * 
 * Ensures timeline output includes proper directory and time information
 */

describe('Timeline Header Format', () => {
  
  test('timeline output should include directory and time description', async () => {
    const { spawn } = require('child_process');
    const path = require('path');
    
    const ydayPath = path.join(__dirname, '../../bin/yday');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [ydayPath, '-a'], { 
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
          reject(new Error(`yday -a exited with code ${code}: ${stderr}`));
          return;
        }
        
        // Should include the directory being scanned
        expect(stdout).toMatch(/### Alastair timeline in `[^`]+`/);
        
        // Should include the week period
        expect(stdout).toMatch(/Week beginning (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/);
        
        // Should include a time description in parentheses
        expect(stdout).toMatch(/\([^)]+\)/);
        
        // Full format should match the expected pattern
        expect(stdout).toMatch(/### Alastair timeline in `[^`]+` for Week beginning .+ \([^)]+\)/);
        
        resolve();
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }, 15000);

  test('timeline output with --prev should show previous week information', async () => {
    const { spawn } = require('child_process');
    const path = require('path');
    
    const ydayPath = path.join(__dirname, '../../bin/yday');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [ydayPath, '-a', '--prev'], { 
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
          reject(new Error(`yday -a --prev exited with code ${code}: ${stderr}`));
          return;
        }
        
        // Should include the directory being scanned
        expect(stdout).toMatch(/### Alastair timeline in `[^`]+`/);
        
        // Should include "previous week" in the description
        expect(stdout).toMatch(/\(previous week\)/);
        
        // Should show a week from the past (not current week)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // The header should contain year information and it should be reasonable
        expect(stdout).toMatch(new RegExp(`Week beginning .+, \\d{4}`));
        
        resolve();
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }, 15000);

  test('timeline output should be consistent with semantic output format', async () => {
    const { spawn } = require('child_process');
    const path = require('path');
    
    const ydayPath = path.join(__dirname, '../../bin/yday');
    
    // Test semantic output format
    const semanticOutput = await new Promise((resolve, reject) => {
      const child = spawn('node', [ydayPath], { 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yday exited with code ${code}`));
          return;
        }
        resolve(stdout);
      });
      
      child.on('error', reject);
    });
    
    // Test timeline output format
    const timelineOutput = await new Promise((resolve, reject) => {
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
        resolve(stdout);
      });
      
      child.on('error', reject);
    });
    
    // Both should start with "###" markdown headers
    expect(semanticOutput).toMatch(/^### /);
    expect(timelineOutput).toMatch(/^### /);
    
    // Both should include the directory in backticks
    const semanticDir = semanticOutput.match(/in `([^`]+)`/);
    const timelineDir = timelineOutput.match(/in `([^`]+)`/);
    
    expect(semanticDir).toBeTruthy();
    expect(timelineDir).toBeTruthy();
    
    // Should scan the same directory
    expect(semanticDir[1]).toBe(timelineDir[1]);
    
    // Both should include time descriptions in parentheses
    expect(semanticOutput).toMatch(/\([^)]+\)/);
    expect(timelineOutput).toMatch(/\([^)]+\)/);
  }, 15000);
});