/*jslint node: true */
/*global __top, __mods */
"use strict";

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _ = require('underscore');
var mk = require('syncorm').mk;


exports.init= function() {

    var db= __mods.db;
    var config = __mods.config;
    var log= __mods.log;

    function getUserObject(idUser) {
        var user = db.users[idUser.toUpperCase()];

            // Username does not exist, log error & redirect back
        if (!user) {
            return null;
        }

        var r = {
            idUser: user.name,
            userName: user.name,
            rights: []
        };

        if (user.lang === "CAT") {
            r.lang="ca";
        } else if (user.lang === "E") {
            r.lang="es";
        } else {
            r.lang="en";
        }

        mk.each(user.rights, function(right) {
            if (right.option.toUpperCase() === "SI") {
                r.rights.push(right.idmodule.toUpperCase()+'.'+right.right.toUpperCase());
            }
        });

        return r;
    }

    passport.serializeUser(function(user, done) {
      done(null, user.idUser);
    });

    passport.deserializeUser(function(id, done) {
        done(null, getUserObject(id));
    });

    passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
        // check in mongo if a user with username exists or not
            var user = db.users[username.toUpperCase()];

                // Username does not exist, log error & redirect back
            if (!user) {
                console.log('User Not Found with username '+username);
                return done(new Error('User Not found.'), false);
            }

            if (user.password !== password) {
                console.log('Invalid Password');
                return done(new Error('Invalid Password'), false);
            }

            var r = getUserObject(username);

            return done(null, r);
        }));
};
