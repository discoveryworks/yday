const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const fs = require('fs');

Given('the system is ready', function () {
  this.systemReady = true;
});

When('I check if yday exists', function () {
  this.ydayExists = fs.existsSync('./bin/yday');
});

Then('it should be available', function () {
  expect(this.systemReady).to.be.true;
  expect(this.ydayExists).to.be.true;
});