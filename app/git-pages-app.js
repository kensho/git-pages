(function (angular) {
  var m = angular.module('git-pages', []);
  m.controller('pullController', function ($scope, $http) {
    $scope.pull = function pull(name) {
      console.log('pulling latest code for repo', name);
      $http.get('/pull/' + name)
        .then(function () {
          console.log('pulled');
        });
    };
  });
}(window.angular));
