"use strict";
var patio = require("../../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format,
    config = require("../config"),
    db = config.connect("sandbox");

var User = patio.addModel("user", {
    instance: {

        //only used when returning roles using user.roles
        //will be persisted as string
        _getRoles: function (roles) {
            return roles.split(",");
        },

        //transforms the firstName to proper case before it is set on the model instance
        //the persisted firstname will be proper case
        _setFirstName: function (firstName) {
            return firstName.charAt(0).toUpperCase() + firstName.substr(1);
        },

        //transforms the lastName to proper case before it is set on the model instance
        //the persisted firstname will be proper case
        _setLastName: function (lastName) {
            return lastName.charAt(0).toUpperCase() + lastName.substr(1);
        }
    }
});

module.exports = runExample;


function runExample() {
//connect and create schema
    return setup()
        .then(setterExample)
        .then(getterExample)
        .then(teardown)
        .catch(fail);
}

function setterExample() {
    console.log("\n\n=====CUSTOM SETTER EXAMPLE=====");
    var myUser = new User();
    console.log("setting firstName to 'sally'");
    myUser.firstName = 'sally';
    console.log("set firstName to 'sally' custom setter transformed to %s", myUser.firstName);

    console.log("setting lastName to 'ford'");
    myUser.lastName = 'ford';
    console.log("set lastName to 'ford' custom setter transformed to %s", myUser.lastName);

    console.log("INSERT SQL = '%s'", myUser.insertSql);
}

function getterExample() {
    console.log("\n\n=====CUSTOM GETTER EXAMPLE=====");
    var myUser = new User(),
        roles = "admin,user,groupAdmin";
    console.log("setting roles name to '%s'", roles);
    myUser.roles = roles;
    console.log("get roles returned as to %j", myUser.roles);
    console.log("INSERT SQL = '%s'", myUser.insertSql);
}

//HELPER METHODS

function setup() {
    return db
        .forceCreateTable("user", function () {
            this.primaryKey("id");
            this.firstName(String);
            this.lastName(String);
            this.roles(String);
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




