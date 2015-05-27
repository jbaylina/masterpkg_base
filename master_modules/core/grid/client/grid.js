/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('grid',[]);
	mod.directive('grid', function() {
		return {
			templateUrl: 'templates/grid.html',
			restrict: 'E',
			scope: {
				data: '=data',
				config: '=config',
				selection: '=selection'
			},
			link: function(scope, elem, attrs) {
				if (!scope.config) return;
				function getKey(r) {
					var key = "";
					var keys = scope.config.key;
					if (!keys) {
						keys = Object.keys(scope.config.fields);
					}
					keys.forEach(function(k) {
						if (key!== "") key += "|";
						key += r[k];
					});
					return key;
				}
				console.log(scope.data);
				scope.isChecked = function(record) {
					if (!scope.selection) {
						return false;
					}
					var k = getKey(record);
					if (scope.selection.indexOf(k) >= 0) {
						return true;
					} else {
						return false;
					}
				};
				scope.check = function(record, $event) {
					var k = getKey(record);
					if($event.shiftKey) {
						console.log("Shift pressed");
					}
					if (scope.selection.indexOf(k) <0) {
						scope.selection.push(k);
					}
				};
				scope.uncheck = function(record, $event) {
					var k = getKey(record);
					var idx = scope.selection.indexOf(k);
					if (idx >= 0) {
						scope.selection.splice(idx, 1);
					}
				};
			}
		};
	});
})();
