"use strict";

var patio = require("../../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format;

patio.configureLogging();

//disconnect and error callback helpers
var disconnect = comb.hitch(patio, "disconnect");
var disconnectError = function (err) {
    patio.logError(err);
    return patio.disconnect();
};
patio.configureLogging();
var connectAndCreateSchema = function () {
    //This assumes new tables each time you could just connect to the database
    return patio.connectAndExecute("mysql://root@localhost:3306/sandbox",
        function (db, patio) {
            //drop and recreate the user
            db.forceCreateTable("user", function () {
                this.primaryKey("id");
                this.firstName(String);
                this.lastName(String);
                this.password(String);
                this.dateOfBirth(Date);
                this.created(sql.TimeStamp);
                this.updated(sql.DateTime);
            });
        });
};

var simpleTransaction = function (db) {
    console.log("\n\n********SIMPLE TRANSACTION(NO ROLLBACK)*********");
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
};

var nestedTransaction = function (db) {
    console.log("\n\n********NESTED TRANSACTION(NO ROLLBACK)*********");
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
                comb.when(
                    ds.insert({
                        firstName: "Greg",
                        lastName: "Kilosky",
                        password: "password",
                        dateOfBirth: new Date(1988, 7, 19)
                    }),
                    db.transaction(function () {
                        ds.insert({
                            firstName: "Jane",
                            lastName: "Gorgenson",
                            password: "password",
                            dateOfBirth: new Date(1956, 1, 3)
                        });
                    })
                );
            })
        ]);
    });
};

var multipleTransactions = function (db) {
    var ds = db.from("user");
    console.log("\n\n********MULTI TRANSACTION(NO ROLLBACK)*********");
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
};

var multipleTransactionsError = function (db) {
    var ds = db.from("user");
    console.log("\n\n********MULTIPLE TRANSACTION(ROLLBACK)*********");
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
};

var inOrderTransaction = function (db) {
    var ds = db.from("user");
    console.log("\n\n********IN ORDER TRANSACTION(NO ROLLBACK)*********");
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
};

var errorTransaciton = function (db) {
    var ds = db.from("user");
    console.log("\n\n********THROW ERROR TRANSACTION(ROLLBACK)*********");
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
};

var errorCallbackTransaciton = function (db) {
    var ds = db.from("user");
    console.log("\n\n********ERRBACK TRANSACTION(ROLLBACK)*********");
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
                        })
                            .then(function () {
                                return new comb.Promise().errback("err");
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
};


var connectAndExecute = function (cb) {
    return connectAndCreateSchema()
        .then(function (db) {
            return cb(db);
        })
        .then(disconnect, disconnectError);
};

connectAndExecute(multipleTransactions)
    .then(comb.partial(connectAndExecute, multipleTransactionsError), disconnectError)
    .then(comb.partial(connectAndExecute, simpleTransaction), disconnectError)
    .then(comb.partial(connectAndExecute, nestedTransaction), disconnectError)
    .then(comb.partial(connectAndExecute, inOrderTransaction), disconnectError)
    .then(comb.partial(connectAndExecute, errorTransaciton), disconnectError)
    .then(comb.partial(connectAndExecute, errorCallbackTransaciton), disconnectError);

