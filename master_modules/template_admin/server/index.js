/*jslint node: true */
/* global __mods */
"use strict";

var fs = require("fs-extra");


var config = __mods.config;

exports.init = function () {
    if (config.clientConfig.property && config.clientConfig.property.logo) {
        var logo = config.clientConfig.property.logo || "/media/sf_mastersq/Bookings/logo.png";
        fs.stat(logo, function (err, stat) {
            if (err == null) {
                var inStr = fs.createReadStream(config.clientConfig.property.logo);
                var outStr = fs.createWriteStream("/git/masterweb/dist/images/logo_blanc.png");
                inStr.pipe(outStr);
            } else {
                console.warn((config.clientConfig.property.logo || logo) + " not exists!");
                console.error(err);
            }
        });
    } else {
        console.error("config.clientConfig.property not defined");
    }
};