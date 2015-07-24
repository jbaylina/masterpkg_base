/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('data_module',[]);
    mod.provider('dm', function dmProvider() {
        var resources = {};
        var dm;
        return {
            define: function(resourceName, resourceInjector) {
                resources[resourceName] = resourceInjector;
            },
            $get: ['$injector', function($injector) {

                if (dm) return dm;

                function DataModule() {
                    var r;
                    for (r in resources) {
                        if (resources.hasOwnProperty(r)) {
                            this[r] = $injector(resources[r]);
                        }
                    }
                }

                return new DataModule();
            }]
        };
    });
})();
