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
    helper.header("SQL:FILTER EXAMPLE");
    helper.log(User.filter({id: 1}).sql);
    helper.log(User.filter({name: 'bob'}).sql);
    helper.log(User.filter({id: [1, 2]}).sql);
    helper.log(User.filter({id: Blog.select("userId")}).sql);
    helper.log(User.filter({id: null}).sql);
    helper.log(User.filter({id: true}).sql);
    helper.log(User.filter({id: false}).sql);
    helper.log(User.filter({name: /Bo$/}).sql);
    helper.log(User.filter({id: 1, name: /Bo$/}).sql);
    helper.log(User.filter({id: 1}).filter({name: /Bo$/}).sql);
    helper.log(User.filter({name: {like: /ob$/, between: ["A", "Z"]}}).sql);
    helper.log(User.filter([
        ["name", /oB$/],
        [patio.sql.name, /^Bo/]
    ]).sql);
    helper.log(User.filter(function () {
        return this.id.gt(5);
    }).sql);
    helper.log(User.filter({name: {between: ['K', 'M']}},
        function () {
            return this.id.gt(5);
        }).sql);
    helper.log(User.filter("isActive").sql);
    helper.log(User.filter(patio.sql.literal("name < 'A'")).sql);
    helper.log(User.filter(patio.sql.name.like('B%')).sql);
    helper.log(User.filter(patio.sql.name.like('B%').and(patio.sql.b.eq(1).or(patio.sql.c.neq(3)))).sql);
    helper.log(User.filter(
        function () {
            return this.a.gt(1).and(this.b("c").and(this.d)).not();
        }).sql);
    helper.log(User.filter("name LIKE ?", 'B%').sql);
    helper.log(User.filter("name LIKE ? AND id = ?", 'B%', 1).sql);
    helper.log(User.filter("name LIKE {name} AND id = {id}", {name: 'B%', id: 1}).sql);
    helper.log(User.filter(patio.sql.literal("id = 2")).sql);

    var id = 1;
    helper.log(User.filter(patio.sql.literal("id = " + id)).sql); // just example. Don't actually do this in your code
    helper.log(User.filter("id = ?", id).sql); //Do this as patio will escape it
    helper.log(User.filter({id: id}).sql); // Best solution!
    helper.log(User.filter({id: 5}).invert().sql);
    helper.log(User.filter({id: {neq: 5}}).sql);
    helper.log(User.filter({id: 5}).filter(
        function () {
            return this.name.gt('A');
        }).invert().sql);
    helper.log(User.filter({id: 5}).exclude(
        function () {
            return this.name.gt('A');
        }).sql);
    helper.log(User.filter({id: 1}).unfiltered().sql);
}




