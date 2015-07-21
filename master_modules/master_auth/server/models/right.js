/*jslint node: true */
"use strict";

module.exports = function(db) {

	db.define({
		name: "Right",
		table: "rights",
		dbTableName: "drets",
		id: ["iduser","idmodule", "right"],
		fields: {
			iduser: {
				type: "string",
				dbFieldName: "usuari"
			},
			idmodule: {
				type: "string",
				dbFieldName: "modul"
			},
			right: {
				type: "string",
				dbFieldName: "dret"
			},
			option: {
				type: "string",
				dbFieldName: "opcio"
			}
		},
		relations: {
			user: {
				type: "User",
				link: ["iduser"],
				reverse: "rights"
			}
		}
	});

};