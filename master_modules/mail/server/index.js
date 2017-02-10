/*jslint node: true */
/*global __mods */
"use strict";

var _ = require('lodash');
var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;
var serverMailConfig;
var transporter;

var log = function (level, msg, meta) {
    if(!__mods.logger) {
        console.log("logger not defined on mail");
        return;
    }
    meta = meta || {};
    meta = _.extend(meta, {
        module: 'mail'
    });
    __mods.logger.log(level, msg, meta);
};

/**
 *
 * @param options Options values for set mail config
 {
    secure: optional,
    greetingTimeout: defined || default=30000,
    auth: {
        user: required (if auth exists)
        pass: required (if auth exists)
    }
    host: required,
    port: optional || default=25,
    html: options.html
 }
 * @param callback(err, flag)
 */
function setMailConfig(config, callback){
    try {
        serverMailConfig = {
            secure: false
        };

        if(config.secure) serverMailConfig.secure = config.secure;

        serverMailConfig.greetingTimeout = config.greetingTimeout || 30000;

        if (config.auth) {
            if(!config.auth.user) return callback("auth.user not defined");
            if(!config.auth.pass) return callback("auth.pass not defined");
            serverMailConfig.auth = config.auth;
        }

        serverMailConfig.host = config.host;
        serverMailConfig.port = config.port || 25;

        if (config.ignoreTLS) serverMailConfig.ignoreTLS = true;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = config.NODE_TLS_REJECT_UNAUTHORIZED || '0';

        transporter = nodemailer.createTransport(serverMailConfig);
        transporter.use('compile', htmlToText());

        callback();
    } catch(err) {
        callback(err);
    }

}

/**
 *
 * @param options Options values for set mail config
 {
    secure: optional,
    greetingTimeout: defined || default=30000,
    html: options.html
 }
 * @param callback(err)
 */
function mail(mailOptions, callback){

    if(!serverMailConfig && callback) return callback("Mail config not defined");

    transporter.sendMail(mailOptions, function (errMail) {
        if (errMail) {
            log("warn", "error sending generic mail", errMail);
            if(callback) callback(errMail);
        } else {
            log("silly", "mail sended to " + mailOptions.to);
            if(callback) callback();
        }
    });

}

global.setMailConfig = setMailConfig;
global.mail = mail;