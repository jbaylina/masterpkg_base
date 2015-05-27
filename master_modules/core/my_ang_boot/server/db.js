/*jslint node: true */
/* global __mods */
/* global __top */
"use strict";

var path = require("path");
var fs = require("fs");
var ORM = require("syncorm");
var config = __mods.config;
var logger = __mods.logger;
config.database.log = logger.log;

var db = new ORM.Database(config.database);
__mods.db = db;

var modulesPath = path.join(__top,"master_modules");



__mods.masterModules.forEach(function(module) {
	var moduleModelsPath = path.join(modulesPath, module, 'server', 'models');
	var fstat;
	try {
		fstat = fs.lstatSync(moduleModelsPath);
	} catch (err) {
		fstat = null;
	}
	if ((fstat)&&(fstat.isDirectory())) {
		fs.readdirSync(moduleModelsPath).forEach(function(file) {
			var fullpath = path.join(moduleModelsPath, file);
			if (path.extname(fullpath) === '.js') {
				logger.log("Loading model: " + fullpath);
				require(fullpath)(db);
			}
		});
	}
});

db.loadAll(function (err) {
	if (err) {
		logger.error(err.stack);
		return;
	}
	logger.verbose("Database loaded correctly");
});

module.exports = db;
