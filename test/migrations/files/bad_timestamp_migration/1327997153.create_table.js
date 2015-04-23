"use strict";

exports.up = function (db) {
    return db.createTable("test1", function () {
        this.column("column1", "integer");
    });
};

exports.down = function () {
    return new Promise().reject();
};