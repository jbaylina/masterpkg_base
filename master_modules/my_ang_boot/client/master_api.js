/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";
    var MasterError = require('../common/masterError');

    var mod = angular.module('master_api',[]);
    mod.service('masterApi', function ($http, $q, clientConfig) {
        var apiCall = function (arg, cb) {
            var canceler= $q.defer();
            var res = {
                cb: cb,
                cancel: function() {
                    canceler.resolve();
                }
            };
            arg.url = clientConfig.hostUrl + clientConfig.apiPrefix + arg.url;

            if (!arg.method) {
                if (arg.data) {
                    arg.method = "POST";
                } else {
                    arg.method = "GET";
                }
            }
            if (typeof arg.params === "undefined") {
                arg.params = {};
            }
            if (typeof arg.errorDialog === "undefined") {
                arg.errorDialog = true;
            }

            var call, p, q = $q.defer(),
                S = arg.url,
                nparams = 0;
            for (p in arg.params) {
                if (arg.params.hasOwnProperty(p)) {
                    if (arg.params[p] !== null) {
                        if (nparams === 0) {
                            S = S + '?';
                        } else {
                            S = S + '&';
                        }
                        nparams += 1;
                        S += encodeURIComponent(p);
                        S += "=";
                        if (typeof arg.params[p] === "string" || typeof arg.params[p] === "number") {
                            S += encodeURIComponent(arg.params[p]);
                        } else {
                            S += encodeURIComponent(JSON.stringify(arg.params[p]));
                        }
                    }
                }
            }
            call = {};
            call.url = S;
            call.method = arg.method;
            if (arg.data) {
                call.data = arg.data;
            }
            call.timeout = canceler.promise;
            call.withCredentials=true;
            var merr;
            $http(call).success(function (res) {
                if (!res) {
                    merr = new MasterError("communications.badResponse", "Bad response from server");
                    return cb(merr);
                }
                if (res === "null") res = null;
                cb(null, res);
            }).error(function (err) {
                if (!err) {
                    merr = new MasterError("communications.badResponse", "Bad response from server");
                    return cb(merr);
                }
                merr = new MasterError(err.errorCode, err.errorMsg);
                cb(merr);
            });

            return res;
        };


        this.call = function (arg, cb) {
            if (typeof arg === "string") {
                arg = { url: arg};
            }
            return apiCall(arg, function(merr, data) {
                if (merr) {
                    if (merr.errorCode === "security.accessDenied") {
                        merr.logout =true;
                    }
                    cb(merr);
                    if (merr.logout) {
                        angular.element(document.getElementById("mainDiv")).scope().logout();
                    }
                } else {
                    return cb(null, data);
                }
            });
        };
        this.get = function(arg, arg2, cb) {
            if (typeof arg === "string") {
                arg = { url: arg};
            }
            arg.method = "GET";
            if (typeof arg2 === "function") {
                cb = arg2;
            } else {
                arg.params = arg2;
            }
            return this.call(arg, cb);
        };
        this.post = function(arg, arg2, cb) {
            if (typeof arg === "string") {
                arg = { url: arg};
            }
            arg.method = "POST";
            if (typeof arg2 === "function") {
                cb = arg2;
            } else {
                arg.data = arg2;
            }
            return this.call(arg, cb);
        };
        this.put = function(arg, arg2, cb) {
            if (typeof arg === "string") {
                arg = { url: arg};
            }
            arg.method = "PUT";
            if (typeof arg2 === "function") {
                cb = arg2;
            } else {
                arg.data = arg2;
            }
            return this.call(arg, cb);
        };
        this.delete = function(arg, arg2, cb) {
            if (typeof arg === "string") {
                arg = { url: arg};
            }
            arg.method = "DELETE";
            if (typeof arg2 === "function") {
                cb = arg2;
            } else {
                arg.data = arg2;
            }
            return this.call(arg, cb);
        };
    });
})();


