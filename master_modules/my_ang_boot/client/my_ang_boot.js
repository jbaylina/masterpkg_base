/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('my_ang_boot', ['ui.bootstrap', 'ui.router', 'config']);

    mod.config(function ($stateProvider, $urlRouterProvider, $locationProvider, clientConfig) {
        $stateProvider.state('site', {
            'abstract': true,
            resolve: {
                authorize: ['authorization',
                    function (authorization) {
                        return authorization.authorize();
                    }
                ]
            },
            templateUrl: function () {
                if (clientConfig.template) {
                    return 'templates/' + clientConfig.template + '/content.html'
                } else {
                    return 'templates/template_admin/content.html'
                }
            },
            controller: 'MainCtrl'
        });
        $stateProvider.state("unauthorized", {
            parent: 'site',
            url: "/unauthorized",
            templateUrl: function () {
                if (clientConfig.template) {
                    return 'templates/' + clientConfig.template + '/unauthorized.html'
                } else {
                    return 'templates/template_admin/unauthorized.html'
                }
            },
            controller: 'UnauthorizedCtrl'
        });
        $stateProvider.state("login", {
            url: "/login",
            templateUrl: function () {
                if (clientConfig.template) {
                    return 'templates/' + clientConfig.template + '/login.html'
                } else {
                    return 'templates/template_admin/login.html'
                }
            },
            controller: 'LoginCtrl'
        });
        $stateProvider.state("changePassword", {
            parent: 'site',
            url: "/changePassword",
            data: {
                rights: []
            },
            templateUrl: function () {
                if (clientConfig.template) {
                    return 'templates/' + clientConfig.template + '/change_password.html'
                } else {
                    return 'templates/template_admin/change_password.html'
                }
            },
            controller: 'ChangePasswordCtrl'
        });
        $stateProvider.state("otp", {
            parent: 'site',
            url: "/otp/:otp",
            templateUrl: function () {
                if (clientConfig.template) {
                    return 'templates/' + clientConfig.template + '/reset_password.html'
                } else {
                    return 'templates/template_admin/reset_password.html'
                }
            },
            controller: 'ResetPasswordCtrl'
        });
        $stateProvider.state("rememberPassword", {
            parent: 'site',
            url: "/rememberPassword",
            templateUrl: function () {
                if (clientConfig.template) {
                    return 'templates/' + clientConfig.template + '/remember_password.html'
                } else {
                    return 'templates/template_admin/remember_password.html'
                }
            },
            controller: 'RememberPasswordCtrl'
        });
        var defaultUrl = clientConfig.defaultUrl || "/login";

        $urlRouterProvider.otherwise(defaultUrl);

        $locationProvider.html5Mode(true);
    });

    mod.directive('a', function () {
        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                if (attrs.ngClick || attrs.href === '' || attrs.href === '#') {
                    elem.on('click', function (e) {
                        e.preventDefault();
                    });
                }
            }
        };
    });

    mod.factory('_', function () {
        return window._; // assumes underscore has already been loaded on the page
    });
})();



