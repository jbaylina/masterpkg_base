/*jslint node: true */
/*global angular */
/*global CKEDITOR */

(function () {
    "use strict";

    var mod = angular.module('date_editor', []);

    mod.directive('dateEditor', ['gettextCatalog', '$timeout', function (gettextCatalog, $timeout) {
        return {
            restrict: 'E',
            scope: {
                ngModel: "=",
                minDate: "=",
                maxDate: "=",
                ngRequired: "="
            },
            template: function (element, attrs) {

                var tmpTemplate = '<input class="form-control" ' +
                    ' type="text" ' +
                    ' ng-model="ngModel" ';

                if (attrs.$attr.ngRequired) {
                    tmpTemplate += ' ng-required="ngRequired" ';
                }

                tmpTemplate += ' uib-datepicker-popup="{{format}}" ' +
                    ' is-open="status.opened" ' +
                    ' datepicker-options="dateOptions" ' +
                    ' date-disabled="false" ' +
                    ' ng-focus="open($event)" ' +
                    ' on-open-focus="false" ' +
                    ' clear-text="{{clearText}}"' +
                    ' close-text="{{closeText}}"' +
                    ' current-text="{{currentText}}"' +
                    ' name="' + attrs.name + '"' +
                    '</input>';

                return tmpTemplate;
            },
            link: function ($scope, elm, attr) {

                $scope.status = {
                    opened: false
                };

                var lang = gettextCatalog.getCurrentLanguage();
                if ((lang === 'es') || (lang === 'ca')) {
                    $scope.format = "dd/MM/yyyy";
                } else {
                    $scope.format = "yyyy-MM-dd";
                }
                $scope.clearText = gettextCatalog.getString('Clear');
                $scope.closeText = gettextCatalog.getString('Close');
                $scope.currentText = gettextCatalog.getString('Today');

                $scope.dateOptions = {
                    formatYear: 'yyyy',
                    startingDay: 1,
                    minDate: $scope.minDate,
                    maxDate: $scope.maxDate
                };

                $scope.$watch('minDate', function(){
                    if($scope.minDate) $scope.dateOptions.minDate = $scope.minDate;
                });

                $scope.$watch('maxDate', function(){
                    if($scope.maxDate) $scope.dateOptions.maxDate = $scope.maxDate;
                });

                $scope.open = function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.status.opened = true;
                };

                var ngModelController = elm.children().controller('ngModel');

                ngModelController.$parsers.push(function (viewValue) {

                    if(!viewValue) return null;

                    function fill(S, l) {
                        S = "" + S;
                        while (S.length < l) S = '0' + S;
                        return S;
                    }

                    viewValue = new Date(viewValue);
                    var y = viewValue.getFullYear();
                    var m = viewValue.getMonth() + 1;
                    var d = viewValue.getDate();

                    viewValue = new Date(fill(y, 4) + '-' + fill(m, 2) + '-' + fill(d, 2) + 'T00:00:00.000Z');

                    return viewValue;
                });

                // called with a 'yyyy-mm-dd' string to format
                ngModelController.$formatters.push(function (modelValue) {

                    if (modelValue) {
                        modelValue = new Date(modelValue);
                        modelValue = new Date(modelValue.toISOString().substr(0, 10));
                    }

                    return modelValue;
                });

            }
        };
    }]);
})();
