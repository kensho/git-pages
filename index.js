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

var repoCommands = require('./src/repo')({
  storagePath: storagePath,
  useHttps: userConfig.useHttps
});

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
  // no need to clone, the repo is already there
  var shell = R.partial(repoCommands.shell, config.exec);
  var sendOk = res.sendStatus.bind(res, 200);

  repoCommands.pull(name, config.branch)
    .then(shell)
    .then(sendOk);
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
  var clone = R.partial(repoCommands.clone, repoName, repo);
  var pull = R.partial(repoCommands.pull, repoName, repo.branch);
  var shell = R.partial(repoCommands.shell, repo.exec);

  var route = function route() {
    console.log('setting up route for repo', quote(repoName));
    app.get('/' + repoName, repoRouteFor(repoName));
  };

  return R.pipeP(clone, pull, shell, route)();

})).then(function () {

  app.use(directToSubApp);
  app.use(express.static(storagePath));

  var PORT = process.env.PORT || userConfig.port;
  app.listen(PORT, '0.0.0.0');
  console.log('Running on http://0.0.0.0:' + PORT);
}).catch(function (err) {
  console.error('Caught a problem', err.message);
  console.error(err.stack);
}).done();
