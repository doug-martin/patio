"use strict";
var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox"),
    User = patio.addModel("user");

module.exports = runExample;

function runExample() {
    return setup()
        .then(examples)
        .then(helper.teardown(db, ["blog", "users"]))
        .catch(helper.fail(db, ["blog", "user"]));
}

function examples() {
    helper.header("SQL:EXCLUDE EXAMPLE");
    helper.log(User.exclude({id: 5}).sql);
    helper.log(User.exclude({id: [1, 2]}).sql);
    helper.log(User.exclude(patio.sql.name.like('%o%')).sql);
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




