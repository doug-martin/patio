"use strict";
var patio = require("../lib"),
    comb = require("comb"),
    MYSQL_URI = "mysql://root@127.0.0.1:3306",
    PG_URI = "pg://postgres@127.0.0.1:5432",
    PATIO_DB = process.env.PATIO_DB,
    DB_URI = PATIO_DB === "pg" ? PG_URI : MYSQL_URI,
    DB_MAP = {};

patio.camelize = true;
module.exports = {
    DB_URI: DB_URI,
    connect: connect,
    disconnect: disconnect,
    header: header,
    log: log,
    teardown: teardown,
    fail: fail

};

function connect(db) {
    return DB_MAP[db] || (DB_MAP[db] = patio.connect(DB_URI + "/" + db));
}

function disconnect() {
    return patio.disconnect();
}


function header(txt) {
    console.log("\n\n=====%s=====", txt.toUpperCase());
}

function log(txt, args) {
    console.log("   %s", comb.string.format(txt, comb.argsToArray(arguments, 1)));
}

/*
 * Teardown an example
 *
 */
function teardown(db, tables) {
    return function () {
        return db.dropTable(tables);
    };
}

/*
 * Fail an example
 */
function fail(db, tables) {
    return function (err) {
        return teardown(db, tables)().then(function () {
            return Promise.reject(err);
        });
    };
}