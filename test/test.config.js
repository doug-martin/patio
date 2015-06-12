"use strict";
var patio = require("../lib"),
    MYSQL_URI = "mysql://root@127.0.0.1:3306",
    PG_URI = "pg://postgres@127.0.0.1:5432",
    REDSHIFT_URI = "redshift://postgres@127.0.0.1:5432",
    PATIO_DB = process.env.PATIO_DB,
    DB_URI = PATIO_DB === "pg" ? PG_URI : PATIO_DB === "redshift" ? REDSHIFT_URI : MYSQL_URI;

module.exports = {
    DB_TYPE: process.env.PATIO_DB,
    MYSQL_URI: MYSQL_URI,
    PG_URI: PG_URI,
    DB_URI: DB_URI,
    REDSHIFT_URI: REDSHIFT_URI,
    recreateDatabases: recreateDatabases
};

function recreateDatabases() {
    var db = patio.connect(DB_URI);
    return Promise.all([
        db.run("DROP DATABASE IF EXISTS sandbox"),
        db.run("DROP DATABASE IF EXISTS sandbox2")

    ]).then(function () {
        return Promise.all([
            db.run("CREATE DATABASE sandbox2"),
            db.run("CREATE DATABASE sandbox")
        ]);
    });
}