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
        .then(helpers.teardown)
        .catch(fail);
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
    helper.header("SQL:SELECT EXAMPLE");
    helper.log(User.select("id", "name").sql);
    helper.log(User.select("id").select("name").sql);
    helper.log(User.select("id").selectAppend("name").sql);
    helper.log(User.select("id").selectAll().sql);
    helper.log(User.distinct().select("name").sql);
}

/*
 * Helper Methods
 */

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



