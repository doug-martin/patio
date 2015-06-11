"use strict";

var it = require('it'),
    assert = require('assert'),
    patio = require("../../../lib"),
    helper = require("../../data/timestampPlugin.helper.js"),
    p = require('../../../lib/promise'),
    Employee;

it.describe("Timestamp custom columns", function (it) {

    var emp;
    it.beforeAll(function () {
        Employee = patio.addModel("employee", {
            plugins: [patio.plugins.TimeStampPlugin],

            "static": {
                init: function () {
                    this.timestamp({updated: "updatedAt", created: "createdAt"});
                }
            }
        });
        return helper.createSchemaAndSync(true);
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
        assert.isNotNull(emp.insertSql.match(/["|`]createdAt["|`]\)/));
    });

    it.should("set updated or updateSql", function () {
        assert.isNotNull(emp.updateSql.match(/["|`]updatedAt["|`]\s*=/));
    });

    it.should("set created column", function () {
        assert.isNull(emp.updatedAt);
        assert.isNotNull(emp.createdAt);
        assert.instanceOf(emp.createdAt, patio.SQL.DateTime);
    });

    it.should("set updated column", function (next) {
        setTimeout(function () {
            emp.firstname = "dave";
            return p.nodeify(emp.save().then(function () {
                //force reload
                assert.isNotNull(emp.updatedAt);
                assert.instanceOf(emp.updatedAt, patio.SQL.DateTime);
                assert.notDeepEqual(emp.updatedAt, emp.createdAt);
            }), next);
        }, 1000);
    });

    it.afterAll(function () {
        return helper.dropModels();
    });

});