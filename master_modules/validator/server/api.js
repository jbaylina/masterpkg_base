/*jslint node: true */
/*global __top, __mods */
"use strict";

var config = __mods.config;
var app = __mods.app;

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
	paths.push(path);
	if(path.handler){
		switch(path.method){
			case 'get':
				if(path.middleware){
				 	app.get(config.apiPrefix + tranformPath(path.path), path.middleware, path.handler);
				}else{
					app.get(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
			case 'put':
				if(path.middleware){
					app.put(config.apiPrefix + tranformPath(path.path), path.middleware, path.handler);
				}else{
					app.put(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
			case 'post':
				if(path.middleware){
					app.post(config.apiPrefix + tranformPath(path.path), path.middleware, path.handler);
				}else{
					app.post(config.apiPrefix + tranformPath(path.path), path.handler);
				}
			break;
			case 'delete':
				if(path.middleware){
				 	app.delete(config.apiPrefix + tranformPath(path.path), path.middleware, path.handler);
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

function tranformPath(path){
	// {string} to :string
	path = path.replace(/{/g,":");
	path = path.replace(/}/g,"");
	return path;
}
