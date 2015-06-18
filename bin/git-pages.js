#!/usr/bin/env node

/* global process, require */
/* eslint new-cap: 0 */
/* eslint no-console: 0 */
require('lazy-ass');
var check = require('check-more-types');
var pkg = require('../package.json');
require('update-notifier')({
  packageName: pkg.name,
  packageVersion: pkg.version
}).notify();

var nopt = require('nopt');
var knownOptions = {
  repo: [String, null],
  branch: [String, 'master'],
  index: [String, 'index.html'],
  help: Boolean
};
var shortHands = {
  r: ['--repo'],
  b: ['--branch'],
  i: ['--index'],
  p: ['--index'],
  h: ['--help']
}
var cliOptions = nopt(knownOptions, shortHands, process.argv);
if (cliOptions.help) {
  console.log('%s@%s - %s', pkg.name, pkg.version, pkg.description);
  process.exit(0);
}

var gitPages = require('..');
gitPages(cliOptions);


