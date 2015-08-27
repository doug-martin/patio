"use strict";

var patio = require("../../../lib"),
    helper = require("../../helper"),
    db = helper.connect("sandbox");

var BiologicalFather = patio
    .addModel("biologicalFather")
    .oneToMany("children", {key: "biologicalFatherKey"});

var StepFather = patio
    .addModel("stepFather")
    .oneToMany("children", {key: "stepFatherKey"});

var Child = patio
    .addModel("child")
    .manyToOne("biologicalFather", {key: "biologicalFatherKey"})
    .manyToOne("stepFather", {key: "stepFatherKey"});

module.exports = runExample;

function runExample() {
    return setup()
        .then(biologicalFather)
        .then(stepFather)
        .then(children)
        .then(teardown)
        .catch(fail);
}

function biologicalFather() {
    helper.header("QUERY BIOLOGICAL FATHER");
    return BiologicalFather.forEach(function (father) {
        return father.children.then(function (children) {
            helper.log("Father %s has %d children", father.name, children.length);
            if (children.length) {
                helper.log("\tThe children's names are %s", children.map(function (child) {
                    return child.name;
                }));
            }
        });
    });
}

function stepFather() {
    helper.header("QUERY STEP FATHER");
    return StepFather.forEach(function (father) {
        return father.children.then(function (children) {
            helper.log("Step father %s has %d children", father.name, children.length);
            if (children.length) {
                helper.log("\tThe children's names are %s", children.map(function (child) {
                    return child.name;
                }));
            }
        });
    });
}

function children() {
    helper.header("QUERY CHILDREN");
    return Child.forEach(function (child) {
        return child.biologicalFather.then(function (biologicalFather) {
            if (biologicalFather) {
                helper.log("The biological father of %s is %s", child.name, biologicalFather.name);
            } else {
                helper.log("%s does not have a biological father", child.name);
            }

            return child.stepFather.then(function (stepFather) {
                if (stepFather) {
                    helper.log("The step father of %s is %s", child.name, stepFather.name);
                } else {
                    helper.log("%s does not have a step father", child.name);
                }

                helper.log("");
            });
        });
    }, 1);
}

function setup() {
    return createTables()
        .then(patio.syncModels)
        .then(createData);
}

function createTables() {
    return db.forceDropTable("child", "stepFather", "biologicalFather")
        .then(function () {
            return db.createTable("biologicalFather", function () {
                this.primaryKey("id");
                this.name(String);
            });
        })
        .then(function () {
            return db.createTable("stepFather", function () {
                this.primaryKey("id");
                this.name(String, {unique: true});
            });
        })
        .then(function () {
            return db.createTable("child", function () {
                this.primaryKey("id");
                this.name(String);
                this.foreignKey("biologicalFatherKey", "biologicalFather", {key: "id"});
                this.foreignKey("stepFatherKey", "stepFather", {key: "name", type: String});
            });
        });
}

function createData() {
    return BiologicalFather
        .save([
            {
                name: "Fred",
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
                children: [
                    {name: "Brad"}
                ]
            }
        ])
        .then(function () {
            return StepFather.save([
                {
                    name: "Fred",
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
                    children: [
                        {name: "Brad"}
                    ]
                }
            ]);
        });
}

// Helper Methods

function teardown() {
    return db.dropTable("child", "stepFather", "biologicalFather");
}

function fail(err) {
    console.log(err.stack);
    return teardown().then(function () {
        return Promise.reject(err);
    });
}
