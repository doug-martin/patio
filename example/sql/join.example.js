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
    helper.header("SQL:JOIN EXAMPLE");
    helper.log(User.joinTable("inner", "blog", {userId: patio.sql.id}).sql);
    helper.log(User.joinTable("inner", "blog", {userId: patio.sql.id}).sql);
    helper.log(User.joinTable("inner", "blog", {userId: "id"}).sql);
    helper.log(User.join("blog", {userId: patio.sql.id}).sql);
    helper.log(User.leftJoin("blog", {userId: patio.sql.id}).sql);
    helper.log(User.join(Blog, {userId: patio.sql.id}).sql);
    helper.log(User.join(Blog.filter({title: {lt: 'A'}}), {userId: patio.sql.id}).sql);
    helper.log(User.join("blog", {userId: patio.sql.id}).join("posts", {blogId: patio.sql.id}).sql);
    helper.log(User.join("blog", {userId: patio.sql.id}).join("posts", {userId: patio.sql.id}).sql);
    helper.log(User.join("blog", {userId: patio.sql.id}).join("posts", {userId: patio.sql.id.qualify("user")}).sql);
    helper.log(User.join("blog", {userId: patio.sql.id}).join("posts", {userId: patio.sql["user__id"]}).sql);
    helper.log(User.join("blog", [
        [patio.sql.userId, patio.sql.id],
        [patio.sql.id, {between: [1, 5]}]
    ]).sql);
    helper.log(User.join("blog", [patio.sql.userId]).sql);
    helper.log(User.naturalJoin("blog").sql);
    helper.log(User.join("blog", {userId: patio.sql.id}, function (currAlias, lastAlias, previousJoins) {
        return patio.sql.name.qualify(lastAlias).lt(patio.sql.title.qualify(currAlias));
    }).sql);
    helper.log(User.join("blog", {userId: patio.sql.id, title: {gt: patio.sql.name.qualify("user")}}).sql);
}




