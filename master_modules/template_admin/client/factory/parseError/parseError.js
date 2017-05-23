/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('parseError',[]);

    mod.factory('parseError', ['gettextCatalog', 'clientConfig', '$state', 'principal', function (gettextCatalog, clientConfig, $state, principal) {

        var contHistory = 0;
        var limitLI = 20;
        function actHistory(item){

            var list = document.getElementById("actionHistory");
            var newItem = document.createElement("LI");

            var d = new Date();
            var h = d.getHours();
            var m = d.getMinutes();
            var day = d.getDay();
            var me = d.getMonth() + 1;
            var y = d.getFullYear();

            var html = '<div class="dropdown-messages-box">';
                    html += '<a class="pull-left" href="'+item.link+'">';
                        var classTxt = '';
                        if(item.class=='success'){
                            html += '<i class="fa fa-save pictoSuccess pictoImg" /></i>';
                            classTxt = 'pictoSuccess';
                        }else if(item.class=='error'){
                            html += '<i class="fa fa-save pictoError pictoImg" /></i>';
                            classTxt = 'pictoError';
                        }else if(item.class=='info'){
                            html += '<i class="fa fa-save pictoInfo pictoImg" /></i>';
                            classTxt = 'pictoInfo';
                        }
                    html += '</a>';
                html += '<div class="media-body '+classTxt+'">';
                    html += '<a href="'+item.link+'">';
                        html += '<strong>'+item.title+'</strong>';
                    html += '</a>';
                    html += '<br />';
                    html += '<small class="text-muted3">'+h+':'+m+' - '+day+'.'+me+'.'+y+'</small>';
                html += '</div>';
            html += '</div>';
            html += '<div class="divider">&nbsp;</div>';

            newItem.innerHTML = html;
            if(contHistory>=limitLI){
                // eliminar ultimo
                $('#actionHistory').children().last().remove();
                contHistory--;
            }
            list.insertBefore(newItem, list.childNodes[0]);
            contHistory++;
        }

        return {
            view: function (error) {
                if(error.status && error.status == -1){
                    sweetAlert('503', gettextCatalog.getString('The service is unavailable'), "error");
                }else if (error.status == 403) {
                    if(principal.isAuthenticated()){
                        $state.go('forbiden');
                    }else{
                        $state.go('login');
                    }
                } else if (error.status == 408) {
                    $state.go('timeout');
                } else {
                    var titleError = (error.status) ? error.status.toString() : 'Error';
                    var messageError = '';
                    if (error.data && error.data.message) {
                        messageError = error.data.message;
                    } else if (error.message) {
                        messageError = error.message;
                    } else {
                        messageError = gettextCatalog.getString('Generic error');
                    }
                    if(principal.isAuthenticated()) {
                        sweetAlert(titleError, messageError, "error");
                    }
                }
                return;
            },
            delete: function(message,cb){
                swal({
                    title: gettextCatalog.getString("Are you sure?"),
                    text: message,
                    type: "warning",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: gettextCatalog.getString("Yes, delete it!"),
                    showCancelButton: true,
                    showLoaderOnConfirm: true
                }).then(function(){cb();});
            },
            goBack: function(message,cb){
                swal({
                    title: gettextCatalog.getString("Are you sure?"),
                    text: message,
                    type: "info",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: gettextCatalog.getString("Yes, go back!"),
                    showCancelButton: true,
                    showLoaderOnConfirm: true
                }).then(function(){cb(); swal.close(); });
            },
            deleteSuccess: function (message) {
                if (!message) {
                    message = gettextCatalog.getString('Has been deleted.');
                }
                swal(gettextCatalog.getString("Deleted!"), message, "success");
                return;
            },
            ntfyInfo: function(msg, link){
                actHistory({
                    title: msg,
                    class: 'success',
                    link: link,
                });
            },
            saveOk: function(msg, link, cb){
                actHistory({
                    title: msg,
                    class: 'success',
                    link: link
                });
                toastr.success(msg, gettextCatalog.getString('Saved successfully'), {
                    "closeButton": true,
                    "preventDuplicates": false,
                    "progressBar": true,
                    "positionClass": "toast-bottom-right",
                    "showDuration": "200",
                    "hideDuration": "500",
                    "timeOut": "2500",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                });
                toastr.options.onclick = cb;
            },
            saveKo: function(msg, link, cb){
                actHistory({
                    title: msg,
                    class: 'error',
                    link: link
                });
                toastr.error(msg, gettextCatalog.getString('Failed to save'), {
                    "closeButton": true,
                    "preventDuplicates": false,
                    "progressBar": true,
                    "positionClass": "toast-bottom-right",
                    "showDuration": "200",
                    "hideDuration": "500",
                    "timeOut": "3000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                });
                toastr.options.onclick = cb;
            },
            deleteError: function(err){
                var html = '';
                if (err.data && err.data.message) {
                    html += '<p>'+err.data.message+'</p>';
                }

                html += '<div class="dBug">';
                    html += '<input type="checkbox" name="toggle" id="toggle"/>';
                    html += '<label for="toggle"></label>';
                    html += '<div class="dBugBody"><pre>';
                        html += JSON.stringify(err.data, null, 2);
                    html += '</pre></div>';
                html += '</div>';

                swal({
                    title: gettextCatalog.getString("Error deleting"),
                    type: "error",
                    text: html,
                    allowOutsideClick: false,
                    html: true
                });
                return;
            }
        }
    }]);
})();