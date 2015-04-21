"use strict";
var patio = require("index"),
    config = require("../test.config.js"),
    DB;

module.exports = {
    createSchemaAndSync: createSchemaAndSync,
    dropModelsfunction: dropModelsfunction
};

function createSchemaAndSync(underscore) {
    return createTables(underscore).then(function(){
        return patio.syncModels();
    });
}


function dropModelsfunction() {
    return dropTableAndDisconnect();
}

function dropTableAndDisconnect() {
    return DB.forceDropTable(["companiesEmployees", "employee", "buyerVendor", "company"])
        .then(function () {
            return patio.disconnect();
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

    return DB.forceDropTable(["companiesEmployees", "employee", "buyerVendor", "company"]).then(function () {
        return Promise.all([
            DB.createTable("company", function (table) {
                this.primaryKey("id");
                this[underscore ? "company_name" : "companyName"]("string", {size: 20, allowNull: false});
            }),
            DB.createTable("employee", function () {
                this.primaryKey("id");
                this[underscore ? "first_name" : "firstname"]("string", {size: 20, allowNull: false});
                this[underscore ? "last_name" : "lastname"]("string", {size: 20, allowNull: false});
                this[underscore ? "mid_initial" : "midinitial"]("char", {size: 1});
                this.position("integer");
                this.gender("char", {size: 1});
                this.street("string", {size: 50, allowNull: false});
                this.city("string", {size: 20, allowNull: false});
            })
        ]).then(function () {
            return Promise.all([
                DB.createTable(underscore ? "companies_employees" : "companiesEmployees", function () {
                    this.foreignKey(underscore ? "company_id" : "companyId", "company", {key: "id", onDelete: "cascade"});
                    this.foreignKey(underscore ? "employee_id" : "employeeId", "employee", {key: "id", onDelete: "cascade"});
                }),
                DB.createTable(underscore ? "buyer_vendor" : "buyerVendor", function () {
                    this.primaryKey("id");
                    this.foreignKey(underscore ? "buyer_id" : "buyerId", "company", {key: "id", onDelete: "cascade"});
                    this.foreignKey(underscore ? "vendor_id" : "vendorId", "company", {key: "id", onDelete: "cascade"});
                })
            ]);
        });
    });
}
