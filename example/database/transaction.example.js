"use strict";

var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format;

module.exports = runExample;

function runExample() {
    return setup()
        .then(simpleTransaction)
        .then(nestedTransaction)
        .then(multipleTransactions)
        .then(multipleTransactionsError)
        .then(inOrderTransaction)
        .then(errorTransaciton)
        .then(errorCallbackTransaciton)
        .then(teardown)
        .catch(fail);
}

function setup() {
    return db.forceCreateTable("user", function () {
        this.primaryKey("id");
        this.firstName(String);
        this.lastName(String);
        this.password(String);
        this.dateOfBirth(Date);
        this.created(sql.TimeStamp);
        this.updated(sql.DateTime);
    }).then(patio.syncModels);
}

function teardown() {
    return db.dropTable("user");
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}

function simpleTransaction() {
    helper.header("SIMPLE TRANSACTION(NO ROLLBACK)");

    return db.transaction(function () {
        var ds = db.from("user");
        return Promise.all([
            ds.insert({
                firstName: "Bob",
                lastName: "Yukon",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            }),
            ds.insert({
                firstName: "Greg",
                lastName: "Kilosky",
                password: "password",
                dateOfBirth: new Date(1988, 7, 19)
            }),

            ds.insert({
                firstName: "Jane",
                lastName: "Gorgenson",
                password: "password",
                dateOfBirth: new Date(1956, 1, 3)
            })
        ]);
    });
}

function nestedTransaction() {
    helper.header("NESTED TRANSACTION(NO ROLLBACK)");
    return db.transaction(function () {
        var ds = db.from("user");
        return Promise.all([
            ds.insert({
                firstName: "Bob",
                lastName: "Yukon",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            }),
            db.transaction(function () {
                return Promise.all([
                    ds.insert({
                        firstName: "Greg",
                        lastName: "Kilosky",
                        password: "password",
                        dateOfBirth: new Date(1988, 7, 19)
                    }),
                    db.transaction(function () {
                        return ds.insert({
                            firstName: "Jane",
                            lastName: "Gorgenson",
                            password: "password",
                            dateOfBirth: new Date(1956, 1, 3)
                        });
                    })
                ]);
            })
        ]);
    });
}

function multipleTransactions() {
    helper.header("MULTI TRANSACTION(NO ROLLBACK");

    var ds = db.from("user");
    return Promise.all([
        db.transaction(function () {
            return ds.insert({
                firstName: "Bob",
                lastName: "Yukon",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            });
        }),
        db.transaction(function () {
            return ds.insert({
                firstName: "Greg",
                lastName: "Kilosky",
                password: "password",
                dateOfBirth: new Date(1988, 7, 19)
            });
        }),
        db.transaction(function () {
            return ds.insert({
                firstName: "Jane",
                lastName: "Gorgenson",
                password: "password",
                dateOfBirth: new Date(1956, 1, 3)
            }).then(function () {
                return ds.all(function (user) {
                    return ds.where({id: user.id}).update({firstName: user.firstName + 1});
                });
            });
        })
    ]);
}

function multipleTransactionsError() {
    helper.header("MULTIPLE TRANSACTION(ROLLBACK)");

    var ds = db.from("user");
    return Promise.all([
        db.transaction(function () {
            return ds.insert({
                firstName: "Bob",
                lastName: "Yukon",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            });
        }),
        db.transaction(function () {
            return ds.insert({
                firstName: "Greg",
                lastName: "Kilosky",
                password: "password",
                dateOfBirth: new Date(1988, 7, 19)
            });
        }),
        db.transaction(function () {
            return ds.insert({
                firstName: "Jane",
                lastName: "Gorgenson",
                password: "password",
                dateOfBirth: new Date(1956, 1, 3)
            }).then(function () {
                return ds.all(function (user) {
                    return ds.where({id: user.id}).update({firstName: user.firstName + 1});
                });
            });
        })
    ]);
}

function inOrderTransaction() {
    helper.header("IN ORDER TRANSACTION(NO ROLLBACK)");

    var ds = db.from("user");
    return db.transaction(function () {
        return ds.insert({
            firstName: "Bob",
            lastName: "Yukon",
            password: "password",
            dateOfBirth: new Date(1980, 8, 29)
        });
    }).then(function () {
        return db.transaction(function () {
            return ds.insert({
                firstName: "Greg",
                lastName: "Kilosky",
                password: "password",
                dateOfBirth: new Date(1988, 7, 19)
            });
        });
    }).then(function () {
        return db.transaction(function () {
            return ds.insert({
                firstName: "Jane",
                lastName: "Gorgenson",
                password: "password",
                dateOfBirth: new Date(1956, 1, 3)
            });
        });
    });
}

function errorTransaciton() {
    helper.header("THROW ERROR TRANSACTION(ROLLBACK)");
    var ds = db.from("user");

    return db.transaction(function () {
        var ds = db.from("user");
        return ds.insert({
            firstName: "Bob",
            lastName: "Yukon",
            password: "password",
            dateOfBirth: new Date(1980, 8, 29)
        }).then(function () {
            return db.transaction(function () {
                return ds.insert({
                    firstName: "Greg",
                    lastName: "Kilosky",
                    password: "password",
                    dateOfBirth: new Date(1988, 7, 19)
                }).then(function () {
                    throw "Error";
                    return db.transaction(function () {
                        return ds.insert({
                            firstName: "Jane",
                            lastName: "Gorgenson",
                            password: "password",
                            dateOfBirth: new Date(1956, 1, 3)
                        });
                    });
                });
            });
        });
    }).then(function () {
        throw new Error("unexpected error");
    }, function () {
        return ds.count().then(function (count) {
            patio.logInfo(format("COUNT = " + count));
        });
    });
}

function errorCallbackTransaciton() {
    helper.header("ERRBACK TRANSACTION(ROLLBACK)");

    var ds = db.from("user");
    return db.transaction(function () {
        var ds = db.from("user");
        return ds.insert({
            firstName: "Bob",
            lastName: "Yukon",
            password: "password",
            dateOfBirth: new Date(1980, 8, 29)
        }).then(function () {
            return db.transaction(function () {
                return ds.insert({
                    firstName: "Greg",
                    lastName: "Kilosky",
                    password: "password",
                    dateOfBirth: new Date(1988, 7, 19)
                }).then(function () {
                    return db.transaction(function () {
                        return ds.insert({
                            firstName: "Jane",
                            lastName: "Gorgenson",
                            password: "password",
                            dateOfBirth: new Date(1956, 1, 3)
                        }).then(function () {
                            return Promise.reject("err");
                        });
                    });
                });
            });
        });
    }).then(function () {
        throw new Error("unexpected error");
    }, function () {
        return ds.count().then(function (count) {
            patio.logInfo(format("COUNT = " + count));
        });
    });
}