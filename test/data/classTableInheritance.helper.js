"use strict";

var patio = require("index"),
    config = require("../test.config.js"),
    comb = require("comb-proxy"),
    DB;

module.exports = {
    createSchemaAndSync: createSchemaAndSync,
    dropModels: dropModels
};


function dropTableAndDisconnect() {
    return DB.forceDropTable(["staff", "executive", "manager", "employee"])
        .then(function () {
            patio.disconnect();
        })
        .then(function () {
            patio.resetIdentifierMethods();
        });
}

function createSchemaAndSync(underscore) {
    return createTables(underscore).then(comb.hitch(patio, "syncModels"));
}

function dropModels() {
    return dropTableAndDisconnect();
}

function createTables(underscore) {
    underscore = underscore === true;
    if (underscore) {
        patio.camelize = underscore;
    } else {
        patio.resetIdentifierMethods();
        patio.quoteIdentifiers = false;
    }
    DB = patio.connect(config.DB_URI + "/sanDBox");

    return DB.forceDropTable(["staff", "executive", "manager", "employee"])
        .then(function () {
            return DB.createTable("employee", function () {
                this.primaryKey("id");
                this.name(String);
                this.kind(String);
            });
        })
        .then(function () {
            return DB.createTable("manager", function () {
                this.primaryKey("id");
                this.foreignKey(["id"], "employee", {key: "id"});
                this.numstaff("integer");
            });
        })
        .then(function () {
            return DB.createTable("executive", function () {
                this.primaryKey("id");
                this.foreignKey(["id"], "manager", {key: "id"});
                this.nummanagers("integer");
            });
        })
        .then(function () {
            return DB.createTable("staff", function () {
                this.primaryKey("id");
                this.foreignKey(["id"], "employee", {key: "id"});
                this.foreignKey("managerid", "manager", {key: "id"});
            });
        });
}