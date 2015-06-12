"use strict";

var patio = require("../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format;

patio.camelize = true;
patio.configureLogging();
patio.LOGGER.level = comb.logging.Level.ERROR;

var DB = patio.connect("mysql://root@localhost:3306/sandbox");
var User = patio.addModel("user");
var Blog = patio.addModel("blog");

//disconnect and error callback helpers
var disconnect = function () {
    DB.forceDropTable("blog", "user").then(function () {
        comb.hitch(patio, "disconnect");
    });
};

var disconnectError = function (err) {
    patio.logError(err);
    DB.forceDropTable("blog", "user").then(function () {
        comb.hitch(patio, "disconnect");
    });
};

var connectAndCreateSchema = function () {
    //This assumes new tables each time you could just connect to the database
    return comb.serial([
        function () {
            return DB.forceDropTable("blog", "user");
        },
        function () {
            //drop and recreate the user
            return DB.createTable("user", function () {
                this.primaryKey("id");
                this.name(String);
                this.password(String);
                this.dateOfBirth(Date);
                this.isVerified(Boolean, {"default": false});
                this.lastAccessed(Date);
                this.created(sql.TimeStamp);
                this.updated(sql.DateTime);
            });
        },
        function () {
            return DB.createTable("blog", function () {
                this.primaryKey("id");
                this.title(String);
                this.numPosts("integer");
                this.numFollowers("integer");
                this.foreignKey("userId", "user", {key: "id"});
            });
        },
        comb.hitch(patio, "syncModels")
    ]);
};

var createData = function () {
    return User.save([
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
    ]).then(function () {
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
};

var findById = function () {
    // Find user with primary key (id) 1
    return Promise.all([
        User.findById(1).then(function (user) {
            console.log("FIND BY ID 1 = %s", user);
        }),
        // Find user with primary key (id) 1
        User.findById(0).then(function (user) {
            console.log("FING BY ID 0 = %s", user);
        })
    ]);
};

var first = function () {
    return Promise.all([
        User.first().then(function (first) {
            console.log("FIRST = %s", first);
        }),

        User.first({name: 'Bob'}).then(function (bob) {
            // SELECT * FROM user WHERE (name = 'Bob') LIMIT 1
            console.log("FIRST = %s", bob);
        }),
        User.first(sql.name.like('B%')).then(function (user) {
            // SELECT * FROM user WHERE (name LIKE 'B%') LIMIT 1
            console.log("FIRST = %s", user);
        }),
        User.select("name").first().then(function (user) {
            console.log("FIRST SELECT JUST NAME = " + user.id);
        })
    ]);
};

var last = function () {
    return User.order("name").last().then(function (user) {
        // SELECT * FROM user ORDER BY name DESC LIMIT 1
        console.log("LAST = %s", user);
    });
};

var getMethod = function () {
    return User.get("name").then(function (name) {
        // SELECT name FROM user LIMIT 1
        console.log("NAME = %s", name);
    });
};

var all = function () {
    return User.all().then(function (users) {
        // SELECT * FROM user
        console.log("USERS = [%s]", users);
    });
};

var forEach = function () {
    return Promise.all([
        // SELECT * FROM user
        User.forEach(function (user) {
            console.log("FOR EACH name = %s ", user.name);
        }),
        // SELECT * FROM user
        User.forEach(function (user) {
            console.log("FOREACH WITH PROMISE SETTING user with id:%d to isVerified to ", user.id, !user.isVerified);
            return user.update({isVerified: !user.isVerified});
        })
    ]).then(function () {
        console.log("DONE UDPATING EACH RECORD");
    });
};

var map = function () {
    return Promise.all([
        // SELECT * FROM user
        User.map(
            function (user) {
                return user.name;
            }).then(function (userNames) {
                console.log("MAPPED USER NAMES = [%s]", userNames);
            }),
        // SELECT * FROM user
        User.map(function (user) {
            return Blog.filter({userId: user.id}).map(function (blog) {
                return blog.title;
            });
        }),
        User.map("name").then(function (userNames) {
            console.log("MAPPED USER NAMES BY COLUMN = [%s]", userNames);
        }),
        User.selectMap("name").then(function (names) {
            console.log("SELECT MAP USER NAMES BY COLUMN = [%s]", names);
        }),

        User.selectOrderMap("name").then(function (names) {
            console.log("SELECT ORDER MAP USER NAMES BY COLUMN = [%s]", names);
        })
    ]).then(function (userBlogTitles) {
        userBlogTitles.forEach(function (titles) {
            console.log("MAPPED USER BLOG TITLES = [%s]", titles);
        });
    }, disconnectError);
};

var toHash = function () {
    return Promise.all([
        User.toHash("name", "id").then(function (nameIdMap) {
            // SELECT * FROM user
            console.log("TO HASH = %j", nameIdMap);
        }),

        User.toHash("id", "name").then(function (idNameMap) {
            // SELECT * FROM user
            console.log("INVERT TO HASH = %j", idNameMap);
        }),
        User.toHash("name").then(function (idNameMap) {
            // SELECT * FROM user
            console.log("TO HASH ONE COLUMN = %j", idNameMap);
        }),

        User.selectHash("name", "id").then(function (map) {
            // SELECT name, id FROM user
            console.log("SELECT HASH = %j", map);
        })
    ]);
};
var forUpdate = function () {
    return DB.transaction(function () {
        return User.forUpdate().first({id: 1}).then(function (user) {
            // SELECT * FROM user WHERE id = 1 FOR UPDATE
            user.password = null;
            return user.save();
        });
    });
};

var isEmpty = function () {
    return Promise.all([
        User.isEmpty().then(function (isEmpty) {
            console.log("IS EMPTY = " + isEmpty);
        }),
        User.filter({id: 0}).isEmpty().then(function (isEmpty) {
            console.log("IS EMPTY = " + isEmpty);
        }),
        User.filter(sql.name.like('B%')).isEmpty().then(function (isEmpty) {
            console.log("IS EMPTY = " + isEmpty);
        })
    ]);
};

var aggregateFunctions = function () {
    return Promise.all([
        User.count().then(function (count) {
            console.log("COUNT = " + count);
        }),
        User.sum("id").then(function (count) {
            console.log("SUM = " + count);
        }),
        User.avg("id").then(function (count) {
            console.log("AVG = " + count);
        }),
        User.min("id").then(function (count) {
            console.log("MIN = " + count);
        }),

        User.max("id").then(function (count) {
            console.log("MAX = " + count);
        })
    ]);
};


//connect and create schema
connectAndCreateSchema()
    .then(createData, disconnectError)
    .then(function () {
        findById()
            .then(first, disconnectError)
            .then(last, disconnectError)
            .then(getMethod, disconnectError)
            .then(first, disconnectError)
            .then(all, disconnectError)
            .then(forEach, disconnectError)
            .then(map, disconnectError)
            .then(toHash, disconnectError)
            .then(forUpdate, disconnectError)
            .then(isEmpty, disconnectError)
            .then(aggregateFunctions, disconnectError)
            .then(function () {
                console.log("\n\n=====SQL EXAMPLES=====\n\n")
                // SELECT * FROM user WHERE id = 1
                console.log(User.filter({id: 1}).sql);

                // SELECT * FROM user WHERE name = 'bob'
                console.log(User.filter({name: 'bob'}).sql);

                console.log(User.filter({id: [1, 2]}).sql);

                console.log(User.filter({id: Blog.select("userId")}).sql);

                console.log(User.filter({id: null}).sql);
                console.log(User.filter({id: true}).sql);
                console.log(User.filter({id: false}).sql);
                console.log(User.filter({name: /Bo$/}).sql);

                console.log(User.filter({id: 1, name: /Bo$/}).sql);
                console.log(User.filter({id: 1}).filter({name: /Bo$/}).sql);

                console.log(User.filter({name: {like: /ob$/, between: ["A", "Z"]}}).sql);

                console.log(User.filter([
                    ["name", /oB$/],
                    [sql.name, /^Bo/]
                ]).sql);

                console.log(User.filter(
                    function () {
                        return this.id.gt(5)
                    }).sql);

                console.log(User.filter({name: {between: ['K', 'M']}},
                    function () {
                        return this.id.gt(5);
                    }).sql);

                console.log(User.filter("isActive").sql);
                console.log(User.filter(sql.literal("name < 'A'")).sql);

                console.log(User.filter(sql.name.like('B%')).sql);

                console.log(User.filter(sql.name.like('B%').and(sql.b.eq(1).or(sql.c.neq(3)))).sql);

                console.log(User.filter(
                    function () {
                        return this.a.gt(1).and(this.b("c").and(this.d)).not();
                    }).sql);

                console.log(User.filter("name LIKE ?", 'B%').sql);

                console.log(User.filter("name LIKE ? AND id = ?", 'B%', 1).sql);

                console.log(User.filter("name LIKE {name} AND id = {id}", {name: 'B%', id: 1}).sql);

                console.log(User.filter(sql.literal("id = 2")).sql);
                var id = 1;
                console.log(User.filter(sql.literal("id = " + id)).sql); //id could be anything so dont do it!
                console.log(User.filter("id = ?", id).sql); //Do this as patio will escape it
                console.log(User.filter({id: id}).sql); // Best solution!

                console.log(User.filter({id: 5}).invert().sql);

                console.log(User.filter({id: {neq: 5}}).sql);

                console.log(User.filter({id: 5}).filter(
                    function () {
                        return this.name.gt('A');
                    }).invert().sql);

                console.log(User.exclude({id: 5}).sql);

                console.log(User.filter({id: 5}).exclude(
                    function () {
                        return this.name.gt('A')
                    }).sql);

                console.log(User.exclude({id: [1, 2]}).sql);
                console.log(User.exclude(sql.name.like('%o%')).sql);

                console.log(User.filter({id: 1}).unfiltered().sql);
                console.log(User.order("id").sql);
                console.log(User.order("userId", "id").sql);
                console.log(User.order("id").order("name").sql);
                console.log(User.order("id").orderAppend("name").sql);
                console.log(User.order("id").orderPrepend("name").sql);
                console.log(User.order("id").reverse().sql);

                console.log(User.order(sql.id.desc()).sql);
                console.log(User.order("name", sql.id.desc()).sql);
                console.log(User.order("name").unordered().sql);

                console.log(User.select("id", "name").sql);
                console.log(User.select("id").select("name").sql);
                console.log(User.select("id").selectAppend("name").sql);
                console.log(User.select("id").selectAll().sql);
                console.log(User.distinct().select("name").sql);

                console.log(User.limit(5).sql);
                console.log(User.limit(5, 10).sql);
                console.log(User.limit(5, 10).unlimited().sql);

                console.log(User.group("userId").sql);

                console.log(User.group("userId").ungrouped().sql);
                console.log(User.groupAndCount("userId").sql);

                console.log(User.groupAndCount("dateOfBirth").having(
                    function () {
                        return this.count.gte(10);
                    }).sql);

                console.log(User.groupAndCount("dateOfBirth").having(
                    function () {
                        return this.count.gte(10);
                    }).filter(
                    function () {
                        return this.count.lt(15);
                    }).sql);
                console.log(User.groupAndCount("id").having(function () {
                    return this.count.gte(10);
                }).where(sql.name.like('A%')).sql);

                console.log(User.groupAndCount("id").having(function () {
                    return this.count.gte(10);
                }).where(sql.name.like('A%')).unfiltered().sql);

                console.log(User.joinTable("inner", "blog", {userId: sql.id}).sql)

                console.log(User.joinTable("inner", "blog", {userId: sql.id}).sql);
                // SELECT * FROM user INNER JOIN blog ON blog.user_id = user.id

                console.log(User.joinTable("inner", "blog", {userId: "id"}).sql);
                // SELECT * FROM user INNER JOIN blog ON blog.userId = 'id'

                console.log(User.join("blog", {userId: sql.id}).sql);
                console.log(User.leftJoin("blog", {userId: sql.id}).sql);

                console.log(User.join(Blog, {userId: sql.id}).sql);

                console.log(User.join(Blog.filter({title: {lt: 'A'}}), {userId: sql.id}).sql);

                console.log(User.join("blog", {userId: sql.id}).join("posts", {blogId: sql.id}).sql);

                console.log(User.join("blog", {userId: sql.id}).join("posts", {userId: sql.id}).sql);
                console.log(User.join("blog", {userId: sql.id}).join("posts", {userId: sql.id.qualify("user")}).sql);
                console.log(User.join("blog", {userId: sql.id}).join("posts", {userId: sql.user__id}).sql);
                console.log(User.join("blog", [
                    [sql.userId, sql.id],
                    [sql.id, {between: [1, 5]}]
                ]).sql);

                console.log(User.join("blog", [sql.userId]).sql);
                console.log(User.naturalJoin("blog").sql);

                console.log(User.join("blog", {userId: sql.id}, function (currAlias, lastAlias, previousJoins) {
                    return sql.name.qualify(lastAlias).lt(sql.title.qualify(currAlias));
                }).sql);
                console.log(User.join("blog", {userId: sql.id, title: {gt: sql.name.qualify("user")}}).sql);

                console.log(DB.from("user").sql);
                console.log(User.from("user", "oldUser").sql);
                console.log(DB.from("user").from("oldUser").sql);

                console.log(Blog.order("userId").limit(100).fromSelf().group("userId").sql);
                console.log(Blog.order("userId").limit(100).group("userId").sql);

                console.log(DB.fetch("SELECT * FROM user").sql);
                console.log(DB.from("user").withSql("SELECT * FROM user").sql);

                console.log(DB.fetch("SELECT * FROM user WHERE id = ?", 5).sql);
                console.log(DB.from("user").withSql("SELECT * FROM user WHERE id = {id}", {id: 5}).sql);
                disconnect();
            }, disconnectError);
    }, disconnectError);

