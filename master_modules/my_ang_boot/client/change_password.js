/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('change_password',[]);
    mod.controller('ChangePasswordCtrl', function ($window, $scope, $state, $location, GenericDialogs, masterApi, principal, clientConfig) {
        $scope.credentials = {};
        $scope.changePassword = function() {
            masterApi.post('/login/changePassword',$scope.credentials, function(err) {
                if (err) {
                    return GenericDialogs.notification(err.toString());
                }

                var user = principal.getUser();

                if ((user)&&(user.homeUrl)) {
                    $location.path(user.homeUrl);
                } else {
                    $location.path(clientConfig.defaultUrl);
                }

                principal.authenticate(aIdentity);
            });
        };

        $scope.cancel = function() {
            $window.history.back();
        };
    });
})();
