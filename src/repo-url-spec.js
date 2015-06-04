require('lazy-ass');
var check = require('check-more-types');
var fullUrl = require('./repo-url');

describe('getting full git ulr', function () {
  it('resolves to github', function () {
    var full = fullUrl('foo/bar');
    la(full.indexOf('github.com') !== -1, 'cannot find github', full);
    la(full.indexOf('foo/bar') !== -1, 'cannot find foo/bar', full);
    la(check.git(full), full);
  });

  it('foo21/bar3', function () {
    var full = fullUrl('foo21/bar3');
    la(check.git(full), full);
  });

  it('foo-bar/baz', function () {
    var full = fullUrl('foo-bar/baz');
    la(check.git(full), full);
  });

  it('resolves to full if git:', function () {
    var name = 'git@github.com:bahmutov/code-box.git';
    var full = fullUrl(name);
    la(full === name, 'full', full, 'does not match input', name);
  });

  it('resolves to full if https:', function () {
    var name = 'https://github.com/foo/bar.git';
    var full = fullUrl(name);
    la(full === name, 'full', full, 'does not match input', name);
  });

  it('throws if not user / repo pair', function () {
    la(check.raises(function () {
      var name = 'foo/bar/baz';
      fullUrl(name);
    }));

    la(check.raises(function () {
      var name = 'foo';
      fullUrl(name);
    }));

    la(check.raises(function () {
      var name = 'foo/';
      fullUrl(name);
    }));
  });
});
