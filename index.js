'use strict';

const debug = require('debug')('validation');

const validator = require('validator');

function ValidationError(errors) {
    this.name = 'ValidationError';
    this.message = 'ValidationError';
    this._errors = errors;
}
ValidationError.prototype = new Error();

class Validation {

    constructor(data) {

        if ( typeof data !== 'object')
            throw new TypeError('data must be an object');

        this.data = data;
        this.errors = [];
    }

    add(test, name, message){
        if (test)
            this.errors.push({
                name: name,
                message: message
            });
        return this;
    }

    validate() {
        if (!this.errors.length) return this;
        const err = new ValidationError(this.errors);
        this.errors = [];
        throw err;
    }

    throw(test, name, message) {
        if (!test)
            return this;

        this.errors.push({
            name: name,
            message: message
        });

        this.validate();
    }

    test(name) {
        this.name = name;
        this.value = this.data[name];
        return this;
    }

    static koaMiddleware(ctx, next) {
        return next().catch(e => {
            if ( e.message == 'ValidationError') {
                ctx.status = 400;
                ctx.body = e._errors;
            } else {
                throw e;
            }
        });
    }
}

var sanitizers = [
    'trim',
    'ltrim',
    'rtrim',
    'escape',
    'whitelist',
    'blacklist',
    'version',
    'init',
    'extend',
    'normalizeEmail',
    'stripLow'
];

Object.keys(validator).forEach( methodName => {
    if (!methodName.match(/^to/) && sanitizers.indexOf(methodName) === -1){
        debug('method %s', methodName)
        Validation.prototype[methodName] = function() {
            const args = Array.prototype.slice.call(arguments);
            args.unshift(this.value);
            debug('exec %s %s', methodName, args);
            if (!validator[methodName].apply(validator, args)) {
                this.errors.push({
                    name : this.name,
                    message : methodName
                });
            }
            return this;
        };
    }
});

Validation.prototype.notEmpty = function(){
    if (this.value === undefined ||
        this.value.toString().length === 0) {
            this.errors.push({
                name : this.name,
                message : 'notEmpty'
            });
    }
    return this;
};


module.exports = Validation;
