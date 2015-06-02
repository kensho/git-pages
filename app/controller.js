var jade = require('jade');
var join = require('path').join;
var R = require('ramda');
var fromThisFolder = R.partial(join, __dirname);
var fs = require('fs');
var read = R.partialRight(fs.readFileSync, 'utf8');

// index page application
function indexApp(app, repoConfig) {

  app.get('/', function (req, res) {
    var render = jade.compileFile(fromThisFolder('./index.jade'), { pretty: true });
    console.log('git names', repoConfig);
    var html = render({ repos: repoConfig });
    res.send(html);
  });
  app.get('/app/git-pages-app.js', function (req, res) {
    var full = fromThisFolder('./git-pages-app.js');
    res.type('.js');
    res.send(read(full));
  });
  app.get('/app/dist/ng-alertify.js', function (req, res) {
    var full = fromThisFolder('../node_modules/ng-alertify/dist/ng-alertify.js');
    res.type('.js');
    res.send(read(full));
  });
  app.get('/app/dist/ng-alertify.css', function (req, res) {
    var full = fromThisFolder('../node_modules/ng-alertify/dist/ng-alertify.css');
    res.type('.css');
    res.send(read(full));
  });
}

module.exports = indexApp;
