"use strict";
var patio = require("../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format,
    config = require("./config"),
    db = config.connect("sandbox");

var User = patio.addModel("user", {
    pre: {
        "save": function (next) {
            console.log("pre save!!!");
            next();
        },

        "remove": function (next) {
            console.log("pre remove!!!");
            next();
        }
    },

    post: {
        "save": function (next) {
            console.log("post save!!!");
            next();
        },

        "remove": function (next) {
            console.log("post remove!!!");
            next();
        }
    },
    instance: {
        _setFirstName: function (firstName) {
            return firstName.charAt(0).toUpperCase() + firstName.substr(1);
        },

        _setLastName: function (lastName) {
            return lastName.charAt(0).toUpperCase() + lastName.substr(1);
        }
    }
});

module.exports = runExample;


function runExample() {
//connect and create schema
    return setup()
        .then(function () {
            var myUser = new User({
                firstName: "bob",
                lastName: "yukon",
                password: "password",
                dateOfBirth: new Date(1980, 8, 29)
            });
            console.log(User.order("userId").limit(100).group("userId").sql);
            //save the user
            return myUser.save()
                .then(function () {
                    console.log(format("%s %s was created at %s", myUser.firstName, myUser.lastName, myUser.created.toString()));
                    console.log(format("%s %s's id is %d", myUser.firstName, myUser.lastName, myUser.id));
                    return User.db.transaction(function () {
                        return User.forUpdate().first({id: myUser.id}).chain(function (user) {
                            // SELECT * FROM user WHERE id = 1 FOR UPDATE
                            user.password = null;
                            return user.save();
                        });
                    });

                })
                .then(function () {
                    return User.removeById(myUser.id);
                });
        })
        .then(teardown)
        .catch(fail);
}

function setup() {
    //This assumes new tables each time you could just connect to the database

    //drop and recreate the user
    return db
        .forceCreateTable("user", function () {
            this.primaryKey("id");
            this.firstName(String);
            this.lastName(String);
            this.password(String);
            this.dateOfBirth(Date);
            this.isVerified(Boolean, {"default": false});
            this.lastAccessed(Date);
            this.created(sql.TimeStamp);
            this.updated(sql.DateTime);
        })
        .then(function () {
            return patio.syncModels();
        });
};

function teardown() {
    return db.dropTable("user");
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}




