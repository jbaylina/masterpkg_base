/*jslint node: true */
/*global __top, __mods */
"use strict";

var Joi = require('joi');

exports.Joi = Joi;

exports.joiValidate = function joiValidate(validations, options) {

    function validate(req, res, next) {

        // El body si no es un GET o un DELETE
        var err;
        if (req.method === "PUT" || req.method === "POST") {
            err = Joi.validate(req.body, validations, options);
            if (err.error) {
                next(err.error);
            }else{
                next();
            }
        } else {
            next();
        }

    }

    return validate;
};
