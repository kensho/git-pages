var quote = require('quote');
var join = require('path').join;
var getAppName = require('./app-name');

function directToSubApp(req, res, next) {
  var from = req.headers.referer;
  if (from) {
    console.log('req url %s path %s from %s', req.url, req.path, from);
    var webApp = getAppName(from);
    if (webApp) {
      console.log('web app name', quote(webApp));
      req.url = '/' + join(webApp, req.url);
      req.originalUrl = req.path = req.url;
      console.log('rewritten request url %s', req.url);
    }
  }
  next();
}

module.exports = directToSubApp;
