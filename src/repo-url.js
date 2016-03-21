var la = require('lazy-ass');
var check = require('check-more-types');
var quote = require('quote');

function userRepoPair(str) {
  var userRepo = /^[\w-]+\/[\w-]+$/;
  return check.unemptyString(str) &&
    userRepo.test(str);
}

function isHttps(str) {
  var startsWithHttps = /^https:\/\//;
  return startsWithHttps.test(str);
}

function fullGithubSSHUrl(name) {
  console.log('assuming repo name on github %s via SSH', quote(name));
  la(userRepoPair(name), 'expected github user/repo string', name);
  return 'git@github.com:' + name + '.git';
}

function fullGithubHTTPSUrl(name) {
  console.log('assuming repo name on github %s via HTTPS', quote(name));
  la(userRepoPair(name), 'expected github user/repo string', name);
  return 'https://github.com/' + name + '.git';
}

function fullGitUrl(name, useHttps) {
  la(check.unemptyString(name), 'expected repo name or url', name);
  if (check.git(name)) {
    return name;
  }
  if (isHttps(name)) {
    return name;
  }
  return useHttps ? fullGithubHTTPSUrl(name) : fullGithubSSHUrl(name);
}

module.exports = fullGitUrl;
