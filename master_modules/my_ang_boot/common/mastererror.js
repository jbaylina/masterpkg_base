/*jslint node: true */
/*global window*/
"use strict";

function MasterError(code, message) {
  this.name = 'MasterError';
  this.errorCode = code;
  this.code = code;
  this.message = message || code;
  Error.captureStackTrace(this, MasterError);
}

MasterError.prototype = Object.create(Error.prototype);
MasterError.prototype.constructor = MasterError;
MasterError.prototype.toString = function() {
	if (this.message) {
		return this.message;
	} else {
		return this.errorCode;
	}
};

module.exports = MasterError;

if (typeof global !== "undefined") {
    global.MasterError = MasterError;
}

if (typeof window !== "undefined") {
    window.MasterError = MasterError;
}
