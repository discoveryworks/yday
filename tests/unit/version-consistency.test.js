const { version } = require('../../package.json');
const { spawn } = require('child_process');

describe('Version Consistency', () => {
  test('CLI --version should match package.json version', (done) => {
    const child = spawn('node', ['bin/yday', '--version'], { cwd: process.cwd() });
    let stdout = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(stdout.trim()).toBe(version);
      done();
    });
    
    child.on('error', (error) => {
      done(error);
    });
  });
  
  test('package.json version should follow semantic versioning', () => {
    // SemVer regex pattern
    const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    
    expect(version).toMatch(semverPattern);
    
    // Since we're in early development, should be 0.x.x
    expect(version.startsWith('0.')).toBe(true);
  });
  
  test('version should be a string', () => {
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});