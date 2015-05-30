(function (angular) {
  var m = angular.module('git-pages', ['Alertify']);
  m.controller('pullController', function ($scope, $http, Alertify) {
    $scope.pull = function pull(name) {
      console.log('pulling latest code for repo', name);
      $http.get('/pull/' + name)
        .then(function () {
          console.log('pulled repo', name);
          Alertify.success('Pulled repo', name);
        }, function (err) {
          console.error(err);
          Alertify.error('Could not pull repo', name, err);
        });
    };
  });
}(window.angular));
