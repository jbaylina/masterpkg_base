/*jslint node: true */
/*global __top, __mods */
"use strict";

var passport = require('passport');

var config = __mods.config;
var winston = require('winston');
var _ = require('underscore');

var loggerConfig = {
    transports: [],
    exitOnError: (config.winston && config.winston.exitOnError) ? config.winston.exitOnError : false
};

if (config.log) {
    loggerConfig.transports.push( new winston.transports.File({
        filename: (config.winston && config.winston.filename) ? config.winston.filename : "output.log",
        level: (config.winston && config.winston.level) ? config.winston.level : "debug",
		handleExceptions: (config.winston && config.winston.handleExceptions) ? config.winston.handleExceptions : false
    }));
}

loggerConfig.transports.push(new winston.transports.Console({
	level: (config.winston && config.winston.level) ? config.winston.level : "debug",
    colorize: true,
    handleExceptions: (config.winston && config.winston.handleExceptions) ? config.winston.handleExceptions : false
}));

var logger = new winston.Logger(loggerConfig);

if ((config.winston) && (config.winston.exitOnAllError)) {
    logger.on('logging', function (transport, level, msg, meta) {
        if(transport.name === "file" && level === "error"){
            setTimeout(function() {
                process.exit(1);
            }, 1000);
        }
    });
}

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


if(config.https) {
	var https = require('https');
	var options = {
		key: fs.readFileSync('key.pem'),
		cert: fs.readFileSync('key-cert.pem')
	};
	var serverHttps = https.createServer(options, app);
	serverHttps.setTimeout(30000);
	__mods.server = serverHttps;
}else{
	__mods.server = server;
}

var timeout = require('connect-timeout');


server.setTimeout(30000);

db.on('error', function(err) {
	logger.log('error', err.toString(), err);
});





db.on('init', function() {
	app.set('port', config.port || 3000);

    app.use(express.static(path.join(__top, 'dist')));

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

	app.use(timeout('20s'));
	app.use(bodyParser.json({limit: '50mb'}));
	app.use(haltOnTimedout);

	app.use(passport.initialize());
	app.use(haltOnTimedout);

	app.use(passport.session());
	app.use(haltOnTimedout);


	var callId = (new Date()).getTime();
	app.use(function(req, res, next) {
		callId += 1;
		req.callId = callId;
		if (req.url.indexOf(config.apiPrefix) === 0) {
			req.log = function(level, msg, meta) {
				meta = meta || {};
				meta = _.extend(meta, {
					callId: req.callId,
					session: req.sessionID,
					method: req.method,
					url: req.originalUrl,
					ip: req.ip
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

      			var body;

                if(chunks.length === 1 && typeof chunk === "string") {
                    body = chunk;
                } else {
                    body = Buffer.concat(chunks).toString('utf8');
                }

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
	app.use(haltOnTimedout);

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
	app.use(haltOnTimedout);

	require('./api')(app);
	app.use(haltOnTimedout);

	app.all('*', function(req, res,next) {
		if (req.method==="OPTIONS") {
			return next();
		}
		if (req.url.indexOf(config.apiPrefix) === 0) {
			return next(new Error("Invalid call: " + req.url));
		}
		res.sendFile(path.resolve(path.join(__top , 'dist' , 'index.html')));
	});
	app.use(haltOnTimedout);

	app.use(function (err, req, res, next) {
		if(err.stack) logger.warn(err.stack);
		else logger.warn(err.toString());

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
	app.use(haltOnTimedout);

        function haltOnTimedout(err, req, res, next) {
            if ((req.timedout) && (!req.timeoutSended)) {

                logger.log("warn", "haltOnTimedout : Timeout", {
                    method        : req.method,
                    originalUrl   : req.originalUrl,
                    body          : req.body,
                    params        : req.params,
                    query         : req.query,
                    headers       : req.headers,
                    user          : req.user || {},
                    _remoteAddress: req._remoteAddress
                });
                req.timeoutSended = true;
                res.status(504).json(err);
            }
            if ((!req.timedout) && (!req.timeoutSended)) {
                if(err) return next(err);
                else return next();
            }
        }

        //function haltOnTimedout(err, req, res, next) {
        //    if (!req.timedout) return next(err);
        //    if (!req.timeoutLogged) {
        //        logger.log("warn", "Timeout");
        //        req.timeoutLogged = true;
        //    }
        //}

        server.listen(app.get('port'), function() {
            console.log('Express server listening on port ' + app.get('port'));
            logger.log('verbose', 'Express server listening on port ' + app.get('port'));
        });
		if(config.https) {
			serverHttps.listen(8000, function () {
				console.log('Express server HTTPS listening on port 8000');
				logger.log('verbose', 'Express server HTTPS listening on port 8000');
			});
		}
    }
);
