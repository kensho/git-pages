var jade = require('jade');
var join = require('path').join;
var extname = require('path').extname;
var R = require('ramda');
var fromThisFolder = R.partial(join, __dirname);
var fs = require('fs');
var read = R.partialRight(fs.readFileSync, 'utf8');

// url to local path resolution
var dependencies = {
  '/app/git-pages-app.js': './git-pages-app.js',
  '/app/dist/ng-alertify.js': '../node_modules/ng-alertify/dist/ng-alertify.js',
  '/app/dist/ng-alertify.css': '../node_modules/ng-alertify/dist/ng-alertify.css',
  '/app/dist/ng-http-estimate.js': '../node_modules/ng-http-estimate/dist/ng-http-estimate.js',
  '/app/dist/ng-http-estimate.css': '../node_modules/ng-http-estimate/dist/ng-http-estimate.css'
};

// index page application
function indexApp(app, repoConfig) {

  var pkg = require('../package.json');

  app.get('/', function (req, res) {
    var render = jade.compileFile(fromThisFolder('./index.jade'), { pretty: true });
    console.log('git names', repoConfig);
    var data = {
      repos: repoConfig,
      pkg: pkg
    };
    var html = render(data);
    res.send(html);
  });

  R.keys(dependencies).forEach(function (url) {
    var localPath = dependencies[url];
    app.get(url, function (req, res) {
      var full = fromThisFolder(localPath);
      res.type(extname(localPath));
      res.send(read(full));
    });
  });
}

module.exports = indexApp;
