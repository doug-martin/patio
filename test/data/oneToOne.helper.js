'use strict';

var patio = require("../../lib"),
    config = require("../test.config.js"),
    comb = require("comb-proxy"),
    DB;


module.exports = {
    createSchemaAndSync: createSchemaAndSync,
    dropModels: dropModels
};

function createSchemaAndSync(underscore) {
    return createTables(underscore).then(comb.hitch(patio, "syncModels"));
}

function dropModels() {
    return dropTableAndDisconnect();
}

function dropTableAndDisconnect() {
    return DB.dropTable(["works", "employee"])
        .then(function () {
            patio.disconnect();
        })
        .then(function () {
            patio.resetIdentifierMethods();
        });
}

function createTables(underscore) {
    underscore = underscore === true;
    if (underscore) {
        patio.camelize = underscore;
    } else {
        patio.resetIdentifierMethods();
    }
    DB = patio.connect(config.DB_URI + "/sandbox");

    return DB.forceDropTable(["works", "employee"])
        .then(function () {
            return DB.createTable("employee", function () {
                this.primaryKey("id");
                this[underscore ? "first_name" : "firstname"]("string", {size: 20, allowNull: false});
                this[underscore ? "last_name" : "lastname"]("string", {size: 20, allowNull: false});
                this[underscore ? "mid_initial" : "midinitial"]("char", {size: 1});
                this.position("integer");
                this.gender("char", {size: 1});
                this.street("string", {size: 50, allowNull: false});
                this.city("string", {size: 20, allowNull: false});
            });
        }).then(function () {
            return DB.createTable("works", function () {
                this.primaryKey("id");
                this[underscore ? "company_name" : "companyName"]("string", {size: 20, allowNull: false});
                this.salary("float", {size: [20, 8], allowNull: false});
                this.foreignKey(underscore ? "employee_id" : "employeeId", "employee", {key: "id"});
            });
        });
}