"use strict";
var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox"),
    User = patio.addModel("user"),
    Blog = patio.addModel("blog");

module.exports = runExample;

function runExample() {
    return setup()
        .then(examples)
        .then(teardown)
        .catch(fail);
}

function setup() {
    return db.forceDropTable("blog", "user")
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
        .then(function () {
            return db.createTable("blog", function () {
                this.primaryKey("id");
                this.title(String);
                this.numPosts("integer");
                this.numFollowers("integer");
                this.foreignKey("userId", "user", {key: "id"});
            });
        })
        .then(patio.syncModels);
}

function teardown() {
    return db.dropTable("blog", "user");
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}

function examples() {
    helper.header("SQL:GROUP EXAMPLE");
    helper.log(User.group("userId").sql);

    helper.log(User.group("userId").ungrouped().sql);
    helper.log(User.groupAndCount("userId").sql);

    helper.log(User.groupAndCount("dateOfBirth").having(
        function () {
            return this.count.gte(10);
        }).sql);

    helper.log(User.groupAndCount("dateOfBirth").having(
        function () {
            return this.count.gte(10);
        }).filter(
        function () {
            return this.count.lt(15);
        }).sql);
    helper.log(User.groupAndCount("id").having(function () {
        return this.count.gte(10);
    }).where(patio.sql.name.like('A%')).sql);

    helper.log(User.groupAndCount("id").having(function () {
        return this.count.gte(10);
    }).where(patio.sql.name.like('A%')).unfiltered().sql);
}




