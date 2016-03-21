'use strict'

var la = require('lazy-ass')
var check = require('check-more-types')

/* global process, require */
/* eslint new-cap: 0 */
/* eslint no-console: 0 */
function gitPages (options) {
  var userConfig = require('./src/config')(options)
  var repoConfig = userConfig.repos

  var express = require('express')
  var morgan = require('morgan')

  var fs = require('fs')
  var Q = require('q')
  var R = require('ramda')
  var quote = require('quote')
  var join = require('path').join
  var extname = require('path').extname
  var marked = require('marked')

  // var directToSubApp = require('./src/sub-app')

  var app = express()
  app.use(morgan('dev'))

  console.log('Will serve pages for repos', R.keys(repoConfig).join(', '))

  require('./app/controller')(app, repoConfig)

  var storagePath = userConfig.storagePath
  if (!fs.existsSync(storagePath)) {
    console.log('making storage', quote(storagePath))
    fs.mkdirSync(storagePath)
  }

  var repoCommands = require('./src/repo')({
    storagePath: storagePath,
    useHttps: userConfig.useHttps
  })

  function repoToFolder (repo) {
    la(check.object(repo), 'missing repo')
    la(check.unemptyString(repo.name), 'missing repo name', repo)

    // function passPath (path) {
    //   la(check.unemptyString(path), 'copied folder should return path', path)
    //   console.log('Local folder in %s', path)
    //   return path
    // }

    // could be git repo or another folder
    var isGitRepo = check.unemptyString(repo.git)

    console.log('pulling repo %s, is git?', repo.name, isGitRepo)

    var clone = R.partial(repoCommands.clone, repo.name, repo)

    var pull = isGitRepo
      ? R.partial(repoCommands.pull, repo.name, repo.branch)
      : clone

    var shell = R.partial(repoCommands.shell, repo.exec)

    function noop () {}

    var commitId = isGitRepo
      ? R.partial(repoCommands.lastCommit, repo.name)
      : noop

    function rememberCommit (commit) {
      la(check.object(commit), 'expected commit obj for', repo.name, 'got', commit)
      la(check.commitId(commit.hash), 'expected commit for', repo.name, 'got', commit)
      repo.commit = commit
      console.log('remembering commit %s', commit)
      return commit
    }

    var setCommit = isGitRepo ? R.pipeP(commitId, rememberCommit) : noop
    return R.pipeP(pull, shell, setCommit)
  }

  app.get('/pull/:repo', function (req, res) {
    var name = req.params.repo
    if (!name) {
      console.log('cannot pull repo without name', req.params)
      return res.sendStatus(400)
    }

    console.log('received pull for repo %s', quote(name))
    var config = repoConfig[name]
    if (!config) {
      console.log('cannot find repo %s', quote(name))
      return res.status(404).send('Cannot find repo ' + name)
    }
    if (!check.has(config, 'name')) {
      config.name = name
    }

    // no need to clone, the repo is already there
    // var shell = R.partial(repoCommands.shell, config.exec)

    function sendOk (commit) {
      if (commit) {
        la(check.object(commit), 'expected commit obj for', name, 'got', commit)
        la(check.commitId(commit.hash), 'expected commit for', name, 'got', commit)
        return res.status(200).send(commit).end()
      }
      res.status(200).send().end()
    }

    repoToFolder(config)()
      .then(sendOk)
      .done()
  })

  var extensionRenderers = {
    '.md': function renderMarkdown (res, path) {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          throw new Error('Could not read ' + path + ' ' + err.message)
        }
        res.send(marked(data.toString()))
      })
    }
  }

  function repoRouteFor (repoName) {
    // var repo = repoConfig[repoName]
    var repoPath = join(storagePath, repoName)
    return function repoRoute (req, res) {
      var index = repoConfig[repoName].index
      var full = join(repoPath, index)
      var fileExt = extname(full)
      if (R.has(fileExt, extensionRenderers)) {
        extensionRenderers[fileExt](res, full)
      } else {
        res.sendFile(full)
      }
    }
  }

  // TODO: process each repo in order, not all at once
  // to avoid multiple commands trying to execute in separate folders
  function fetchRepo (repoName) {
    la(check.unemptyString(repoName), 'missing repo name', repoName)
    var repo = repoConfig[repoName]
    if (!check.has(repo, 'name')) {
      repo.name = repoName
    }

    var clone = R.partial(repoCommands.clone, repoName, repo)

    var route = function route () {
      console.log('setting up route for repo', quote(repoName))
      app.get('/' + repoName, repoRouteFor(repoName))
    }

    return R.pipeP(clone, R.always(repo), repoToFolder, route)()
  }

  var repos = R.keys(repoConfig)
  var fetchReposOneByOne =
  repos
    .map(function (name) {
      return R.partial(fetchRepo, name)
    })
    .reduce(Q.when, Q())

  function start () {
    var PORT = process.env.PORT || userConfig.port
    app.listen(PORT, '0.0.0.0')
    console.log('Running on http://0.0.0.0:' + PORT)
  }

  function onError (err) {
    console.error('Caught a problem', err.message)
    console.error(err.stack)
  }

  fetchReposOneByOne
    .then(function setupSubapps () {
      // app.use(directToSubApp)
      app.use(express.static(storagePath))
    }).then(start).catch(onError).done()
}

module.exports = gitPages

if (!module.parent) {
  throw new Error('Please run from another module, or use bin script')
}
