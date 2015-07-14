"use strict";
var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox");

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
    helper.header("CUSTOM SETTER EXAMPLE");
    var myUser = new User();
    helper.log("setting firstName to 'sally'");
    myUser.firstName = 'sally';
    helper.log("set firstName to 'sally' custom setter transformed to %s", myUser.firstName);

    helper.log("setting lastName to 'ford'");
    myUser.lastName = 'ford';
    helper.log("set lastName to 'ford' custom setter transformed to %s", myUser.lastName);

    helper.log("INSERT SQL = '%s'", myUser.insertSql);
}

function getterExample() {
    helper.header("CUSTOM GETTER EXAMPLE");
    var myUser = new User(),
        roles = "admin,user,groupAdmin";
    helper.log("setting roles name to '%s'", roles);
    myUser.roles = roles;
    helper.log("get roles returned as to %j", myUser.roles);
    helper.log("INSERT SQL = '%s'", myUser.insertSql);
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




