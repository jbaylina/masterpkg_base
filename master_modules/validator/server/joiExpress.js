/*jslint node: true */
/*global __top, __mods */
"use strict";

var Joi = require('joi');

exports.Joi = Joi;

exports.joiValidate = function joiValidate(validations, options) {
    options = options || { strict: true };

    function validate(req, res, next) {

        var method = req.method;
        var body = req.body;
        var params = req.params;
        var query = req.query;
        var items = {};

        // Copio tots els parametres dins de items
        var paramExtras = copyObject(params, items, validations, options.strict, true);
        var queryExtras = copyObject(query, items, validations, options.strict, true);
        var bodyExtras = {};

        // El body si no es un GET o un DELETE
        if (method !== "GET" && method !== "DELETE") {
            bodyExtras = copyObject(body, items, validations, options.strict, true);
        }
        var err = Joi.validate(items, validations);

        if (err.error) {
            next(err.error);
        }else{
            next();
        }
    }

    return validate;
};

function copyObject(from, to, validations, strict, decode) {
    var extras = {};
    if (from) {
        for (var key in from) {
            if (from.hasOwnProperty(key) && (!validations || strict || validations.hasOwnProperty(key))) {
                try {
                    to[key] = (decode && typeof(from[key]) === 'string') ? decodeURIComponent(from[key]) : from[key];
                } catch (err) {
                    to[key] = from[key];
                }
            } else {
                try {
                    extras[key] = (decode && typeof(from[key]) === 'string') ? decodeURIComponent(from[key]) : from[key];
                } catch (err) {
                    extras[key] = from[key];
                }
            }
        }
    }
    return extras;
}