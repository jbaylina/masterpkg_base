/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('generic_dialogs',[]);

	mod.service('GenericDialogs', ['$uibModal',
		function ($uibModal) {
			this.notification = function (msg) {
				return $uibModal.open({
					templateUrl: "templates/generic_dialogs/notification.html",
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
				return $uibModal.open({
					templateUrl: "templates/generic_dialogs/confirmation.html",
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
			this.getText = function (title,msg,valor) {
				valor = valor || "";
				return $uibModal.open({
					templateUrl: "templates/generic_dialogs/gettext.html",
					controller: "GetTextDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msg: msg,
								title: title,
								valor: valor
							};
						}
					}
				});
			};
			this.getString = function (title,msg,valor) {
				valor = valor || "";
				return $uibModal.open({
					templateUrl: "templates/generic_dialogs/getstring.html",
					controller: "GetStringDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msg: msg,
								title: title,
								valor: valor
							};
						}
					}
				});
			};
			this.getInteger = function (title,msg,value,min, max) {
				value = value || 0;
				return $uibModal.open({
					templateUrl: "templates/generic_dialogs/getinteger.html",
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
				return $uibModal.open({
					templateUrl: "templates/generic_dialogs/error.html",
					controller: "ErrorDialogCtrl",
					backdrop: false,
					resolve: {
						params: function () {
							return {
								msgs: msgs,
								msg: msg
							};
						},
					}
				});
			};
		}
	]);


	mod.controller('NotificationDialogCtrl', function ($scope, $uibModalInstance, params) {
		$scope.msg = params.msg;

		$scope.close = function (a) {
			$uibModalInstance.close();
		};
	});

	mod.controller('CopyClipboardDialogCtrl', function ($scope, $uibModalInstance, params) {
		var ta;
		$scope.msg = params.msg;

		$scope.close = function (a) {
			$uibModalInstance.close();
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

	mod.controller('GetStringDialogCtrl', function ($scope, $uibModalInstance, params) {
		$scope.data = {};
		$scope.data.msg = params.msg;
		$scope.data.title = params.title;
		$scope.data.valor = params.valor;

		$scope.cancel = function () {
			$uibModalInstance.dismiss("no");
		};

		$scope.ok = function (a) {
			$uibModalInstance.close($scope.data.valor);
		};
	});

	mod.controller('GetTextDialogCtrl', function ($scope, $uibModalInstance, params) {
		$scope.data = {};
		$scope.data.msg = params.msg;
		$scope.data.title = params.title;
		$scope.data.valor = params.valor;

		$scope.cancel = function () {
			$uibModalInstance.dismiss("no");
		};

		$scope.ok = function (a) {
			$uibModalInstance.close($scope.data.valor);
		};
	});

	mod.controller('GetIntegerDialogCtrl', function ($scope, $uibModalInstance, params) {
		$scope.data = {};
		$scope.data.msg = params.msg;
		$scope.data.title = params.title;
		$scope.data.value = params.value;
		$scope.data.min = params.min || 0;
		$scope.data.max = params.max || 100;

		$scope.cancel = function () {
			$uibModalInstance.dismiss();
		};

		$scope.ok = function (a) {
			$uibModalInstance.close($scope.data.value);
		};
	});

	mod.controller('ConfirmationDialogCtrl', function ($scope, $uibModalInstance, params) {
		$scope.msg = params.msg;

		$scope.no = function () {
			$uibModalInstance.dismiss("no");
		};

		$scope.si = function (a) {
			$uibModalInstance.close("si");
		};
	});

	mod.controller('ErrorDialogCtrl', function ($scope, $uibModalInstance, params) {
		if (!params.msgs) {
			$scope.msgs =[];
		} else if ( params.msgs instanceof Array) {
			$scope.msgs = params.msgs;
		} else {
			$scope.msgs = [ params.msgs ];
		}
		$scope.msg = params.msg;

		$scope.ok = function (a) {
			$uibModalInstance.close("si");
		};
	});

	mod.run(['$http', '$templateCache', function($http, $templateCache){
		var template = 'templates/generic_dialogs/notification.html';
		$http.get(template)
		.then(function(res){
			$templateCache.put(template, res.data);
		});
	}]);

})();
