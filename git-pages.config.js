/*
  List the git repos to clone and serve.
  For example, to serve demo.html from 'user/A' under /A

  module.exports = {
    // possible additional settings
    // covering hosting (local folder, port)

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
    /*
    'code-box': {
      // can use full git SSH url
      // git: 'git@github.com:bahmutov/code-box.git'
      // or the full HTTPS url
      git: 'https://github.com/bahmutov/code-box.git'
      // or just username/repo (assumes github in this case)
      // git: 'bahmutov/code-box'
    },
    'local-angular-development': {
      git: 'bahmutov/local-angular-development',
      branch: 'gh-pages'
    },*/
    'git-pages': {
      git: 'kensho/git-pages',
      index: 'README.md',
      exec: 'npm version'
    },
    'ndc2015-testjs': {
      // git: 'git@github.com:kubawalinski/ndc2015-testjs.git',
      git: 'https://github.com/kubawalinski/ndc2015-testjs.git',
      index: 'slides-testjs.html'
    },
    'A': {
      folder: 'test/A'
    },
    'B': {
      folder: 'test',
      index: 'A/index.html'
    }
  },
  port: 8765, // serving port, optional
  useHttps: true // form full urls from user / repo using ssh or https
};
