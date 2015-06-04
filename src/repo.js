require('lazy-ass');
var check = require('check-more-types');
var quote = require('quote');
var join = require('path').join;
var Q = require('q');
var R = require('ramda');
var fs = require('fs');
var exists = fs.existsSync;
var git = require('gift');

function cloneRepo(storagePath, toFullUrl, repoName, info) {
  la(check.unemptyString(storagePath), 'missing storage path', storagePath);
  la(check.unemptyString(repoName), 'missing repo name', repoName);
  la(check.fn(toFullUrl), 'expected full url function', toFullUrl);

  var repoPath = join(storagePath, repoName);
  var repoCloned = Q(null);
  if (!exists(repoPath)) {
    var url = toFullUrl(info.git);
    console.log('cloning repo %s from %s to %s',
      quote(repoName), quote(url), quote(repoPath));

    repoCloned = Q.nfcall(git.clone, url, repoPath)
      .then(R.always(repoPath))
      .catch(function (err) {
        console.log('Error cloning:', repoName, err);
        throw err;
      });
  }
  return repoCloned;
}

function pullRepo(storagePath, repoName, branch) {
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
    })
    .then(function () {
      console.log('returning full path', repoPath);
      return repoPath;
    });
}

function formExec(command, localPath) {
  la(check.maybe.string(command), 'invalid repo exec command', command);
  la(check.unemptyString(localPath), 'missing local path', localPath);

  if (!command) {
    return Q.when();
  }
  var chdir = require('chdir-promise');
  var exec = require('promised-exec');

  if (check.unemptyString(command)) {
    console.log('exec %s in %s', quote(command), localPath);
    return chdir.to(localPath)
      .then(R.partial(exec, command))
      .then(console.log.bind(console))
      .then(chdir.back);
  }

  return Q.when();
}

function shellCommand(repoConfig, localPath) {
  la(check.unemptyString(localPath), 'expected local path', localPath);
  var step = formExec(repoConfig, localPath);
  la(check.promise(step), 'expected to form a promise');
  return step;
};

module.exports = function init(options) {
  la(check.object(options), 'missing options');

  var fullGitUrl = R.partialRight(require('./repo-url'), options.useHttps);

  return {
    clone: R.partial(cloneRepo, options.storagePath, fullGitUrl),
    pull: R.partial(pullRepo, options.storagePath),
    shell: shellCommand
  };
};
