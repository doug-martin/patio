"use strict";
var it = require('it'),
    assert = require('assert'),
    helper = require("./../data/model.helper.js"),
    patio = require("../../lib");


it.describe("patio.Model with a custom dataset", function (it) {

    it.beforeAll(function () {
        return helper.createSchemaAndSync();
    });

    var CustomDataset, Employee;

    it.beforeAll(function () {
        var db = patio.defaultDatabase;
        CustomDataset = patio.addModel(db.from("employee").filter({city: {like: /^O/i}}));
        Employee = patio.addModel("employee");
        return patio.syncModels();
    });

    it.beforeEach(function () {
        return patio.defaultDatabase.from("employee").remove();
    });


    it.should("Filter employees properly", function () {
        return Employee
            .save([
                {
                    firstname: "Bob",
                    lastname: "Yukon",
                    street: "Street",
                    city: "Ord"
                },
                {
                    firstname: "Sally",
                    lastname: "Yukon",
                    street: "Street",
                    city: "Denver"
                },
                {
                    firstname: "Greg",
                    lastname: "Yukon",
                    street: "Street",
                    city: "Boston"
                },
                {
                    firstname: "Tom",
                    lastname: "Yukon",
                    street: "Street",
                    city: "Omaha"
                }
            ]).then(function () {
                return CustomDataset.all();
            })
            .then(function (emps) {
                assert.lengthOf(emps, 2);
            });
    });

    it.afterAll(function () {
        return helper.dropModels();
    });
});