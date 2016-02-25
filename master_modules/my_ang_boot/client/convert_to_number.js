/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('convertToNumber',[]);
    mod.directive('convertToNumber', function() {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
          ngModel.$parsers.push(function(val) {
            return parseInt(val, 10);
          });
          ngModel.$formatters.push(function(val) {
            return '' + val;
          });
        }
      };
    });
})();

