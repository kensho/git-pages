/* global process, require */
/* eslint new-cap: 0 */
/* eslint no-console: 0 */
var express = require('express');
var morgan = require('morgan');

var fs = require('fs');
var Q = require('q');
var R = require('ramda');
var git = require('gift');
var quote = require('quote');
var join = require('path').join;

var directToSubApp = require('./src/sub-app');

var app = express();
app.use(morgan('dev'));

var repoConfig = require('./git-pages.config').repos;
// TODO: fill missing default values
console.log('Will serve pages for repos', R.keys(repoConfig));

app.get('/', function (req, res) {
  var jade = require('jade');
  var render = jade.compileFile('./views/index.jade', { pretty: true });
  console.log('git names', repoConfig);
  var html = render({ repos: repoConfig });
  res.send(html);
});

var storagePath = '/tmp/kpages/';
if (!fs.existsSync(storagePath)) {
  console.log('making storage', quote(storagePath));
  fs.mkdirSync(storagePath);
}

function fullGitUrl(name) {
  return 'git@github.com:' + name + '.git';
}

function cloneRepo(repoName, info) {
  var repoPath = storagePath + repoName;
  var repoCloned = Q(null);
  if (!fs.existsSync(repoPath)) {
    var url = fullGitUrl(info.git);
    console.log('cloning repo %s from %s to %s',
      quote(repoName), quote(url), quote(repoPath));

    repoCloned = Q.nfcall(git.clone, url, repoPath)
      .catch(function (err) {
        console.log('Error cloning:', repoName, err);
      });
  }
  return repoCloned;
}

function pullRepo(repoName, branch) {
  branch = branch || 'master';
  var repoPath = storagePath + repoName;
  var repo = git(repoPath);
  console.log('pulling repo %s in %s', quote(repoName), quote(repoPath));

  return Q.ninvoke(repo, 'remote_fetch', 'origin')
    .then(function () {
      console.log('checking out branch %s in %s', branch, quote(repoName));
      return Q.ninvoke(repo, 'reset', 'origin/' + branch, {hard: true});
    });
}

app.get('/pull/:repo', function (req, res) {
  pullRepo(req.params.repo).then(res.send.bind(res, 'OK'));
});

Q.all(R.keys(repoConfig).map(function (repoName) {
  var repo = repoConfig[repoName];
  var repoPath = storagePath + repoName;
  var repoMerged = cloneRepo(repoName, repo).then(function () {
    return pullRepo(repoName, repo.branch);
  }).then(function () {
    console.log('setting up route for repo', quote(repoName));
    app.get('/' + repoName, function (req, res) {
      var index = repoConfig[repoName].index || 'index.html';
      var full = join(repoPath, index);
      console.log(full);
      res.sendFile(full);
    });
  });
  return repoMerged;
})).then(function () {

  app.use(directToSubApp);
  app.use(express.static(storagePath));

  var PORT = process.env.PORT || 8765;
  app.listen(PORT, '0.0.0.0');
  console.log('Running on http://localhost:' + PORT);
}).catch(function (err) {
  console.log(err);
  console.log(err.stack);
});
