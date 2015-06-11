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
            var PatioEntry = patio.addModel("patioEntry");
            PatioEntry.useTransactions = false;
            PatioEntry.reloadOnSave = false;
            PatioEntry.reloadOnUpdate = false;
            PatioEntry.typecastOnAssignment = false;
            PatioEntry.typecastOnLoad = false;
            return patio.syncModels();
        });
}

function disconnect() {
    return patio.disconnect();
}

function disconnectErr(err) {
    console.error(err.stack || err);
    return patio.disconnect();
}