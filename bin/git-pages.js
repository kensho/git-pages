#!/usr/bin/env node

/* global process, require */
/* eslint new-cap: 0 */
/* eslint no-console: 0 */
require('lazy-ass');
var check = require('check-more-types');
var R = require('ramda');
var pkg = require('../package.json');
console.log('%s@%s - %s', pkg.name, pkg.version, pkg.description);

require('update-notifier')({
  packageName: pkg.name,
  packageVersion: pkg.version
}).notify();

var nopt = require('nopt');
var knownOptions = {
  repo: String,
  branch: String,
  index: String,
  help: Boolean
};
var shortHands = {
  r: ['--repo'],
  git: ['--repo'],
  g: ['--repo'],
  b: ['--branch'],
  i: ['--index'],
  p: ['--index'],
  h: ['--help']
}
var cliOptions = nopt(knownOptions, shortHands, process.argv);
if (cliOptions.help) {
  process.exit(0);
}

var gitPages = require('..');
if (process.argv.length > 2) {
  if (check.not.unemptyString(cliOptions.repo)) {
    console.error('missing repo');
    process.exit(1);
  }

  gitPages({
    git: cliOptions.repo,
    branch: cliOptions.branch,
    index: cliOptions.index
  });
} else {
  gitPages();
}
