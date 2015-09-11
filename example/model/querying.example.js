"use strict";
var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox"),
    User = patio.addModel("user");


module.exports = runExamples;
function runExamples() {
    return setup()
        .then(findById)
        .then(first)
        .then(last)
        .then(getMethod)
        .then(all)
        .then(forEach)
        .then(map)
        .then(toHash)
        .then(isEmpty)
        .then(aggregateFunctions)
        .then(helper.teardown(db, "user"))
        .catch(helper.fail(db, "user"));
}

function findById() {
    helper.header("FIND BY ID EXAMPLES");
    // Find user with primary key (id) 1
    return User.findById(1).then(function (user) {
        helper.log("FIND BY ID 1 = %s", user);
    });
}

function first() {
    helper.header("FIRST EXAMPLES");
    return User.first()
        .then(function (first) {
            helper.log("FIRST = %s", first);
            return User.first({name: 'Bob Yukon'});
        })
        .then(function (bob) {
            helper.log("FIRST (WHERE name = 'Bob') = %s", bob);
            return User.first({name: {like: "B%"}});
        })
        .then(function (user) {
            helper.log("FIRST (WHERE name LIKE 'B%') = %s", user);
            return User.select("name").first();
        })
        .then(function (name) {
            helper.log("FIRST SELECT JUST NAME = %s", name);
        });
}

function last() {
    helper.header("LAST EXAMPLES");
    return User.order("name").last().then(function (user) {
        // SELECT * FROM user ORDER BY name DESC LIMIT 1
        helper.log("LAST = %s", user);
    });
}

function getMethod() {
    helper.header("GET EXAMPLES");
    return User.get("name").then(function (name) {
        // SELECT name FROM user LIMIT 1
        helper.log("NAME = %s", name);
    });
}

function all() {
    helper.header("ALL EXAMPLES");
    return User.all().then(function (users) {
        // SELECT * FROM user
        helper.log("USERS = [%s]", users);
    });
}

function forEach() {
    helper.header("FOREACH EXAMPLES");
    return User
        .forEach(function (user) {
            helper.log("FOR EACH name = %s ", user.name);
        })
        .then(function () {
            //for each wont resolve until all the updates are done
            return User.forEach(function (user) {
                return user.update({isVerified: !user.isVerified}).then(function () {
                    helper.log("FOREACH WITH PROMISE SETTING user with id:%d to isVerified to ", user.id, !user.isVerified);
                });
            });
        })
        .then(function () {
            return helper.log("DONE UDPATING EACH RECORD");
        });
}

function map() {
    helper.header("MAP EXAMPLES");
    return User
        .map(function (user) {
            return user.name;
        })
        .then(function (userNames) {
            helper.log("MAPPED USER NAMES = [%s]", userNames);
            return User.map("name").then(function (userNames) {
                helper.log("MAPPED USER NAMES BY COLUMN = [%s]", userNames);
            });
        })
        .then(function () {
            return User.selectMap("name").then(function (names) {
                helper.log("SELECT MAP USER NAMES BY COLUMN = [%s]", names);
            });


        })
        .then(function () {
            return User.selectOrderMap("name").then(function (names) {
                helper.log("SELECT ORDER MAP USER NAMES BY COLUMN = [%s]", names);
            });
        });
}

function toHash() {
    helper.header("TO HASH EXAMPLES");
    return User.toHash("name", "id")
        .then(function (nameIdMap) {
            helper.log("TO HASH = %j", nameIdMap);
            return User.toHash("id", "name");
        })
        .then(function (idNameMap) {
            helper.log("INVERT TO HASH = %j", idNameMap);
            return User.toHash("name");
        })
        .then(function (idNameMap) {
            // SELECT * FROM user
            helper.log("TO HASH ONE COLUMN = %j", idNameMap);
            return User.selectHash("name", "id");
        })
        .then(function (nameIdMap) {
            // SELECT name, id FROM user
            helper.log("SELECT HASH = %j", nameIdMap);
        });
}

function isEmpty() {
    helper.header("IS EMPTY EXAMPLES");
    return User.isEmpty()
        .then(function (isEmpty) {
            helper.log("IS EMPTY = " + isEmpty);
            return User.filter({id: 0}).isEmpty();
        })
        .then(function (isEmpty) {
            helper.log("IS EMPTY = " + isEmpty);
            return User.filter({name: {like: 'B%'}}).isEmpty();
        })
        .then(function (isEmpty) {
            helper.log("IS EMPTY = " + isEmpty);
        });
}

function aggregateFunctions() {
    helper.header("AGGREGATE EXAMPLES");
    return User.count()
        .then(function (count) {
            helper.log("COUNT = " + count);
            return User.sum("id");
        })
        .then(function (count) {
            helper.log("SUM = " + count);
            return User.avg("id");
        })
        .then(function (count) {
            helper.log("AVG = " + count);
            return User.min("id");
        })
        .then(function (count) {
            helper.log("MIN = " + count);
            return User.max("id");
        })
        .then(function (count) {
            helper.log("MAX = " + count);
        });
}

/*
 * Helper Methods
 */

function setup() {
    //This assumes new tables each time you could just connect to the database
    return db.forceDropTable("user")
        .then(function () {
            //drop and recreate the user
            return db.createTable("user", function () {
                this.primaryKey("id");
                this.name(String);
                this.password(String);
                this.dateOfBirth(Date);
                this.isVerified(Boolean, {"default": false});
                this.lastAccessed(Date);
                this.created(patio.sql.TimeStamp);
                this.updated(patio.sql.DateTime);
            });
        })
        .then(patio.syncModels)
        .then(function () {
            return User
                .save([
                    {
                        name: "Bob Yukon",
                        password: "password",
                        dateOfBirth: new Date(1980, 8, 2),
                        isVerified: true
                    },

                    {
                        name: "Suzy Yukon",
                        password: "password",
                        dateOfBirth: new Date(1982, 9, 2),
                        isVerified: true
                    }
                ]);
        });
}