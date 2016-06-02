angular.module('ionicApp', ['ionic'])

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
    .state('home', {
	url: '/home',
	templateUrl: 'partials/home.html',
	controller: 'HomeCtrl'
    })
    .state('report1', {
	url: "/report1",
	templateUrl: 'partials/report1.html',
	controller: 'HomeCtrl'
    })
    .state('report2', {
	url: "/report2",
	templateUrl: 'partials/report2.html',
	controller: 'HomeCtrl'
    })
    .state('logs', {
	url: "/logs",
	templateUrl: 'partials/logs.html',
	controller: 'HomeCtrl'
    })
    .state('setup', {
	url: "/setup",
	templateUrl: 'partials/setup.html',
	controller: 'HomeCtrl'
    });

   $urlRouterProvider.otherwise("/home");

})

.controller('HomeCtrl', function($scope) {
    console.log('HomeCtrl');

});
