"use strict";

var it = require('it'),
    assert = require('assert'),
    helper = require("../../../data/oneToOne.helper.js"),
    patio = require("../../../../lib"),
    comb = require("comb"),
    hitch = comb.hitch;


var gender = ["M", "F"];
it.describe("patio.Model oneToOne with custom filter", function (it) {
    var Works, Employee;
    it.beforeAll(function () {
        Works = patio.addModel("works").manyToOne("employee");
        Employee = patio.addModel("employee").oneToOne("works", function (ds) {
            return ds.filter(function () {
                return this.salary.gte(100000.00);
            });
        });
        return helper.createSchemaAndSync(true);
    });


    it.should("have associations", function () {
        assert.deepEqual(Employee.associations, ["works"]);
        assert.deepEqual(Works.associations, ["employee"]);
        var emp = new Employee();
        var work = new Works();
        assert.deepEqual(emp.associations, ["works"]);
        assert.deepEqual(work.associations, ["employee"]);
    });

    it.describe("create a new model with association", function (it) {

        it.beforeAll(function () {
            return Promise.all([Employee.remove(), Works.remove()]);
        });


        it.should("save nested models when using new", function () {
            var employee = new Employee({
                lastName: "last" + 1,
                firstName: "first" + 1,
                midInitial: "m",
                gender: gender[1 % 2],
                street: "Street " + 1,
                city: "City " + 1,
                works: {
                    companyName: "Google",
                    salary: 100000
                }
            });
            return employee.save().then(function () {
                return employee.works.then(function (works) {
                    assert.equal(works.companyName, "Google");
                    assert.equal(works.salary, 100000);
                });
            });
        });
    });

    it.context(function (it) {

        it.beforeEach(function () {
            return comb.serial([
                hitch(Employee, "remove"),
                hitch(Works, "remove"),
                function () {
                    return new Employee({
                        lastName: "last" + 1,
                        firstName: "first" + 1,
                        midInitial: "m",
                        gender: gender[1 % 2],
                        street: "Street " + 1,
                        city: "City " + 1,
                        works: {
                            companyName: "Google",
                            salary: 100000
                        }
                    }).save();
                }
            ]);
        });

        it.should("load associations when querying", function () {
            return Promise.all([Employee.one(), Works.one()])
                .then(function (res) {
                    var emp = res[0], work = res[1];
                    var empWorks = emp.works, worksEmp = work.employee;
                    assert.isPromiseLike(empWorks);
                    assert.isPromiseLike(worksEmp);
                    return Promise.all([empWorks, worksEmp])
                        .then(function (res) {
                            assert.instanceOf(res[1], Employee);
                            assert.instanceOf(res[0], Works);
                        });
                });
        });

        it.should("allow the removing of associations", function () {
            return Employee.one().then(function (emp) {
                emp.works = null;
                return emp.save().then(function (emp) {
                    return emp.works.then(function (works) {
                        assert.isNull(works);
                        return Works.one().then(function (works) {
                            assert.isNotNull(works);
                            return works.employee.then(function () {
                                assert.isNotNull(works.employee);
                            });
                        });
                    });
                });
            });
        });

        it.should("apply the filter", function () {
            return Employee.one().then(function (emp) {
                return emp.works.then(function (works) {
                    return works.save({salary: 10}).then(function () {
                        return emp.reload().then(function () {
                            return emp.works.then(function (works) {
                                assert.isNull(works);
                            });
                        });
                    });
                });
            });
        });

    });

    it.context(function () {
        it.beforeEach(function () {
            return Promise.all([Works.remove(), Employee.remove()]);
        });

        it.should("allow the setting of associations", function () {
            var emp = new Employee({
                lastName: "last" + 1,
                firstName: "first" + 1,
                midInitial: "m",
                gender: gender[1 % 2],
                street: "Street " + 1,
                city: "City " + 1
            });
            return emp.save().then(function () {
                return emp.works.then(function (works) {
                    assert.isNull(works);
                    emp.works = {
                        companyName: "Google",
                        salary: 100000
                    };
                    return emp.save().then(function () {
                        return emp.works.then(function (works) {
                            assert.instanceOf(works, Works);
                        });
                    });
                });
            });
        });

        it.should("not delete association when deleting the reciprocal side", function () {
            var e = new Employee({
                lastName: "last" + 1,
                firstName: "first" + 1,
                midInitial: "m",
                gender: gender[1 % 2],
                street: "Street " + 1,
                city: "City " + 1,
                works: {
                    companyName: "Google",
                    salary: 100000
                }
            });
            return e.save().then(function () {
                return e.remove().then(function () {
                    return Promise.all([Employee.all(), Works.all()])
                        .then(function (res) {
                            assert.lengthOf(res[0], 0);
                            assert.lengthOf(res[1], 1);
                        });
                });
            });
        });

    });

    it.afterAll(function () {
        return helper.dropModels();
    });
});