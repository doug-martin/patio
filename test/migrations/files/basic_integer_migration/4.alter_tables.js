"use strict";

var nodeify = require("../../../../lib/utils").nodeify;

exports.up = function (db, next) {
    nodeify(Promise.all([
        db.alterTable("test1", function () {
            this.renameColumn("column1", "column2");
        }),
        db.alterTable("test2", function () {
            this.renameColumn("column2", "column3");
        }),
        db.alterTable("test3", function () {
            this.renameColumn("column3", "column4");
        }),
        db.alterTable("test4", function () {
            this.renameColumn("column4", "column5");
        })
    ]), next);
};

exports.down = function (db) {
    return Promise.all([
        db.alterTable("test1", function () {
            this.renameColumn("column2", "column1");
        }),
        db.alterTable("test2", function () {
            this.renameColumn("column3", "column2");
        }),
        db.alterTable("test3", function () {
            this.renameColumn("column4", "column3");
        }),
        db.alterTable("test4", function () {
            this.renameColumn("column5", "column4");
        })
    ]);
};