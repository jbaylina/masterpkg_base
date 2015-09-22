/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('main',[]);
    mod.controller('MainCtrl', function ($scope,  $state, $location, $timeout, masterApi, GenericDialogs, clientConfig, gettextCatalog, principal, masterMenu) {
		$scope.principal = principal;
		$scope.version = clientConfig.version;

		$scope.logout = function() {
			principal.logout().then(function() {
				$scope.$broadcast('logout');
				$timeout(function() {
					$location.path("/login");
				},100);
			});
		};


		$scope.loginChanged = function() {
			$scope.mainMenu = masterMenu.getMenu();
		};

		$scope.mainMenu = [];

		console.log(JSON.stringify($scope.mainMenu));
	});
})();
