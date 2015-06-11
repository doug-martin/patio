"use strict";
var patio = require("../index");

module.exports = {
    createTableAndModel: createTableAndModel,
    disconnect: disconnect,
    disconnectErr: disconnectErr
};

function createTableAndModel(connect) {
    var db = patio.connect(connect);
    return db
        .forceCreateTable("patioEntry", function () {
            this.primaryKey("id");
            this.column("number", "integer");
            this.column("string", String);
        })
        .then(function () {
            patio.addModel("patioEntry");
            return patio.syncModels();
        });
}

function disconnect() {
    return patio.disconnect();
}

function disconnectErr(err) {
    console.error(err);
    return patio.disconnect();
}