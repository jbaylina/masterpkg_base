/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('reset_password',[]);
    mod.controller('ResetPasswordCtrl', function ($scope, $rootScope, $state, $location, GenericDialogs, masterApi, principal, clientConfig) {
        $scope.credentials = {};
        var otp = $state.params.otp;

        if (principal.isAuthenticated()) {
            var user = principal.getUser();
            if ((user)&&(user.homeUrl)) {
                $location.path(user.homeUrl);
            } else {
                $location.path(clientConfig.defaultUrl);
            }
            return;
        }

        if (!otp) {
            $location.path(clientConfig.defaultUrl);
            return;
        }

        masterApi.get('/login/otp/' + otp, function(err, otpInfo) {
            if (err) {
                return GenericDialogs.notification(err.toString());
            }
            if (!otpInfo) {
                $location.path(clientConfig.defaultUrl);
                return;
            }
            $scope.otpInfo = otpInfo;
        });

        $scope.resetPassword = function() {
            masterApi.put('/login/otp/' + otp  ,$scope.credentials, function(err, aIdentity) {
                if (err) {
                    return GenericDialogs.notification(err.toString());
                }
                principal.authenticate(aIdentity);
                if ($rootScope.returnToState) {
                    $state.go($rootScope.returnToState, $rootScope.returnToStateParams);
                    delete $rootScope.returnToState;
                    delete $rootScope.returnToStateParams;
                } else if ((aIdentity)&&(aIdentity.homeUrl)) {
                     $location.path(aIdentity.homeUrl);
                } else {
                    $location.path(clientConfig.defaultUrl);
                }
            });
        };

        $scope.cancel = function() {
            $window.history.back();
        };
    });
})();
