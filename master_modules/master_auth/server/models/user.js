/*jslint node: true */
"use strict";

var U = require("underscore");
var mk = require("syncorm").mk;

module.exports = function(db) {

	db.define({
		name: "User",
		table: "users",
		id: "name",
		fields: {
			name: {
				type: "string",
				dbFieldName: "nom"
			},
			password: {
				type: "string"
			},
			lang: {
				type: "string",
				dbFieldName: "idioma"
			}
		}
	});

	db.User.prototype.can = function(pol) {
		var arr = pol.split(".");
		if (arr.length !== 2 ) return false;
		var idmodule = arr[0].toUpperCase();
		var right = arr[1].toUpperCase();

		var found = mk.find(this.rights, function(r) {
			if ((r.idmodule === idmodule) && (r.right === right) && (r.option.toUpperCase() ==="SI")) return true;
			if ((r.idmodule === "MASTER") && (r.right === "ADMIN") && (r.option.toUpperCase() ==="SI")) return true;
		});

		return found ? true : false;

	};

	db.can = function(req, right) {
		if (!req.user) return false;
		if (!db.users[req.user.idUser]) return false;
		return db.users[req.user.idUser].can(right);
	};

};
