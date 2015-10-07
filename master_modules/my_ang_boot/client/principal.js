/*jslint node: true */
/*global angular */
/*global document */

// Please see this answer to understand
// http://stackoverflow.com/questions/22537311/angular-ui-router-login-authentication
//   by HackedByChinese
(function () {
    "use strict";

    var mod = angular.module('principal',[]);

    mod.factory('principal', function ($http, $q, $rootScope, $location, $state, $timeout, masterApi, gettextCatalog, clientConfig) {

        var _identity,
            _authenticated = false;

        return {
            isIdentityResolved: function() {
                return (typeof _identity !== "undefined");
            },
            isAuthenticated: function() {
                return _authenticated;
            },
            isInRight: function(right) {
                if (!_authenticated || !_identity.rights) return false;

                if (_identity.rights.indexOf('MASTER.ADMIN') != -1) return true;
                return _identity.rights.indexOf(right) != -1;
            },
            isInAnyRight: function(rights) {
                if (!_authenticated || !_identity.rights) return false;

                if (_identity.rights.indexOf('MASTER.ADMIN') != -1) return true;
                if (rights.length === 0) return true;
                for (var i = 0; i < rights.length; i++) {
                    if (this.isInRight(rights[i])) return true;
                }

                return false;
            },
            getIdUser: function() {
                if (!_identity) return null;
                return _identity.idUser;
            },
            getUserName: function() {
                if (!_identity) return null;
                return _identity.userName;
            },
            getMenu: function() {
                if (!_identity) return null;
                return _identity.menu;
            },
            getUser: function() {
                if (!_identity) return null;
                return _identity;
            },
            authenticate: function(identity) {
                if ((identity) && (!identity.idUser)) identity = null;
                _identity = identity;
                _authenticated = !!identity;
                var lang = navigator.language.substring(0,2);
                if (_identity) {
                    lang= _identity.lang || lang;
                }
                if(clientConfig.langs && clientConfig.langs.indexOf(lang)<0){
                    lang = clientConfig.defaultLang || "en";
                }else{
                    lang = clientConfig.defaultLang || "en";
                }
                if (gettextCatalog.getCurrentLanguage() !== lang) {
                    gettextCatalog.setCurrentLanguage(lang);
                    gettextCatalog.loadRemote("/translations/" + lang + ".json");
                }

                try {
                    angular.element(document.getElementById('mainDiv')).scope().loginChanged(_identity);
                } catch(err) {

                }

                if ($state.data && $state.data.rights && !principal.isInAnyRight($state.data.rights)) {
                    if ($rootScope.returnToState) {
                        $state.go($rootScope.returnToState, $rootScope.returnToStateParams);
                        delete $rootScope.returnToState;
                        delete $rootScope.returnToStateParams;
                    } else if ((_identity)&&(_identity.homeUrl)) {
                         $location.path(_identity.homeUrl);
                    } else {
                        $location.path(clientConfig.defaultUrl);
                    }
                }
            },
            identity: function(force) {
                var self = this;
                var deferred = $q.defer();

                if (force === true) _identity = undefined;

                // check and see if we have retrieved the identity data from the server. if we have, reuse it by immediately resolving
                if (this.isIdentityResolved()) {
                    deferred.resolve(_identity);

                    return deferred.promise;
                }

                // otherwise, retrieve the identity data from the server, update the identity object, and then resolve.
                masterApi.get('/login', function(err, aIdentity) {
                    if (err) {
                        self.authenticate(null);
                    } else {
                        self.authenticate(aIdentity);
                    }

                    deferred.resolve(_identity);
                });

                return deferred.promise;
            },
            logout: function() {
                var deferred = $q.defer();
                var self = this;
                masterApi.delete('/login', function(err) {
                    self.authenticate(null);
                    deferred.resolve();
                });
                return deferred.promise;
            }
        };
    });
})();
