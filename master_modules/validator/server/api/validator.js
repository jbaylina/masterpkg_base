/*jslint node: true */
/* global __mods */
"use strict";

var db= __mods.db;
var config = __mods.config;
var _ = require('lodash');
var MasterError = __mods.MasterError;
var path = require('path');
var fs = require('fs');
var api = __mods.api;

module.exports = function(app) {
	app.get(config.apiPrefix + '/swagger', getItems);
};

function getItems(req, res, next) {
	try {

		var paths = {};
		var i = 0;
		var pathsApi = api.getPaths();

		for (i = 0; i < pathsApi.length; i++) {
			var path = pathsApi[i];

			if(!paths[path.path]){
				paths[path.path] = {};
			}
			if(!paths[path.path][path.method]){
				paths[path.path][path.method] = {};
			}
			paths[path.path][path.method] = {
				description: path.description,
				summary: path.summary,
				tags: [path.name],
				produces: [
					"application/json"
				],
				parameters: path.parameters,
				responses: {
					200: {
						description: path.resp200.description
					}
				}
			};
			if(path.resp200.model){
				paths[path.path][path.method].responses = {
					200: {
						description: path.resp200.description,
						schema: {
							type: "array",
							items: {
								"$ref": "#/definitions/"+path.resp200.model
							}
						}
					}
				};
			}
			paths[path.path][path.method].responses.default = {
				description: "unexpected error",
				schema: {
					"$ref": "#/definitions/Error"
				}
			};
		}

		var apiModels = {};
		var models = api.getModels();
		for (i = 0; i < models.length; i++) {
			var model = models[i];
			if(!apiModels[model.name]){
				apiModels[model.name] = {};
			}
			apiModels[model.name] = {
				type: model.type,
				properties: model.properties
			};
		}

		apiModels.Error = {
			type: "object",
			properties: {
				errorCode: {
					type: "string",
				},
				errorMsg: {
					type: "string",
				}
			}
		};

		var host = config.clientConfig.apiPrefix.substring(0, config.clientConfig.apiPrefix.length - 4);
		host = host.substring(7, host.length);

		var json = {
			swagger: "2.0",
			info: {
				description: "Documentación de la API",
				version: "2.0.0",
				title: "API aph",
				contact: {
					name: "MasterASP Team",
					url: "http://masterasp.com",
					email: "francesc@masterasp.com"
				}
			},
			host: host,
			basePath: "/api",
			schemes: [
				"http"
			],
			paths : paths,
			tags: api.getTags(),
			definitions: apiModels,
			securityDefinitions: {
				api_key: {
					type: "apiKey",
					name: "api_key",
					in: "header"
				},
				Cookie: {
					type: "apiKey",
					name: "api_key",
					in: "body"
				}
			},
		};

		res.json(json);

	} catch(err) {
		return next(err);
	}
}