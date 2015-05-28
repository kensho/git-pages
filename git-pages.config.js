/*
  List the git repos to clone and serve.
  For example, to serve demo.html from 'user/A' under /A

  module.exports = {
    repos: {
      'A': {
        git: 'user/A',
        branch: 'master', // default: master
        index: 'demo.html' // default: index.html
      }
    }
  };
*/
module.exports = {
  repos: {
    'local-angular-development': {
      git: 'bahmutov/local-angular-development',
      branch: 'gh-pages'
    }
  }
};
