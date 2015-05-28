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

module.exports = directToSubApp;
