"use strict";
var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox");

var User = patio.addModel("user", {
    pre: {
        "save": function (next) {
            helper.log("pre save!!!");
            next();
        },

        "update": function (next) {
            helper.log("pre update!!!");
            next();
        },

        "remove": function (next) {
            helper.log("pre remove!!!");
            next();
        }
    },

    post: {
        "save": function (next) {
            helper.log("post save!!!");
            next();
        },

        "update": function (next) {
            helper.log("post update!!!");
            next();
        },

        "remove": function (next) {
            helper.log("post remove!!!");
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
    helper.header("SAVE EXAMPLE");
    var myUser = new User({
        firstName: "bob",
        lastName: "yukon",
        password: "password",
        dateOfBirth: new Date(1980, 8, 29)
    });
    //save the user
    return myUser.save().then(function (user) {
        helper.log("%s %s was created at %s", user.firstName, user.lastName, user.created);
        helper.log("%s %s's id is %d", user.firstName, user.lastName, user.id);
    });
}

function updateExample() {
    helper.header("UPDATE EXAMPLE");
    return User.one().then(function (user) {
        helper.log("before update user %d firstName = %s", user.id, user.firstName);
        return user.update({firstName: "sally"}).then(function () {
            helper.log("after update user %d firstName = %s", user.id, user.firstName);
        });
    });
}

function removeExample() {
    helper.header("REMOVE EXAMPLE");
    return User.one().then(function (user) {
        var userId = user.id;
        return user.remove().then(function () {
            helper.log("removed user %d", userId);
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
            this.created(patio.sql.TimeStamp);
            this.updated(patio.sql.DateTime);
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




