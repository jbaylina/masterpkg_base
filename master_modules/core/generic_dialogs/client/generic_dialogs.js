/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('generic_dialogs',[]);

	mod.service('GenericDialogs', ['$modal',
		function ($modal) {
			this.notification = function (msg) {
				return $modal.open({
					templateUrl: "templates/core/generic_dialogs/notification.html",
					controller: "NotificationDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msg: msg
							};
						},
					}
				});
			};
			this.confirmation = function (msg) {
				return $modal.open({
					templateUrl: "templates/core/generic_dialogs/confirmation.html",
					controller: "ConfirmationDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msg: msg
							};
						},
					}
				});
			};
			this.getString = function (title,msg,valor) {
				valor = valor || "";
				return $modal.open({
					templateUrl: "templates/core/generic_dialogs/getstring.html",
					controller: "GetStringDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msg: msg,
								title: title,
								valor: valor
							};
						},
					}
				});
			};
			this.getInteger = function (title,msg,value,min, max) {
				value = value || 0;
				return $modal.open({
					templateUrl: "templates/core/generic_dialogs/getinteger.html",
					controller: "GetIntegerDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msg: msg,
								title: title,
								value: value,
								min: min,
								max: max
							};
						},
					}
				});
			};
			this.error = function (msg, msgs) {
				return $modal.open({
					templateUrl: "templates/core/generic_dialogs/error.html",
					controller: "ErrorDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msgs: msgs,
								msg: msg,
							};
						},
					}
				});
			};
		}
	]);


	mod.controller('NotificationDialogCtrl', function ($scope, $modalInstance, params) {
		$scope.msg = params.msg;

		$scope.close = function (a) {
			$modalInstance.close();
		};
	});

	mod.controller('CopyClipboardDialogCtrl', function ($scope, $modalInstance, params) {
		var ta;
		$scope.msg = params.msg;

		$scope.close = function (a) {
			$modalInstance.close();
		};
	});

	mod.directive('selected', function () {
		return {
			ink: function ($scope, element, attrs) {
				setTimeout(function() {
					element[0].focus();
					element[0].select();
				},100);
			}
		};
	});

	mod.controller('GetStringDialogCtrl', function ($scope, $modalInstance, params) {
		$scope.data = {};
		$scope.data.msg = params.msg;
		$scope.data.title = params.title;
		$scope.data.valor = params.valor;

		$scope.cancel = function () {
			$modalInstance.dismiss("no");
		};

		$scope.ok = function (a) {
			$modalInstance.close($scope.data.valor);
		};
	});

	mod.controller('GetIntegerDialogCtrl', function ($scope, $modalInstance, params) {
		$scope.data = {};
		$scope.data.msg = params.msg;
		$scope.data.title = params.title;
		$scope.data.value = params.value;
		$scope.data.min = params.min || 0;
		$scope.data.max = params.max || 100;

		$scope.cancel = function () {
			$modalInstance.dismiss();
		};

		$scope.ok = function (a) {
			$modalInstance.close($scope.data.value);
		};
	});

	mod.controller('ConfirmationDialogCtrl', function ($scope, $modalInstance, params) {
		$scope.msg = params.msg;

		$scope.no = function () {
			$modalInstance.dismiss("no");
		};

		$scope.si = function (a) {
			$modalInstance.close("si");
		};
	});

	mod.controller('ErrorDialogCtrl', function ($scope, $modalInstance, params) {
		if (!params.msgs) {
			$scope.msgs =[];
		} else if ( params.msgs instanceof Array) {
			$scope.msgs = params.msgs;
		} else {
			$scope.msgs = [ params.msgs ];
		}
		$scope.msg = params.msg;

		$scope.ok = function (a) {
			$modalInstance.close("si");
		};
	});
})();
