/*jslint node: true */
/* global __mods */
"use strict";

var db= __mods.db;
var config = __mods.config;
var U = require('underscore');
var path = require('path');
var MasterError = __mods.MasterError;
var passport = require('passport');
var async = require('async');

module.exports = function(app) {
	app.get(config.apiPrefix + '/login', loginStatus);
	app.post(config.apiPrefix + '/login', login);
	app.delete(config.apiPrefix + '/login', logout);
	app.post(config.apiPrefix + '/login/changePassword', changePassword);
	app.post(config.apiPrefix + '/login/changePassword', changePassword);
	app.get(config.apiPrefix + '/login/otp/:otp', getOtpInfo);
	app.put(config.apiPrefix + '/login/otp/:otp', resetPassword);
	app.post(config.apiPrefix + '/user/:idUser/requestPasswordChange', rememberPassword);
};

function loginStatus(req, res, next) {
	if (!req.user) return res.json({});
	res.json(req.user);
}

function login(req, res, next) {
	passport.authenticate('login', function(err, user, info) {
		if (err) return next(err);
		if (!user) return next(new Error(info.message));
		async.series([function(cb) {
			if (config.singleUserSession) {
				db.removeUserSessions(user.idUser, cb);
			} else {
				return cb();
			}
		}],function(err) {
			if (err) return next(err);
			req.logIn(user, function(err) {
			    if (err) return next(err);
			    res.json(user);
			});
		});
	})(req, res, next);
}

function logout(req, res, next) {
	req.logout();
	res.json({});
}

function changePassword(req, res, next) {
	try {

		if (!req.user) {
			return next(new Error("User not logged in"));
		}

		if (req.body.newPassword !== req.body.confirmNewPassword) {
			return next(new Error("Password does not match"));
		}

		if (!passport.changePassword) {
			return next(new Error("changePassword not implemented"));
		}

		passport.changePassword(req.user, req.body.oldPassword, req.body.newPassword, function(err) {
			if (err) return next(err);
			res.json(req.user);
		});
	} catch(err) {
		return next(err);
	}
}

function getOtpInfo(req, res, next) {
	var otp = req.params.otp;
	if (!otp) {
		return next(new Error("InvalidOtp"));
	}

	if (!passport.getOtpInfo) {
		return next(new Error("getOtpInfo not implemented"));
	}

	passport.getOtpInfo(otp, function(err, otpInfo) {
		if (err) return next(err);
		res.json(otpInfo);
	});
}

function resetPassword(req, res, next) {
	try {

		var otp = req.params.otp;
		if (!otp) {
			return next(new Error("InvalidOtp"));
		}

		if (req.body.newPassword !== req.body.confirmNewPassword) {
			return next(new Error("Password does not match"));
		}

		if (!passport.changePasswordFromOtp) {
			return next(new Error("changePasswordFromOtp not implemented"));
		}

		passport.changePasswordFromOtp(otp, req.body.newPassword, function(err, user) {
			if (err) return next(err);
			req.logIn(user, function(err) {
			    if (err) return next(err);
			    res.json(user);
			});
		});
	} catch(err) {
		return next(err);
	}
}

function rememberPassword(req, res, next) {
	try {
		var idUser = req.params.idUser;
		if (!idUser) {
			return next(new Error("Invalid User Id"));
		}

		if (req.body.newPassword !== req.body.confirmNewPassword) {
			return next(new Error("Password does not match"));
		}

		if (!passport.requestPasswordChange) {
			return next(new Error("requestPasswordChange not implemented"));
		}

		passport.requestPasswordChange(idUser, function(err, user) {
			if (err) return next(err);
			res.json({});
		});
	} catch(err) {
		return next(err);
	}
}


