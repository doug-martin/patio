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
    helper.header("SQL:FROM EXAMPLE");
    helper.log(db.from("user").sql);
    helper.log(User.from("user", "oldUser").sql);
    helper.log(db.from("user").from("oldUser").sql);
    helper.log(Blog.order("userId").limit(100).fromSelf().group("userId").sql);
    helper.log(Blog.order("userId").limit(100).group("userId").sql);
    helper.log(db.fetch("SELECT * FROM user").sql);
    helper.log(db.from("user").withSql("SELECT * FROM user").sql);
    helper.log(db.fetch("SELECT * FROM user WHERE id = ?", 5).sql);
    helper.log(db.from("user").withSql("SELECT * FROM user WHERE id = {id}", {id: 5}).sql);
}




