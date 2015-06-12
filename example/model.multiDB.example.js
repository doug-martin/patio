"use strict";
var patio = require("../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format,
    config = require("./config"),
    db1 = config.connect("sandbox"),
    db2 = config.connect("sandbox2"),
    User1 = patio.addModel(db1.from("user")),
    User2 = patio.addModel(db2.from("user"));

module.exports = runExamples;

//connect and create schema
function runExamples() {
    return setup()
        .then(function () {
            var myUser1 = new User1({
                firstName: "Bob1",
                lastName: "Yukon1",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            });
            var myUser2 = new User2({
                firstName: "Bob2",
                lastName: "Yukon2",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            });
            return Promise.all([myUser1.save(), myUser2.save()]).then(function () {
                console.log(format("%s %s was created at %s", myUser1.firstName, myUser1.lastName, myUser1.created.toString()));
                console.log(format("%s %s's id is %d", myUser1.firstName, myUser1.lastName, myUser1.id));

                console.log(format("%s %s was created at %s", myUser2.firstName, myUser2.lastName, myUser2.created.toString()));
                console.log(format("%s %s's id is %d", myUser2.firstName, myUser2.lastName, myUser2.id));
            });
        })
        .then(teardown)
        .catch(fail);
}

function setup() {
    //This assumes new tables each time you could just connect to the database
    return Promise
        .all([
            db1.forceCreateTable("user", function () {
                this.primaryKey("id");
                this.firstName(String);
                this.lastName(String);
                this.password(String);
                this.dateOfBirth(Date);
                this.isVerified(Boolean, {"default": false})
                this.created(sql.TimeStamp);
                this.updated(sql.DateTime);
            }),
            //drop and recreate the user
            db2.forceCreateTable("user", function () {
                this.primaryKey("id");
                this.firstName(String);
                this.lastName(String);
                this.password(String);
                this.dateOfBirth(Date);
                this.isVerified(Boolean, {"default": false})
                this.created(sql.TimeStamp);
                this.updated(sql.DateTime);
            })
        ])
        .then(function () {
            return patio.syncModels();
        });
}

function teardown() {
    return Promise.all([db1.dropTable("user"), db2.dropTable("user")]);
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}


