var la = require('lazy-ass')
var check = require('check-more-types');

// url is something like http://localhost:8765/foo-bar/baz
// and returns foo-bar
function getAppName(url) {
  la(check.webUrl(url), 'invalid web url', url);
  var webApp = url.split('/')[3];
  return webApp;
}

module.exports = getAppName;
