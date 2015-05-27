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

function directToSubApp(req, res, next) {
  var from = req.headers.referer;
  // something like http://localhost:8765/charts-lib
  console.log('req url %s path %s from %s', req.url, req.path, from);
  var webApp = from.split('/')[3];
  if (webApp) {
    console.log('web app name', quote(webApp));
    req.url = '/' + join(webApp, req.url);
    console.log('rewritten request url %s', req.url);
  }
  next();
}

var app = express();
app.use(morgan('dev'));

app.get('/', function (req, res) {
    res.send('TODO: show the list of available repos\n');
});

var repoConfig = require('./repos');
console.log('Will serve pages for repos', R.keys(repoConfig));

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

function pullRepo(repoName) {
  var repoPath = storagePath + repoName;
  var repo = git(repoPath);
  console.log('pulling repo', quote(repoName));
  return Q.ninvoke(repo, 'sync')
    .then(function () {
      console.log('checking out master', quote(repoName));
      return Q.ninvoke(repo, 'checkout', 'master');
    });
}

app.get('/pull/:repo', function (req, res) {
  pullRepo(req.params.repo);
  // not waiting for the pull to finish before the response?
  res.send('OK');
});

Q.all(R.keys(repoConfig).map(function (repoName) {
  var repo = repoConfig[repoName];
  var repoPath = storagePath + repoName;
  var repoMerged = cloneRepo(repoName, repo).then(function () {
    return pullRepo(repoName);
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
