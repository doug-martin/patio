"use strict";
var patio = require("../index"),
    sql = patio.sql,
    comb = require("comb"),
    config = require("./config"),
    format = comb.string.format,
    db = config.connect("sandbox"),
    User = patio.addModel("user"),
    Blog = patio.addModel("blog");

patio.camelize = true;

module.exports = runExamples;

function runExamples() {
    return setup().then(function (db) {
        return Promise.resolve(sqlExamples());
    });
}

function sqlExamples() {
    console.log("\n\n=====SQL EXAMPLES=====\n\n");
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

    console.log(User.filter(function () {
        return this.id.gt(5);
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
            return this.name.gt('A');
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

    console.log(User.joinTable("inner", "blog", {userId: sql.id}).sql);

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
    console.log(User.join("blog", {userId: sql.id}).join("posts", {userId: sql["user__id"]}).sql);
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

    console.log(db.from("user").sql);
    console.log(User.from("user", "oldUser").sql);
    console.log(db.from("user").from("oldUser").sql);

    console.log(Blog.order("userId").limit(100).fromSelf().group("userId").sql);
    console.log(Blog.order("userId").limit(100).group("userId").sql);

    console.log(db.fetch("SELECT * FROM user").sql);
    console.log(db.from("user").withSql("SELECT * FROM user").sql);

    console.log(db.fetch("SELECT * FROM user WHERE id = ?", 5).sql);
    console.log(db.from("user").withSql("SELECT * FROM user WHERE id = {id}", {id: 5}).sql);
}


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
            return db;
        });
}