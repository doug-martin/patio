"use strict";
var patio = require("../lib"),
    MYSQL_URI = "mysql://root@127.0.0.1:3306",
    PG_URI = "pg://postgres@127.0.0.1:5432",
    PATIO_DB = process.env.PATIO_DB,
    DB_URI = PATIO_DB === "pg" ? PG_URI : MYSQL_URI,
    DB_MAP = {};

patio.camelize = true;
module.exports = {
    DB_URI: DB_URI,
    connect: connect,
    disconnect: disconnect

};

function connect(db) {
    return DB_MAP[db] || (DB_MAP[db] = patio.connect(DB_URI + "/" + db));
}

function disconnect() {
    return patio.disconnect();
}