var la = require('lazy-ass');
var check = require('check-more-types');
var quote = require('quote');
var join = require('path').join;
var Q = require('q');
var R = require('ramda');
var fs = require('fs');
var exists = fs.existsSync;
var git = require('gift');
var gitlog = Q.denodeify(require('gitlog'));
var ggit = require('ggit');
var chdir = require('chdir-promise');
var ncp = require('ncp').ncp;

function copyFolder(source, destination) {
  la(check.unemptyString(source), 'expected source folder', source);
  var defer = Q.defer();
  console.log('Copying %s to %s', quote(source), quote(destination));
  ncp(source, destination, function (err) {
    if (err) {
      console.error('error copying %s to %s', quote(source), quote(destination));
      console.error(err);
      defer.reject(check.array(err) ? err[0] : err);
    } else {
      defer.resolve(destination);
    }
  });
  return defer.promise;
}

function cloneRepo(storagePath, toFullUrl, repoName, info) {
  la(check.unemptyString(storagePath), 'missing storage path', storagePath);
  la(check.unemptyString(repoName), 'missing repo name', repoName);
  la(check.fn(toFullUrl), 'expected full url function', toFullUrl);

  var repoPath = join(storagePath, repoName);
  var repoCloned = Q(repoPath);

  if (!exists(repoPath)) {

    if (check.has(info, 'git') && check.unemptyString(info.git)) {
      console.log('forming full git', info);
      var url = toFullUrl(info.git);
      console.log('cloning repo %s from %s to %s',
        quote(repoName), quote(url), quote(repoPath));

      repoCloned = Q(git).ninvoke('clone', url, repoPath)
        .then(R.always(repoPath))
        .catch(function (err) {
          console.log('Error cloning:', repoName, err);
          throw err;
        });
    } else if (check.has(info, 'folder')) {
      // copy folder
      repoCloned = copyFolder(info.folder, repoPath);
    } else {
      throw new Error('Cannot determine how to clone / copy source repo ' +
        JSON.stringify(info));
    }

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

function lastCommitId(storagePath, repoName) {
  var repoPath = join(storagePath, repoName);
  return chdir.to(repoPath)
    .then(ggit.lastCommitId)
    .tap(chdir.back);
}

function lastCommit(storagePath, repoName) {
  var repoPath = join(storagePath, repoName);
  var logOpts = {
    repo: repoPath,
    number: 1,
    fields: ['hash', 'subject', 'committerDateRel']
  };
  return gitlog(logOpts).then(R.prop(0));
}

function formExec(command, localPath) {
  la(check.maybe.string(command), 'invalid repo exec command', command);
  la(check.unemptyString(localPath), 'missing local path', localPath);

  if (!command) {
    console.log('there is no shell command for %s', localPath);
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
  console.log('Executing shell command in %s', localPath);
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
    lastCommitId: R.partial(lastCommitId, options.storagePath),
    lastCommit: R.partial(lastCommit, options.storagePath),
    shell: shellCommand
  };
};
