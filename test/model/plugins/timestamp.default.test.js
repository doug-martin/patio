"use strict";

var it = require('it'),
    assert = require('assert'),
    patio = require("../../../lib"),
    p = require('../../../lib/promise'),
    helper = require("../../data/timestampPlugin.helper.js");


it.describe("Timestamp default columns", function (it) {

    var emp, Employee;
    it.beforeAll(function () {
        Employee = patio.addModel("employee", {
            plugins: [patio.plugins.TimeStampPlugin],

            "static": {
                init: function () {
                    this.timestamp();
                }
            }
        });
        return helper.createSchemaAndSync();
    });

    it.beforeEach(function () {
        return Employee.remove().then(function () {
            return Employee.save({
                firstname: "doug",
                lastname: "martin",
                midinitial: null,
                gender: "M",
                street: "1 nowhere st.",
                city: "NOWHERE"
            }).then(function (e) {
                emp = e;
            });
        });
    });

    it.should("set created column on insertSql", function () {
        assert.isNotNull(emp.insertSql.match(/["|`]created["|`]\)/));
    });

    it.should("set updated or updateSql", function () {
        assert.isNotNull(emp.updateSql.match(/["|`]updated["|`]\s*=/));
    });

    it.should("set created column", function () {
        assert.isNull(emp.updated);
        assert.isNotNull(emp.created);
        assert.instanceOf(emp.created, patio.SQL.DateTime);
    });

    it.should("set updated column", function (next) {
        setTimeout(function () {
            emp.firstname = "dave";
            return p.nodeify(emp.save().then(function () {
                //force reload
                assert.isNotNull(emp.updated);
                assert.instanceOf(emp.updated, patio.SQL.DateTime);
                assert.notDeepEqual(emp.updated, emp.createdAt);
            }), next);
        }, 1000);
    });

    it.afterAll(function () {
        return helper.dropModels();
    });
});