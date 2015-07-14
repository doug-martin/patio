"use strict";

var patio = require("../../../lib"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format,
    helper = require("../../helper"),
    db = helper.connect("sandbox");

//define the BiologicalFather model
var BiologicalFather = patio
    .addModel("biologicalFather")
    .oneToMany("children")
    .oneToMany("letterBChildren", {
        model: "child",
        fetchType: patio.fetchTypes.EAGER,
        dataset: function () {
            return this.db.from("child").filter({name: {like: "B%"}, biologicalFatherId: this.id});
        }
    });


//define Child  model
var Child = patio.addModel("child").manyToOne("biologicalFather");

module.exports = runExample;

function runExample() {
    return setup()
        .then(saveExample)
        .then(queryExampleOne)
        .then(teardown)
        .catch(fail);
}


function saveExample() {
    helper.header("CUSTOM DATASET SAVE EXAMPLE");
    //create some data
    return BiologicalFather.save([
        {
            name: "Fred",
            //each of the children will be persisted when save is called
            children: [
                {name: "Bobby"},
                {name: "Alice"},
                {name: "Susan"}
            ]
        },
        {name: "Ben"},
        {name: "Bob"},
        {
            name: "Scott",
            //each of the children will be persisted when save is called
            children: [
                {name: "Brad"}
            ]
        }
    ]);
}

function queryExampleOne() {
    helper.header("CUSTOM DATASET QUERY ONE EXAMPLE");
    return BiologicalFather.forEach(function (father) {
        //check our custom dataset for children
        if (father.letterBChildren.length > 0) {
            helper.log(father.name + " has " + father.letterBChildren.length + " B children");
            helper.log("The B letter children's names are " + father.letterBChildren.map(function (child) {
                    return child.name;
                }));
        }
        return father.children.then(function (children) {
            helper.log(father.name + " has " + children.length + " children");
            if (children.length) {
                helper.log("The children's names are " + children.map(function (child) {
                        return child.name;
                    }));
            }
        });
    });
}

function queryExampleTwo() {
    helper.header("CUSTOM DATASET QUERY TWO EXAMPLE");
    return Child.findById(1).then(function (child) {
        return child.biologicalFather.then(function (father) {
            helper.log(child.name + " father is " + father.name);
        });
    });
}

function setup() {
    return db
        .forceDropTable("child", "biologicalFather")
        .then(function () {
            return db.createTable("biologicalFather", function () {
                this.primaryKey("id");
                this.name(String);
            });
        })
        .then(function () {
            return db.createTable("child", function () {
                this.primaryKey("id");
                this.name(String);
                this.foreignKey("biologicalFatherId", "biologicalFather", {key: "id"});
            });
        })
        .then(patio.syncModels);
}

function teardown() {
    return db.dropTable("child", "biologicalFather");
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}