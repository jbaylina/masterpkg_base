/*jslint node: true */
/*global __top, __mods */
"use strict";

exports.init = function () {

    var passport = require('passport');

    var config = __mods.config;
    var winston = require('winston');
    require('winston-daily-rotate-file');
    var fs = require('fs');
    var _ = require('underscore');

    var loggerConfig = {
        transports: [],
        exitOnError: (config.winston && config.winston.exitOnError) ? config.winston.exitOnError : false
    };

    if (!fs.existsSync('logs')) fs.mkdirSync('logs');

    loggerConfig.transports.push(new winston.transports.DailyRotateFile({
        filename: (config.winston && config.winston.filename) ? config.winston.filename : "logs/output.log",
        level: (config.winston && config.winston.level) ? config.winston.level : "debug",
        handleExceptions: (config.winston && config.winston.handleExceptions) ? config.winston.handleExceptions : false,
        humanReadableUnhandledException: true,
        prepend: true,
        maxFiles: config.winston.maxFiles || 7
    }));

    loggerConfig.transports.push(new winston.transports.Console({
        level: (config.winston && config.winston.level) ? config.winston.level : "debug",
        colorize: true,
        handleExceptions: (config.winston && config.winston.handleExceptions) ? config.winston.handleExceptions : false,
        humanReadableUnhandledException: true
    }));

    var logger = new winston.Logger(loggerConfig);

    if ((config.winston) && (config.winston.exitOnAllError)) {
        logger.on('logging', function (transport, level, msg, meta) {
            if (transport.name === "console" && level === "error") {
                setTimeout(function () {
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
    global.MasterError = require('../common/mastererror');


    var app = __mods.app = express();

    var server = http.createServer(app);

    if (config.https) {
        var https = require('https');
        var options = {
            key: fs.readFileSync('key.pem'),
            cert: fs.readFileSync('key-cert.pem')
        };
        var serverHttps = https.createServer(options, app);
        if (config.timeout) {
            serverHttps.setTimeout(config.timeout);
        }
        __mods.server = serverHttps;
    } else {
        __mods.server = server;
    }

    var timeout = require('connect-timeout');

    db.on('error', function (err) {
        logger.log('error', err.toString(), err);
    });

    db.on('init', function () {

        if (config.winston && config.winston.mySqlLevel) {
            var tmpTransporter = require('./winston_mysql_transport.js').Mysql;
            var dataBaseOptions = {
                connection: db.$driver.pool,
                level: config.winston.mySqlLevel
            };
            logger.add(winston.transports.Mysql, dataBaseOptions);
        }

        app.set('port', config.port || 3000);

        app.use(express.static(path.join(__top, 'dist')));

        // We syncronize with database on each call

        if (config.database.synchronize) {
            app.use(function (req, res, next) {
                if (req.url.indexOf(config.apiPrefix) === 0) {
                    db.refreshDatabase(next);
                } else {
                    next();
                }
            });
        }

        app.use(function (req, res, next) {
            if (req.url.indexOf(config.apiPrefix) === 0) {
                res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                res.header('Expires', '-1');
                res.header('Pragma', 'no-cache');
            }
            next();
        });

        if (config.accessLog) {
            var accessLogStream = fs.createWriteStream(config.accessLog || "logs/access.log", {flags: 'a'});
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

        if (config.requestTimeout !== false) {
            app.use(timeout('20s'));
        }
        app.use(bodyParser.json({limit: '50mb'}));

        app.use(passport.initialize());

        app.use(passport.session());

        var callId = (new Date()).getTime();
        app.use(function (req, res, next) {
            callId += 1;
            req.callId = callId;
            if (req.url.indexOf(config.apiPrefix) === 0) {
                req.log = function (level, msg, meta) {
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
                    body: req.body ? JSON.stringify(req.body).substr(0, 2048) : null
                });

                req.on("timeout", function () {
                    res.json = function (j) {
                        logger.log("warn", "res.json not sended: ", j);
                    };
                    res.end = function (j) {
                        logger.log("warn", "res.end not sended: ", j);
                    };
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
                res.end = function (chunk, encoding) {

                    if (chunk)
                        chunks.push(chunk);

                    oldEnd.apply(res, arguments);

                    var body;

                    if (chunks.length === 1 && typeof chunk === "string") {
                        body = chunk;
                    } else {
                        body = Buffer.concat(chunks).toString('utf8');
                    }

                    var meta = {
                        status: res.statusCode,
                        response_time: (new Date() - req._rlStartTime),
                        body: body ? JSON.stringify(req.body).substr(0, 2048) : null
                    };

                    if (req.debugTime || config.debugTime) {
                        console.log(req.originalUrl + " : " + (new Date() - req._rlStartTime) + " ms");
                    }

                    req.log('debug', 'response', meta);
                };
            }
            next();
        });

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

        app.all('*', function (req, res, next) {
            if (req.method === "OPTIONS") {
                return next();
            }
            if (req.url.indexOf(config.apiPrefix) === 0) {
                return next(new Error("Invalid call: " + req.url));
            }
            res.sendFile(path.resolve(path.join(__top, 'dist', 'index.html')));
        });

        app.use(function (err, req, res, next) {

            if (err.code && err.code === "ETIMEDOUT") {
                logger.log("warn", "ETIMEDOUT : Timeout error : ", {
                    method: req.method,
                    originalUrl: req.originalUrl,
                    statusCode: res.statusCode,
                    body: req.body,
                    params: req.params,
                    query: req.query,
                    headers: req.headers,
                    user: req.user || {},
                    _remoteAddress: req._remoteAddress
                });
            }

            var errObj = {};
            if (err.code) {
                errObj.code = err.code;
            } else if (err.errorCode) {
                errObj.code = err.errorCode;
            } else {
                if (err.name) {
                    errObj.code = "generic." + err.name;
                } else {
                    errObj.code = "generic.generic";
                }
            }

            if (err.message) {
                errObj.message = err.message;
                errObj.errorMsg = err.message;
            }

            if (err.stack) errObj.stack = err.stack;
            logger.log("warn", errObj.code, errObj);
            delete errObj.stack;

            if (err.code === "security.accessDenied" || err.errorCode === "security.accessDenied") {
                res.status(403);
            } else if (err.code === "ETIMEDOUT") {
                res.status(408);
            } else {
                res.status(500);
            }

            if (!res.finished) {
                res.json(errObj);
            }
        });

        server.listen(app.get('port'), function () {
            console.log('Express server listening on port ' + app.get('port'));
            logger.log('verbose', 'Express server listening on port ' + app.get('port'));
        });

        if (config.https) {
            serverHttps.listen(8000, function () {
                console.log('Express server HTTPS listening on port 8000');
                logger.log('verbose', 'Express server HTTPS listening on port 8000');
            });
        }
    });
};