"use strict";
var comb = require("comb"),
    isPromise = comb.isPromise;

module.exports = {
    pipeAll: pipeAll,
    resolveOrPromisfyFunction: resolveOrPromisfyFunction,
    nodeify: nodeify
};

function pipeAll(source, dest) {
    source.on("error", function (err) {
        dest.emit("error", err);
    });
    source.pipe(dest);
}

function resolveOrPromisfyFunction(cb, scope, args) {
    args = comb.argsToArray(arguments, 2);
    return new Promise(function (resolve, reject) {
        function resolver(err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res)
            }
        }

        var cbRet = cb.apply(scope, args.concat([resolver]));
        if (cbRet && isPromise(cbRet, Promise)) {
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


