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
    helper.header("SQL:ORDER EXAMPLE");
    helper.log(User.order("id").sql);
    helper.log(User.order("userId", "id").sql);
    helper.log(User.order("id").order("name").sql);
    helper.log(User.order("id").orderAppend("name").sql);
    helper.log(User.order("id").orderPrepend("name").sql);
    helper.log(User.order("id").reverse().sql);
    helper.log(User.order(patio.sql.id.desc()).sql);
    helper.log(User.order("name", patio.sql.id.desc()).sql);
    helper.log(User.order("name").unordered().sql);
}




