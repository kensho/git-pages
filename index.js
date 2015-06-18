require('lazy-ass');
var check = require('check-more-types');

/* global process, require */
/* eslint new-cap: 0 */
/* eslint no-console: 0 */
function gitPages(options) {

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
    function sendOk(commit) {
      la(check.commitId(commit), 'expected commit id', commit);
      res.status(200).send(commit).end();
    };

    repoCommands.pull(name, config.branch)
      .then(shell)
      .then(R.partial(repoCommands.lastCommitId, name))
      .then(sendOk)
      .done();
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

  // TODO: process each repo in order, not all at once
  // to avoid multiple commands trying to execute in separate folders
  function fetchRepo(repoName) {
    la(check.unemptyString(repoName), 'missing repo name', repoName);
    var repo = repoConfig[repoName];
    var clone = R.partial(repoCommands.clone, repoName, repo);
    var pull = R.partial(repoCommands.pull, repoName, repo.branch);
    var shell = R.partial(repoCommands.shell, repo.exec);
    var commitId = R.partial(repoCommands.lastCommitId, repoName);
    function rememberCommit(commit) {
      la(check.commitId(commit), 'expected commit for', repoName, 'got', commit);
      repo.commit = commit;
    }

    var route = function route() {
      console.log('setting up route for repo', quote(repoName));
      app.get('/' + repoName, repoRouteFor(repoName));
    };

    return R.pipeP(clone, pull, shell, commitId, rememberCommit, route)();
  }

  var repos = R.keys(repoConfig);
  var fetchReposOneByOne =
    repos
      .map(function (name) {
        return R.partial(fetchRepo, name);
      })
      .reduce(Q.when, Q());

  fetchReposOneByOne
    .then(function setupSubapps() {
      app.use(directToSubApp);
      app.use(express.static(storagePath));
    }).then(function start() {
      var PORT = process.env.PORT || userConfig.port;
      app.listen(PORT, '0.0.0.0');
      console.log('Running on http://0.0.0.0:' + PORT);
    }).catch(function (err) {
      console.error('Caught a problem', err.message);
      console.error(err.stack);
    }).done();
}

module.exports = gitPages;
