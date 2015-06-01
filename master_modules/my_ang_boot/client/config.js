/*global angular */
/*jslint node: true */
"use strict";

var clientConfig = require("../../../../../tmp/client_config.js");

(function () {
	// Declare app level module which depends on filters, and services

	angular.module('config',[])
		.constant('clientConfig', clientConfig);

}());
