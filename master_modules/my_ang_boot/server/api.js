/*jslint node: true */
/*global __mods */
/*global __top */
'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var config = __mods.config;
var logger = __mods.logger;

module.exports = function(app) {
	_.each(config.masterModules, function(module, moduleName) {
		var moduleApiPath = path.join(process.cwd(), module.dir, 'server', 'api');
		var fstat;
		try {
			fstat = fs.lstatSync(moduleApiPath);
		} catch (err) {
			fstat = null;
		}
		if ((fstat)&&(fstat.isDirectory())) {
			fs.readdirSync(moduleApiPath).forEach(function(file) {
				var fullpath = path.join(moduleApiPath, file);
				if (path.extname(fullpath) === '.js') {
					logger.log('verbose','Loading api: ' + fullpath);
					require(fullpath)(app);
				}
			});
		}
	});
};

