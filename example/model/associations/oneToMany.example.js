"use strict";

var patio = require("../../../lib"),
    helper = require("../../helper"),
    db = helper.connect("sandbox");

//define the BiologicalFather model
var BiologicalFather = patio
    .addModel("biologicalFather")
    .oneToMany("children");

//define the StepFather model
var StepFather = patio
    .addModel("stepFather")
    .oneToMany("children", {key: "id"});

//define Child  model
var Child = patio
    .addModel("child")
    .manyToOne("biologicalFather")
    .manyToOne("stepFather", {key: "name"});

module.exports = runExample;

function runExample() {
    return setup()
        .then(queryBiologicalFather)
        .then(queryStepFather)
        .then(queryChildren)
        .then(teardown)
        .catch(fail);
}

function queryBiologicalFather() {
    helper.header("QUERY BIOLOGICAL FATHER");
    return BiologicalFather.forEach(function (father) {
        return father.children.then(function (children) {
            helper.log("BiologicalFather " + father.name + " has " + children.length + " children");
            return printChildren(children);
        });
    }, 1);
}

function queryStepFather() {
    helper.header("QUERY STEP FATHER");
    return StepFather.forEach(function (father) {
        return father.children.then(function (children) {
            helper.log("StepFather " + father.name + " has " + children.length + " children");
            return printChildren(children);
        });
    });
}

function queryChildren() {
    helper.header("QUERY CHILDREN");
    return Child.forEach(function (child) {
        console.log(child.toObject());
        return child
            .biologicalFather
            .then(function (biologicalFather) {
                if (biologicalFather) {
                    helper.log("%s biological father is %s", child.name, biologicalFather.name);
                } else {
                    helper.log("%s does not have a biological father", child.name);
                }
                return child.stepFather;
            })
            .then(function (stepFather) {
                if (stepFather) {
                    helper.log("%s step father is %s", child.name, stepFather.name);
                } else {
                    helper.log("%s does not have a step father", child.name);
                }
            });
    }, 1);
}

//HELPER METHODS

function printChildren(children) {
    if (children.length) {
        var childNames = children.map(function (child) {
            return child.name;
        });
        helper.log("The children's names are " + childNames);
    }
}

function setup() {
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
                this.foreignKey("biologicalFatherId", "biologicalFather", {key: "id"});
                this.foreignKey("stepFatherId", "stepFather", {key: "name", type: String});
            });
        })
        .then(patio.syncModels)
        .then(createData);

}

function createData() {
    return Child.save([
        {name: "Bobby"},
        {name: "Alice"},
        {name: "Susan"},
        {name: "Brad"}
    ])
        .then(function (children) {
            return BiologicalFather
                .save([
                    {
                        name: "Fred",
                        children: children.filter(function (child) {
                            return child.name !== "Brad";
                        })
                    },
                    {name: "Ben"},
                    {name: "Bob"},
                    {
                        name: "Scott",
                        children: children.filter(function (child) {
                            return child.name === "Brad";
                        })
                    }
                ])
                .then(function () {
                    //you could associate the children directly but we wont for this example
                    return StepFather.save([
                        {
                            name: "Fred",
                            children: children.filter(function (child) {
                                return child.name !== "Brad";
                            })
                        },
                        {name: "Ben"},
                        {name: "Bob"},
                        {
                            name: "Scott",
                            children: children.filter(function (child) {
                                return child.name === "Brad";
                            })
                        }
                    ]);
                });
        });

}

function teardown() {
    return db.dropTable("child", "stepFather", "biologicalFather");
}

function fail(err) {
    console.log(err.stack);
    return teardown().then(function () {
        return Promise.reject(err);
    });
}



