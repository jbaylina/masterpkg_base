/*
 CREATE TABLE IF NOT EXISTS `winston_log` (
 `id` int(10) NOT NULL AUTO_INCREMENT,
 `level` varchar(45) NOT NULL,
 `message` text NOT NULL,
 `timestamp` datetime NOT NULL,
 `meta` varchar(255)
 PRIMARY KEY (`id`)
 );
 */

var util = require('util'),
    winston = require('winston'),
    mysql = require('mysql');

var Mysql = winston.transports.Mysql = function (options) {
    if (options.connection.constructor.name !== "Connection" && options.connection.constructor.name !== "Pool") {
        throw new Error("Argument Missing. Requires options.connection or options.pool");
    }
    this.name = 'Mysql';
    this.level = options.level || 'warn';
    this.connection = options.connection;
    this.silent = options.silent || false;
    this.table = options.table || 'winston_log'
};

util.inherits(Mysql, winston.Transport);

Mysql.prototype.log = function (level, msg, meta, callback) {
    if (this.silent) {
        return callback && callback(null, true);
    }
    var self = this;

    var log = {
        level: level,
        message: msg,
        timestamp: new Date(),
        meta: JSON.stringify(meta)
    };

    var query = 'INSERT INTO ' + self.table + ' SET ?';

    this.connection.query(query, log, function (err) {
        if (err) {
            return callback && callback(err, false);
        }
        return callback && callback(null, true);
    });
};

exports.Mysql = Mysql;