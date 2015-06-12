"use strict";
var P = Promise,
    comb = require("comb");

module.exports = {
    resolveOrPromisfyFunction: resolveOrPromisfyFunction,
    nodeify: nodeify,
    all: all,
    resolve: resolve,
    reject: reject,

    get Promise() {
        return P;
    },

    set Promise(p) {
        P = p;
        return p;
    }
};

function all(ps) {
    return P.all(ps);
}

function resolve(p) {
    return P.resolve(p);
}

function reject(p) {
    return P.reject(p);
}

function resolveOrPromisfyFunction(cb, scope, args) {
    args = comb.argsToArray(arguments, 2);
    return new P(function (resolve, reject) {
        function resolver(err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        }

        var cbRet = cb.apply(scope, args.concat([resolver]));
        if (cbRet && comb.isPromise(cbRet)) {
            cbRet.then(resolve, reject);
        }
    });
}

function nodeify(p, cb) {
    if (comb.isFunction(cb)) {
        p.then(function (res) {
            cb.call(void 0, null, res);
        }, function (err) {
            cb(err);
        });
    }
    return p;
}


