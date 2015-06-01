/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('authorization',[]);

    mod.factory('authorization', function ($rootScope, $location, principal) {
        return {
            authorize: function() {
                return principal.identity().then(function() {
                    var isAuthenticated = principal.isAuthenticated();

                    if ($rootScope.toState.data && $rootScope.toState.data.rights && !principal.isInAnyRight($rootScope.toState.data.rights)) {
                        if (isAuthenticated) $location.path('unauthorized'); // user is signed in but not authorized for desired state
                        else {
                            // user is not authenticated. stow the state they wanted before you
                            // send them to the signin state, so you can return them when you're done
                            $rootScope.returnToState = $rootScope.toState;
                            $rootScope.returnToStateParams = $rootScope.toStateParams;

                            // now, send them to the signin state so they can log in
                            $location.path('/login');
                        }
                    }
                });
            }
        };
    });
    mod.run(function($rootScope, $state, $stateParams, authorization, principal) {
        $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
            // track the state the user wants to go to; authorization service needs this
            $rootScope.toState = toState;
            $rootScope.toStateParams = toStateParams;
            // if the principal is resolved, do an authorization check immediately. otherwise,
            // it'll be done when the state it resolved.
            if (principal.isIdentityResolved()) authorization.authorize();
        });
    });
})();
