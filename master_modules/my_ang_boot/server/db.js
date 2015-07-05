/*jslint node: true */
/* global __mods */
/* global __top */
"use strict";

var path = require("path");
var fs = require("fs");
var ORM = require("syncorm");
var logger = __mods.logger;
var _ = require('underscore');
var config = __mods.config;
config.database.log = logger.log.bind(logger);

var db = new ORM.Database(config.database);
__mods.db = db;


_.each(config.masterModules, function(module, moduleName) {
	var moduleModelsPath = path.join(process.cwd(), module.dir, 'server', 'models');
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
