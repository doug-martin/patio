"use strict";
var patio = require("../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format,
    config = require("./config"),
    db = config.connect("sandbox"),
    User = patio.addModel("user"),
    Blog = patio.addModel("blog");

module.exports = runExamples;
function runExamples() {
//connect and create schema
    return setup()
        .then(findById)
        .then(first)
        .then(last)
        .then(getMethod)
        .then(all)
        .then(forEach)
        .then(map)
        .then(toHash)
        .then(isEmpty)
        .then(aggregateFunctions)
        .then(teardown)
        .catch(fail);
}

function findById() {
    console.log("\n\n=====FIND BY ID EXAMPLES=====\n\n");
    // Find user with primary key (id) 1
    return User.findById(1)
        .then(function (user) {
            console.log("FIND BY ID 1 = %s", user);
            User.findById(0);
        })
        .then(function (user) {
            console.log("FIND BY ID 0 = %s", user);
        });
}

function first() {
    console.log("\n\n=====FIRST EXAMPLES=====\n\n");
    return User.first()
        .then(function (first) {
            console.log("FIRST = %s", first);
            return User.first({name: 'Bob'})
        })
        .then(function (bob) {
            console.log("FIRST = %s", bob);
            return User.first(sql.name.like('B%'));
        })
        .then(function (user) {
            console.log("FIRST = %s", user);
            return User.select("name").first();
        })
        .then(function (user) {
            console.log("FIRST SELECT JUST NAME = " + user.id);
        });
}

function last() {
    console.log("\n\n=====LAST EXAMPLES=====\n\n");
    return User.order("name").last().then(function (user) {
        // SELECT * FROM user ORDER BY name DESC LIMIT 1
        console.log("LAST = %s", user);
    });
}

function getMethod() {
    console.log("\n\n=====GET EXAMPLES=====\n\n");
    return User.get("name").then(function (name) {
        // SELECT name FROM user LIMIT 1
        console.log("NAME = %s", name);
    });
}

function all() {
    console.log("\n\n=====ALL EXAMPLES=====\n\n");
    return User.all().then(function (users) {
        // SELECT * FROM user
        console.log("USERS = [%s]", users);
    });
}

function forEach() {
    console.log("\n\n=====FOREACH EXAMPLES=====\n\n");
    return User
        .forEach(function (user) {
            console.log("FOR EACH name = %s ", user.name);
        })
        .then(function () {
            return User.forEach(function (user) {
                console.log("FOREACH WITH PROMISE SETTING user with id:%d to isVerified to ", user.id, !user.isVerified);
                return user.update({isVerified: !user.isVerified});
            });
        })
        .then(function () {
            return console.log("DONE UDPATING EACH RECORD");
        });
}

function map() {
    console.log("\n\n=====MAP EXAMPLES=====\n\n");
    return User
        .map(function (user) {
            return user.name;
        })
        .then(function (userNames) {
            console.log("MAPPED USER NAMES = [%s]", userNames);
            return User.map(function (user) {
                return Blog.filter({userId: user.id}).map(function (blog) {
                    return blog.title;
                });
            });
        })
        .then(function (userBlogTitles) {
            console.log("MAPPED USER BLOG TITLES = [%s]", userBlogTitles);
            return User.map("name").then(function (userNames) {
                console.log("MAPPED USER NAMES BY COLUMN = [%s]", userNames);
            });
        })
        .then(function () {
            return User.selectMap("name").then(function (names) {
                console.log("SELECT MAP USER NAMES BY COLUMN = [%s]", names);
            });


        })
        .then(function () {
            return User.selectOrderMap("name").then(function (names) {
                console.log("SELECT ORDER MAP USER NAMES BY COLUMN = [%s]", names);
            });
        });
}

function toHash() {
    console.log("\n\n=====TO HASH EXAMPLES=====\n\n");
    return User.toHash("name", "id")
        .then(function (nameIdMap) {
            console.log("TO HASH = %j", nameIdMap);
            return User.toHash("id", "name");
        })
        .then(function (idNameMap) {
            console.log("INVERT TO HASH = %j", idNameMap);
            return User.toHash("name");
        })
        .then(function (idNameMap) {
            // SELECT * FROM user
            console.log("TO HASH ONE COLUMN = %j", idNameMap);
            return User.selectHash("name", "id");
        })
        .then(function (nameIdMap) {
            // SELECT name, id FROM user
            console.log("SELECT HASH = %j", nameIdMap);
        });
}

function isEmpty() {
    console.log("\n\n=====IS EMPTY EXAMPLES=====\n\n");
    return User.isEmpty()
        .then(function (isEmpty) {
            console.log("IS EMPTY = " + isEmpty);
            return User.filter({id: 0}).isEmpty();
        })
        .then(function (isEmpty) {
            console.log("IS EMPTY = " + isEmpty);
            return User.filter(sql.name.like('B%')).isEmpty();
        })
        .then(function (isEmpty) {
            console.log("IS EMPTY = " + isEmpty);
        });
}

function aggregateFunctions() {
    console.log("\n\n=====AGGREGATE EXAMPLES=====\n\n");
    return User.count()
        .then(function (count) {
            console.log("COUNT = " + count);
            return User.sum("id");
        })
        .then(function (count) {
            console.log("SUM = " + count);
            return User.avg("id");
        })
        .then(function (count) {
            console.log("AVG = " + count);
            return User.min("id");
        })
        .then(function (count) {
            console.log("MIN = " + count);
            return User.max("id");
        })
        .then(function (count) {
            console.log("MAX = " + count);
        });
}

//HELPER METHODS

function setup() {
    //This assumes new tables each time you could just connect to the database
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
                this.created(sql.TimeStamp);
                this.updated(sql.DateTime);
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
        .then(patio.syncModels)
        .then(function () {
            return User
                .save([
                    {
                        name: "Bob Yukon",
                        password: "password",
                        dateOfBirth: new Date(1980, 8, 2),
                        isVerified: true
                    },

                    {
                        name: "Suzy Yukon",
                        password: "password",
                        dateOfBirth: new Date(1982, 9, 2),
                        isVerified: true
                    }
                ])
                .then(function () {
                    return User.forEach(function (user) {
                        return Blog.save([
                            {
                                title: user.name + "'s Blog " + 1,
                                numPosts: 2,
                                numFollowers: 100,
                                userId: user.id
                            },
                            {
                                title: user.name + " Blog " + 2,
                                numPosts: 100,
                                numFollowers: 0,
                                userId: user.id
                            }
                        ]);
                    });
                });
        });
}

function teardown() {
    return db.dropTable("blog", "user");
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}