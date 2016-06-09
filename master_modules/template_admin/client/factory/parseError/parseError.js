/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('parseError',[]);

    mod.factory('parseError', ['gettextCatalog', 'clientConfig', '$state', 'principal', function (gettextCatalog, clientConfig, $state, principal) {
        return {
            view: function (error) {
                if(error.status==-1){
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
                    closeOnConfirm: false,
                    showLoaderOnConfirm: true
                }, function(){cb();});
            },
            deleteSuccess: function (message) {
                if (!message) {
                    message = gettextCatalog.getString('Has been deleted.');
                }
                swal(gettextCatalog.getString("Deleted!"), message, "success");
                return;
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