/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('my_ang_boot',['ui.bootstrap','ui.router', 'config']);

	mod.config(function ($stateProvider, $urlRouterProvider, $locationProvider, clientConfig) {
		$stateProvider.state('site', {
			'abstract': true,
			resolve: {
				authorize: ['authorization',
				  function(authorization) {
				    return authorization.authorize();
				  }
				]
			},
            templateUrl: 'templates/my_ang_boot/content.html',
            controller: 'MainCtrl'
		});
		$stateProvider.state("unauthorized", {
				parent: 'site',
				url: "/unauthorized",
				templateUrl: 'templates/my_ang_boot/unauthorized.html',
				controller: 'UnauthorizedCtrl'
		});
		$stateProvider.state("login", {
                parent: 'site',
                url: "/login",
                templateUrl: 'templates/my_ang_boot/login.html',
                controller: 'LoginCtrl'
        });
		$stateProvider.state("changePassword", {
                parent: 'site',
                url: "/changePassword",
                data: {
                    rights: []
                },
                templateUrl: 'templates/my_ang_boot/change_password.html',
                controller: 'ChangePasswordCtrl'
        });
        $stateProvider.state("otp", {
                parent: 'site',
                url: "/otp/:otp",
                templateUrl: 'templates/my_ang_boot/reset_password.html',
                controller: 'ResetPasswordCtrl'
        });
        $stateProvider.state("rememberPassword", {
                parent: 'site',
                url: "/rememberPassword",
                templateUrl: 'templates/my_ang_boot/remember_password.html',
                controller: 'RememberPasswordCtrl'
        });
		var defaultUrl = clientConfig.defaultUrl || "/login";

		$urlRouterProvider.otherwise(defaultUrl);

		$locationProvider.html5Mode(true);
	});

	mod.directive('a', function() {
		return {
			restrict: 'E',
			link: function(scope, elem, attrs) {
				if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
					elem.on('click', function(e){
						e.preventDefault();
					});
				}
			}
		};
	});

    mod.factory('_', function() {
        return window._; // assumes underscore has already been loaded on the page
    });
})();



