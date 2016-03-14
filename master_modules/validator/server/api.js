/*jslint node: true */
/*global __top, __mods */
"use strict";


var _ = require('lodash');
var Joi = require('joi');

var tags = [];
var models = [];
var paths = [];

exports.addTag = function addTag(tag){
	tags.push(tag);
};
exports.addModel = function addModel(model){
	models.push(model);
};
exports.addPath = function addPath(path){
    var config = __mods.config;
    var app = __mods.app;
    var middleware;

    if (path.validation) {
        middleware = __mods.joiExpress.joiValidate(path.validation);
    }
	paths.push(path);
	if(path.handler){
		switch(path.method){
			case 'get':
				if(middleware){
				 	app.get(config.apiPrefix + tranformPath(path.path), middleware, path.handler);
				}else{
					app.get(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
			case 'put':
				if(middleware){
					app.put(config.apiPrefix + tranformPath(path.path), middleware, path.handler);
				}else{
					app.put(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
			case 'post':
				if(middleware){
					app.post(config.apiPrefix + tranformPath(path.path), middleware, path.handler);
				}else{
					app.post(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
			case 'delete':
				if(middleware){
				 	app.delete(config.apiPrefix + tranformPath(path.path), middleware, path.handler);
				}else{
					app.delete(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
		}
	}

};
exports.getTags = function addTag(){
	return tags;
};
exports.getModels = function addModel(){
	return models;
};
exports.getPaths = function addPath(){
	return paths;
};

exports.syncorm2swagger = function(cls, sufix, selector) {
    var schema = cls.prototype.$schema;

    selector = selector || "M";
    sufix = sufix || "";

    var res = {
        name: schema.name + sufix,
        type: "object",
        properties: {}
    };

    _.each(schema.fields, function(field, fieldName) {
        if (field.visibility.indexOf(selector) < 0) return;
        var f;
        if (typeof field.publicType === "function") {
            f = field.publicType(selector);
        } else if (field.publicType) {
            f = {
                $ref: "#/definitions/" + field.publicType
            };
        } else {
            f = syncormType2Swagger(field);
        }
        res.properties[fieldName] = f;
    });

    _.each(schema.calculatedFields, function(field, fieldName) {
        if (field.visibility.indexOf(selector) < 0) return;
        var f = syncormType2Swagger(field);
        res.properties[fieldName] = f;
    });
    _.each(schema.relations, function(relation, relationName) {
        if (relation.visibility.indexOf(selector) < 0) return;
        res.properties[relationName] = {
            "$ref": "#/definitions/" + relation.type + sufix
        };
    });
    _.each(schema.reverseRelations, function(reverseRelation, reverseRelationName) {
        if (reverseRelation.visibility.indexOf(selector) < 0) return;
        res.properties[reverseRelationName] = {
            type: "array",
            items: {
                "$ref": "#/definitions/" + reverseRelation.cls.prototype.$schema.name + sufix
            }
        };
    });

    if (_.isEmpty(res.properties)) {
        res = null;
    }

    return res;

    function syncormType2Swagger(field) {
        var f;
        if (field.type === "boolean") {
            f= {
                type: "boolean"
            };
        } else if (field.type === "integer") {
            f= {
                type: "integer",
                format: "int64"
            };
        } else if (field.type === "string") {
            f= {
                type: "string"
            };
        } else if (field.type === "date") {
            f= {
                type: "string",
                format: "date"
            };
        } else if (field.type === "datetime") {
            f= {
                type: "string",
                format: "date-time"
            };
        } else if (field.type === "float") {
            f= {
                type: "number",
                format: "double"
            };
        } else if (field.type === "json") {
            f= {
                type: "object"
            };
        }
        return f;
    }
};

exports.syncorm2Joi = function(cls, sufix, selector) {
    var schema = cls.prototype.$schema;

    selector = selector || "M";
    sufix = sufix || "";

    var res = {
    };

    _.each(schema.fields, function(field, fieldName) {
        if (field.visibility.indexOf(selector) < 0) return;
        var f;
        if (typeof field.validation === "function") {
            f = field.validation();
        } else if (field.validation) {
            f = field.validation;
        } else {
            f = syncormType2Joi(field);
        }
        res[fieldName] = f;
    });

    _.each(schema.relations, function(relation, relationName) {
        if (relation.visibility.indexOf(selector) < 0) return;
        res[relationName] = exports.syncorm2Joi(  cls.prototype.$db.$classes[relation.type], sufix, selector);
    });
    _.each(schema.reverseRelations, function(reverseRelation, reverseRelationName) {
        if (reverseRelation.visibility.indexOf(selector) < 0) return;
        res[reverseRelationName] = Joi.array().items( exports.syncorm2Joi (reverseRelation.cls ,sufix, selector));
    });

    return Joi.object().keys(res);

    function syncormType2Joi(field) {
        var f;
        if (field.type === "boolean") {
            f= Joi.boolean();
        } else if (field.type === "integer") {
            f= Joi.number().integer();
        } else if (field.type === "string") {
            f= Joi.string();
        } else if (field.type === "date") {
            f= Joi.date().iso();
        } else if (field.type === "datetime") {
            f= Joi.date().iso();
        } else if (field.type === "float") {
            f= Joi.number();
        } else if (field.type === "json") {
            f= Joi.object();
        }

        if (field.required) {
            f = f.required();
        } else {
            f = f.allow(null);
        }

        if (field.type === "string") {
            if (field.required) {
                f = f.min(1);
            } else {
                f= f.allow('');
            }
        }
        return f;
    }
};



function tranformPath(path){
	// {string} to :string
	path = path.replace(/{/g,":");
	path = path.replace(/}/g,"");
	return path;
}
