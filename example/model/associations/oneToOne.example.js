"use strict";

var patio = require("../../../lib"),
    helper = require("../../helper"),
    db = helper.connect("sandbox");

var State = patio
    .addModel("state")
    .oneToOne("capital");

var Capital = patio
    .addModel("capital")
    .manyToOne("state");

module.exports = runExample;

function runExample() {
    return setup()
        .then(queryStates)
        .then(queryCapitals)
        .then(teardown)
        .catch(fail);
}

function queryStates() {
    helper.header("QUERY STATES");
    return State.order("name").forEach(function (state) {
        return state.capital.then(function (capital) {
            helper.log("%s's capital is %s.", state.name, capital.name);
        });
    });
}

function queryCapitals() {
    helper.header("QUERY CAPITALS");
    return Capital.order("name").forEach(function (capital) {
        return capital.state.then(function (state) {
            helper.log("%s is the capital of %s.", capital.name, state.name);
        });
    });
}

// * * * * * * * * * * * * * * *
// HELPER METHODS
// * * * * * * * * * * * * * * *

function setup() {
    return createTables()
        .then(patio.syncModels)
        .then(createData);
}

function createTables() {
    return db.forceDropTable(["capital", "state"])
        .then(function () {
            return db.createTable("state", function () {
                this.primaryKey("id");
                this.name(String);
                this.population("integer");
                this.founded(Date);
                this.climate(String);
                this.description("text");
            });
        })
        .then(function () {
            return db.createTable("capital", function () {
                this.primaryKey("id");
                this.population("integer");
                this.name(String);
                this.founded(Date);
                this.foreignKey("stateId", "state", {key: "id"});
            });
        });
}

function createData() {
    return State.save({
        name: "Nebraska",
        population: 1796619,
        founded: new Date(1867, 2, 4),
        climate: "continental",
        capital: {
            name: "Lincoln",
            founded: new Date(1856, 0, 1),
            population: 258379

        }
    }).then(function () {
        return Capital.save({
            name: "Austin",
            founded: new Date(1835, 0, 1),
            population: 790390,
            state: {
                name: "Texas",
                population: 25674681,
                founded: new Date(1845, 11, 29)
            }
        });
    });
}


function teardown() {
    return db.dropTable(["capital", "state"]);
}

function fail(err) {
    console.log(err.stack);
    return teardown().then(function () {
        return Promise.reject(err);
    });
}
