/*jslint node: true */
/*global __top, __mods */
"use strict";

var passport = require('passport');

var config = __mods.config;
var winston = require('winston');
var _ = require('underscore');

var loggerConfig = {
	transports: [
		new winston.transports.Console({name: "console_err", level: config.logLevel})
	],
	exitOnError: false
};
if (config.log) {
	loggerConfig.transports.push ( new winston.transports.File({ filename: config.log, level: config.logLevel, handleExceptions: false  }));
}


var logger = new winston.Logger(loggerConfig);

logger.log("verbose", "Starting App");
__mods.logger = logger;

var http = require('http');
var express = require('express');
var session = require('express-session');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var SSSession = require('./syncorm_session_storage.js');

var path = require("path");
var fs = require("fs");

var db = __mods.db = require('./db');
__mods.MasterError = require('../common/mastererror');

var app = __mods.app =  express();

var server = http.createServer(app);
__mods.server = server;

db.on('init', function() {
	app.set('port', config.port || 3000);


	// We syncronize with database on each call

	if (config.database.synchronize) {
		app.use(function(req, res, next) {
			if (req.url.indexOf(config.apiPrefix) === 0) {
				db.refreshDatabase(next);
			} else {
				next();
			}
		});
	}

	app.use(function(req, res, next) {
		if (req.url.indexOf(config.apiPrefix) === 0) {
			res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
			res.header('Expires', '-1');
			res.header('Pragma', 'no-cache');
		}
		next();
	});

	if (config.accessLog) {
		var accessLogStream = fs.createWriteStream(config.accessLog, {flags: 'a'});
		app.use(morgan('combined', {stream: accessLogStream}));
	} else {
		app.use(morgan("dev"));
	}

	app.use(session({
		secret: config.sessionSecret,
		proxy: true,
		resave: true,
		saveUninitialized: true,
		store: new SSSession(db)
	}));

	app.use(bodyParser.json({limit: '50mb'}));

	app.use(passport.initialize());
	app.use(passport.session());

	var callId = (new Date()).getTime();
	app.use(function(req, res, next) {
		callId += 1;
		req.callId = callId;
		if (req.url.indexOf(config.apiPrefix) === 0) {
			req.log = function(level, msg, meta) {
				meta = meta || {};
				meta = _.extend(meta, {
					callId: req.callId,
					session: req.sessionID
				});
				logger.log(level, msg, meta);
			};
			req.log('debug', 'request', {
				method: req.method,
				url: req.originalUrl,
				ip: req.ip,
				body: req.body ? JSON.stringify(req.body).substr(0,2048) : null
			});

			var oldWrite = res.write;
			var oldEnd = res.end;

			var chunks = [];

			// To track response time
			req._rlStartTime = new Date();

			res.write = function (chunk) {
				chunks.push(chunk);

				oldWrite.apply(res, arguments);
			};

			// Proxy the real end function
			res.end = function(chunk, encoding) {
			  	if (chunk)
      				chunks.push(chunk);

      			oldEnd.apply(res, arguments);

      			var body = Buffer.concat(chunks).toString('utf8');

				var meta = {
					status: res.statusCode,
					response_time: (new Date() - req._rlStartTime),
					body: body ? JSON.stringify(req.body).substr(0,2048) : null
				};

				req.log('debug', 'response', meta);
			};
		}
		next();
	});

	app.use(express.static(path.join(__top, 'dist')));

	app.use(function (req, res, next) {
		// Website you wish to allow to connect
//		res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3001');
		if (req.headers.origin) {
			res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
		}

		// Request methods you wish to allow
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

		// Request headers you wish to allow
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

		// Set to true if you need the website to include cookies in the requests sent
		// to the API (e.g. in case you use sessions)
		res.setHeader('Access-Control-Allow-Credentials', true);

		// Pass to next layer of middleware
		next();
	});

	require('./api')(app);

	app.all('*', function(req, res,next) {
		if (req.method==="OPTIONS") {
			return next();
		}
		if (req.url.indexOf(config.apiPrefix) === 0) {
			return next(new Error("Invalid call: " + req.url));
		}
		res.sendFile(path.resolve(path.join(__top , 'dist' , 'index.html')));
	});

	app.use(function (err, req, res, next) {
		logger.error(err.stack);

		var errObj = {};
		if (err.errorCode) {
			errObj.errorCode = err.errorCode;
		} else {
			if (err.name) {
				errObj.errorCode = "generic." + err.name;
			} else {
				errObj.errorCode = "generic.generic";
			}
		}
		errObj.errorMsg = err.toString();
		if (errObj.errorCode === "security.accessDenied") {
			res.status(403);
		} else {
			res.status(500);
		}
		if (err.stack) {
			errObj.errorStackTrace = err.stack.toString();
		}
		res.json(errObj);
	});

	server.listen(app.get('port'), function () {
		console.log('Express server listening on port ' + app.get('port'));
		logger.log('verbose', 'Express server listening on port ' + app.get('port'));
	});
});
