require('lazy-ass');
var check = require('check-more-types');
var quote = require('quote');

function userRepoPair(str) {
  var userRepo = /^\w+\/\w+$/;
  return check.unemptyString(str) &&
    userRepo.test(str);
}

function fullGitUrl(name) {
  la(check.unemptyString(name), 'expected repo name or url', name);
  if (check.git(name)) {
    return name;
  }
  console.log('assuming repo name on github %s', quote(name));
  la(userRepoPair(name), 'expected github user/repo string', name);
  return 'git@github.com:' + name + '.git';
}

module.exports = fullGitUrl;
