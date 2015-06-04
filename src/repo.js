require('lazy-ass');
var check = require('check-more-types');
var quote = require('quote');
var join = require('path').join;
var Q = require('q');
var R = require('ramda');
var fs = require('fs');
var exists = fs.existsSync;

function cloneRepo(storagePath, repoName, info) {
  la(check.unemptyString(storagePath), 'missing storage path', storagePath);
  la(check.unemptyString(repoName), 'missing repo name', repoName);

  var repoPath = join(storagePath, repoName);
  var repoCloned = Q(null);
  if (!exists(repoPath)) {
    var url = fullGitUrl(info.git);
    console.log('cloning repo %s from %s to %s',
      quote(repoName), quote(url), quote(repoPath));

    repoCloned = Q.nfcall(git.clone, url, repoPath)
      .catch(function (err) {
        console.log('Error cloning:', repoName, err);
        throw err;
      });
  }
  return repoCloned;
}

function pullRepo(storagePath, repoName, branch) {
  var git = require('gift');

  la(check.unemptyString(repoName), 'missing repo name', repoName);
  la(check.unemptyString(branch), 'missing repo branch', repoName, branch);

  var repoPath = join(storagePath, repoName);
  var repo = git(repoPath);
  console.log('pulling repo %s repo path %s', quote(repoName), quote(repoPath));
  console.log('working folder %s', process.cwd());

  return Q.ninvoke(repo, 'remote_fetch', 'origin')
    .then(function () {
      console.log('finished pulling repo %s', quote(repoName));
    })
    .catch(function (err) {
      console.error('Error pulling repo %s\n  %s', repoName, err.message);
      throw err;
    })
    .then(function () {
      console.log('checking out branch %s in %s', branch, quote(repoName));
      return Q.ninvoke(repo, 'reset', 'origin/' + branch, {hard: true});
    });
}

module.exports = function init(options) {
  la(check.object(options), 'missing options');

  return {
    clone: R.partial(cloneRepo, options.storagePath),
    pull: R.partial(pullRepo, options.storagePath)
  };
};
