(function (angular) {
  var m = angular.module('git-pages', ['Alertify', 'http-estimate']);
  m.controller('pullController', function ($scope, $http, $timeout, Alertify) {
    $scope.pull = function pull(name) {
      console.log('pulling latest code for repo', name);
      $http.get('/pull/' + name)
        .then(function (response) {
          var commit = response.data;

          if (commit) {
            la(check.object(commit) &&
               check.commitId(commit.hash), 'expected short commit id', commit,
               'after pulling', name);
            console.log('pulled repo', name, commit);
            Alertify.success('Pulled repo', name, commit.hash.substr(0, 7), commit.committerDateRel);
          } else {
            Alertify.success('Pulled repo', name);
          }

          $timeout(function () {
            location.reload(true);
          }, 2000);
        }, function (err) {
          console.error(err);
          Alertify.error('Could not pull repo', name, err);
        });
    };
  });
}(window.angular));
