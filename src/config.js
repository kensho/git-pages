var exists = require('fs').existsSync;
var join = require('path').join;
var R = require('ramda');

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

// TODO read run config using nconf
var defaultConfig = {
  repos: {},
  storagePath: '/tmp/kpages',
  port: 8765
};

var foundConfigFilename = firstFoundConfig('git-pages.config.js');
if (!foundConfigFilename) {
  throw new Error('Cannot find the config file');
}
var userConfig = R.merge(defaultConfig, require(foundConfigFilename));

var defaultRepo = {
  git: '',
  branch: 'master',
  index: 'index.html'
};

userConfig.repos = R.mapObj(R.merge(defaultRepo), userConfig.repos);
module.exports = userConfig;