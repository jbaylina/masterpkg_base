/*jslint node: true */
"use strict";

var U = require("underscore");

module.exports = function(db) {

    db.define({
        name: "Session",
        table: "sessions",
        id: "sid",
        fields: {
            sid: "string",
            data: {
                type: "json"
            },
            date: "datetime",
            idUser: {
                type: "string",
                dbFieldName: "iduser"
            }
        }
    });

    db.removeUserSessions = function(idUser, cb) {
        db.doTransaction(function() {
            U.each(db.sessions, function(session) {
                if (session.idUser === idUser) {
                    session.remove();
                }
            });
        }, cb);
    };
};
