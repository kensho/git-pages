'use strict'

var exists = require('fs').existsSync;
var join = require('path').join;
var R = require('ramda');
var check = require('check-more-types');
var os = require('os');

function firstFoundConfig(name) {
  var full = join(process.cwd(), name);
  if (exists(full)) {
    return full;
  }
  full = join(__dirname, '..', name);
  if (exists(full)) {
    return full;
  }
}

function mergeCliWithConfig(options) {
  options = options || {};

  // TODO read run config using nconf
  var tmpFolder = os.tmpdir()
  var storageFolder = join(tmpFolder, 'git-pages')
  console.log('storage folder', storageFolder)
  var defaultConfig = {
    repos: {},
    storagePath: storageFolder,
    port: 8765,
    useHttps: false,
  };

  var foundConfigFilename = firstFoundConfig('git-pages.config.js');
  if (!foundConfigFilename) {
    throw new Error('Cannot find the config file');
  }
  var userConfig = R.merge(defaultConfig, require(foundConfigFilename));

  var defaultRepo = {
    git: '',
    branch: 'master',
    index: 'index.html',
    exec: ''
  };

  if (check.object(options) &&
    check.not.empty(options)) {
    options = R.pickBy(check.defined, options);
    console.log('using command line options', options);
    userConfig.repos = {
      repo: R.merge(defaultRepo, options)
    };
    console.log(userConfig.repos);
  } else {
    userConfig.repos = R.mapObj(R.merge(defaultRepo), userConfig.repos);
  }
  return userConfig;
}

module.exports = R.once(mergeCliWithConfig);
