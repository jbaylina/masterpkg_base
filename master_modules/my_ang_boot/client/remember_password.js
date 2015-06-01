/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('remember_password',[]);
    mod.controller('RememberPasswordCtrl', function ($scope, $rootScope, $state, $location, GenericDialogs, masterApi, principal, clientConfig, gettextCatalog) {
        $scope.credentials = {};

        $scope.rememberPassword = function() {
            masterApi.post('/user/' + $scope.credentials.username + '/requestPasswordChange', null, function(err) {
                if (err) {
                    return GenericDialogs.notification(err.toString());
                }
                $location.path(clientConfig.defaultUrl);
                return GenericDialogs.notification(gettextCatalog.getString("An email has been sended to your email. Please follow the instructions there."));
            });
        };

        $scope.cancel = function() {
            $window.history.back();
        };
    });
})();
