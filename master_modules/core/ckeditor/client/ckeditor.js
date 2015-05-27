/*jslint node: true */
/*global angular */
/*global CKEDITOR */

(function () {
    "use strict";

    var mod = angular.module('ckeditor',[]);

	mod.directive('ckEditor', function () {
		return {
			require: '?ngModel',
			link: function (scope, elm, attr, ngModel) {
				CKEDITOR.config.protectedSource = [/<%.*%>/g, /&nbsp;/g, /<>/g];
				var ck = CKEDITOR.replace(elm[0], {
					toolbar_Full: [
						{
							name: 'document',
							items: []
						},
						{
							name: 'clipboard',
							items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo']
						},
						{
							name: 'editing',
							items: ['Find', 'Replace', '-', 'SpellChecker', 'Scayt']
						},
						{
							name: 'forms',
							items: []
						},
						{
							name: 'basicstyles',
							items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript']
						},
						{
							name: 'paragraph',
							items: ['NumberedList', 'BulletedList', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
						},
						{
							name: 'links',
							items: []
						},
						{
							name: 'insert',
							items: ['SpecialChar']
						}, '/',
						{
							name: 'styles',
							items: ['Styles', 'Format', 'Font', 'FontSize']
						},
						{
							name: 'colors',
							items: []
						},
						{
							name: 'tools',
							items: ['Maximize']
						}
					],
					height: '290px',
					width: '99%',
				});

				if (!ngModel) {
					return;
				}

				//loaded didn't seem to work, but instanceReady did
				//I added this because sometimes $render would call setData before the ckeditor was ready
				ck.on('instanceReady', function () {
					ck.setData(ngModel.$viewValue);
				});

				ck.on('pasteState', function () {
					scope.$apply(function () {
						ngModel.$setViewValue(ck.getData());
					});
				});

				ngModel.$render = function (value) {
					ck.setData(ngModel.$viewValue);
				};

			}
		};
	});
})();
