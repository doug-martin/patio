"use strict";
var patio = require("../../index"),
    helper = require("../helper"),
    db = helper.connect("sandbox");


var Employee = patio.addModel("employee", {
    plugins: [patio.plugins.ClassTableInheritancePlugin]
}).configure({key: "kind"});

var Staff = patio.addModel("staff", Employee)
    .manyToOne("manager", {key: "managerId", fetchType: patio.fetchTypes.EAGER}).as(module);

var Manager = patio.addModel("manager", Employee)
    .oneToMany("staff", {key: "managerId", fetchType: patio.fetchTypes.EAGER});

var Executive = patio.addModel("executive", Manager);

module.exports = runExample;

function runExample() {
    return setup()
        .then(createEmployees)
        .then(fetchEmployees)
        .then(teardown)
        .catch(fail);
}

function createEmployees() {
    return Promise.all([
        new Employee({name: "Bob"}).save(),
        new Staff({name: "Greg"}).save(),
        new Manager({name: "Jane"}).save(),
        new Executive({name: "Sue"}).save()
    ]);
}

function fetchEmployees() {
    helper.header("INHERITANCE EXAMPLE");
    return Employee.forEach(function (emp) {
        helper.log("Employee %d", emp.id);
        helper.log("name - %s", emp.name);
        helper.log("kind - %s", emp.kind);
        helper.log("instanceof Employee? %s", emp instanceof Employee);
        helper.log("instanceof Staff? %s", emp instanceof Staff);
        helper.log("instanceof Manager? %s", emp instanceof Manager);
        helper.log("instanceof Executive? %s", emp instanceof Executive);
    });
}

//HELPER METHODS

function setup() {
    return db.forceDropTable(["staff", "executive", "manager", "employee"])
        .then(function () {
            return db.createTable("employee", function () {
                this.primaryKey("id");
                this.name(String);
                this.kind(String);
            });
        })
        .then(function () {
            return db.createTable("manager", function () {
                this.foreignKey("id", "employee", {key: "id", unique: true});
                this.numStaff("integer");
            });
        })
        .then(function () {
            return db.createTable("executive", function () {
                this.foreignKey("id", "manager", {key: "id"});
                this.numManagers("integer");
            });
        })
        .then(function () {
            return db.createTable("staff", function () {
                this.foreignKey("id", "employee", {key: "id"});
                this.foreignKey("managerId", "manager", {key: "id"});
            });
        })
        .then(patio.syncModels);
}

function teardown() {
    return db.forceDropTable(["staff", "executive", "manager", "employee"])
        .chain(function () {
            return patio.disconnect();
        });
}

function fail(err) {
    return teardown().then(function () {
        return Promise.reject(err);
    });
}

