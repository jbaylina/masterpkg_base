/*jslint node: true */
"use strict";

var session = require('express-session');

var SSStorage = function(db) {
    this.db = db;
};

SSStorage.prototype.__proto__ = session.Store.prototype;

SSStorage.prototype.get = function(sid, cb) {
    if (this.db.sessions[sid]) {
        return cb(null, this.db.sessions[sid].data);
    } else {
        return cb(null, null);
    }
};

SSStorage.prototype.set = function (sid, data, cb) {
    var self = this;
    self.db.doTransaction(function() {
        var session = self.db.sessions[sid];
        if (!session) {
            session= new self.db.Session({sid: sid});
        }
        session.data=data;
        session.idUser=data.passport.user;
        session.date=new Date();
    }, cb);
};

/**
* Destroy a session's data
*/
SSStorage.prototype.destroy = function (sid, cb) {
    var self = this;
    self.db.doTransaction(function() {
        var session = self.db.sessions[sid];
        if (!session) session.remove();
    }, cb);
};

module.exports = SSStorage;
