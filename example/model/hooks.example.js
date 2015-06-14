"use strict";
var patio = require("../../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format,
    config = require("../config"),
    db = config.connect("sandbox"),
    User = patio.addModel("user", {
        pre: {
            "save": function (next) {
                console.log("pre save!!!");
                next();
            },

            "update": function (next) {
                console.log("pre update!!!");
                next();
            },

            "remove": function (next) {
                console.log("pre remove!!!");
                next();
            }
        },

        post: {
            "save": function (next) {
                console.log("post save!!!");
                next();
            },

            "update": function (next) {
                console.log("post update!!!");
                next();
            },

            "remove": function (next) {
                console.log("post remove!!!");
                next();
            }
        }
    });

module.exports = runExample;


function runExample() {
//connect and create schema
    return setup()
        .then(saveExample)
        .then(updateExample)
        .then(removeExample)
        .then(teardown)
        .catch(fail);
}

function saveExample() {
    console.log("\n\n=====SAVE EXAMPLE=====");
    var myUser = new User({
        firstName: "bob",
        lastName: "yukon",
        password: "password",
        dateOfBirth: new Date(1980, 8, 29)
    });
    //save the user
    return myUser.save().then(function (user) {
        console.log(format("%s %s was created at %s", user.firstName, user.lastName, "" + user.created));
        console.log(format("%s %s's id is %d", user.firstName, user.lastName, user.id));
    });
}

function updateExample() {
    console.log("\n\n=====UPDATE EXAMPLE=====");
    return User.one().then(function (user) {
        console.log("before update user %d firstName = %s", user.id, user.firstName);
        return user.update({firstName: "sally"}).then(function () {
            console.log("after update user %d firstName = %s", user.id, user.firstName);
        });
    });
}

function removeExample() {
    console.log("\n\n=====REMOVE EXAMPLE=====");
    return User.one().then(function (user) {
        var userId = user.id;
        return user.remove().then(function () {
            console.log("removed user %d", userId);
        });
    });
}

function teardown() {
    return db.forceDropTable(["staff", "executive", "manager", "employee"])
        .chain(function () {
            return patio.disconnect();
        });
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}

function setup() {
    //This assumes new tables each time you could just connect to the database
    //drop and recreate the user
    return db
        .forceCreateTable("user", function () {
            this.primaryKey("id");
            this.firstName(String);
            this.lastName(String);
            this.password(String);
            this.dateOfBirth(Date);
            this.isVerified(Boolean, {"default": false});
            this.lastAccessed(Date);
            this.created(sql.TimeStamp);
            this.updated(sql.DateTime);
        })
        .then(patio.syncModels);
}

function teardown() {
    return db.dropTable("user");
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}




