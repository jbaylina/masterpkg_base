/*jslint node: true */
/*global angular */
/*global CKEDITOR */

(function () {
    "use strict";

    var mod = angular.module('ckeditor', []);

    mod.directive('ckEditor', ["$timeout", "clientConfig",
        function ($timeout, clientConfig) {
            return {
                require: '?ngModel',
                scope:{
                    transLangDefault: "=",
                    transLang: "=",
                    transUrlApi: "="
                },
                link: function (scope, elm, attr, ngModel) {
                    CKEDITOR.config.protectedSource = [/<%.*%>/g, /&nbsp;/g, /<>/g];
                    CKEDITOR.config.allowedContent = true;

                    if(clientConfig && clientConfig.ckeditor){
                        if(clientConfig.ckeditor.filebrowserUploadUrl) {
                            CKEDITOR.config.filebrowserUploadUrl = clientConfig.ckeditor.filebrowserUploadUrl;
                        }

                        if(clientConfig && clientConfig.ckeditor.filebrowserBrowseUrl) {
                            CKEDITOR.config.filebrowserBrowseUrl = clientConfig.ckeditor.filebrowserBrowseUrl;
                        }
                    }

                    var translate = {};
                    if(scope.transLang && scope.transUrlApi){
                        translate = {
                            name: 'translate',
                            items: ['Translate']
                        }
                        var oldValue = undefined;
                        scope.$watch('transLangDefault', function(newValue) {
                            if(newValue!=='' && newValue!=oldValue){
                                CKEDITOR.config.transLangDefault = newValue;
                            }
                            oldValue = newValue;
                        });
                    }

                    CKEDITOR.config.transUrlApi = scope.transUrlApi;

                    var ck = CKEDITOR.replace(elm[0], {
                        transLang: scope.transLang,
                        extraPlugins: 'justify,colorbutton,font,translate',
                        toolbar: [
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
                                name: 'links',
                                items: []
                            },
                            {
                                name: 'insert',
                                items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar', 'Link']
                            },
                            {
                                name: 'tools',
                                items: ['Maximize']
                            },
                            {
                                name: 'document',
                                items: ['Source', '-', 'NewPage', 'Preview', '-', 'Templates']
                            },
                            '/',
                            {
                                name: 'styles',
                                items: ['Format', 'Font', 'FontSize']
                            },
                            {
                                name: 'basicstyles',
                                items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', 'basicstyles', 'cleanup']
                            },
                            {
                                name: 'paragraph',
                                items: ['NumberedList', 'BulletedList', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
                            },
                            {
                                name: 'colors',
                                items: ['TextColor', 'BGColor']
                            },
                            translate
                        ],
                        height: '290px',
                        width: '99%'
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

                    ck.on('key',
                        function () {
                            $timeout(function () {
                                ngModel.$setViewValue(ck.getData());
                            });
                        });

                    ngModel.$render = function () {
                        ck.setData(ngModel.$viewValue);
                    };

                }
            };
        }]);
})();
