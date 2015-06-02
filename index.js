#!/usr/bin/env node

/* global process, require */
/* eslint new-cap: 0 */
/* eslint no-console: 0 */
require('lazy-ass');
var check = require('check-more-types');

var express = require('express');
var morgan = require('morgan');

var fs = require('fs');
var Q = require('q');
var R = require('ramda');
var git = require('gift');
var quote = require('quote');
var join = require('path').join;
var extname = require('path').extname;
var marked = require('marked');

var directToSubApp = require('./src/sub-app');

var app = express();
app.use(morgan('dev'));

var userConfig = require('./src/config');
var repoConfig = userConfig.repos;

console.log('Will serve pages for repos', R.keys(repoConfig).join(', '));

require('./app/controller')(app, repoConfig);

var storagePath = userConfig.storagePath;
if (!fs.existsSync(storagePath)) {
  console.log('making storage', quote(storagePath));
  fs.mkdirSync(storagePath);
}

function fullGitUrl(name) {
  return 'git@github.com:' + name + '.git';
}

function cloneRepo(repoName, info) {
  var repoPath = join(storagePath, repoName);
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

app.get('/pull/:repo', function (req, res) {
  var name = req.params.repo;
  if (!name) {
    console.log('cannot pull repo without name', req.params);
    return res.sendStatus(400);
  }
  console.log('received pull for repo %s', quote(name));
  var config = repoConfig[name];
  if (!config) {
    console.log('cannot find repo %s', quote(name));
    res.status(404).send('Cannot find repo ' + name);
  }
  pullRepo(name, config.branch)
    .then(function () {
      res.sendStatus(200);
    });
});

var extensionRenderers = {
  '.md': function renderMarkdown(res, path) {
    fs.readFile(path, 'utf8', function (err, data) {
      res.send(marked(data.toString()));
    });
  }
}

function repoRouteFor(repoName) {
  var repo = repoConfig[repoName];
  var repoPath = join(storagePath, repoName);
  return function repoRoute(req, res) {
    var index = repoConfig[repoName].index;
    var full = join(repoPath, index);
    var fileExt = extname(full);
    if (R.has(fileExt, extensionRenderers)) {
      extensionRenderers[fileExt](res, full);
    } else {
      res.sendFile(full);
    }
  };
}


Q.all(R.keys(repoConfig).map(function (repoName) {
  var repo = repoConfig[repoName];
  var repoMerged = cloneRepo(repoName, repo).then(function () {
    return pullRepo(repoName, repo.branch);
  }).then(function () {
    console.log('setting up route for repo', quote(repoName));
    app.get('/' + repoName, repoRouteFor(repoName));
  });
  return repoMerged;
})).then(function () {

  app.use(directToSubApp);
  app.use(express.static(storagePath));

  var PORT = process.env.PORT || userConfig.port;
  app.listen(PORT, '0.0.0.0');
  console.log('Running on http://0.0.0.0:' + PORT);
}).catch(function (err) {
  console.error('Caught a problem', err.message);
  console.error(err.stack);
});
