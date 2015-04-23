"use strict";

exports.up = function () {
    return Promise.reject();
};

exports.down = function (db) {
    return db.dropTable("test4");
};