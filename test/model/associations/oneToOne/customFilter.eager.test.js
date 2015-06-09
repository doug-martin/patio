"use strict";

var it = require('it'),
    assert = require('assert'),
    helper = require("../../../data/oneToOne.helper.js"),
    patio = require("../../../../lib"),
    comb = require("comb"),
    hitch = comb.hitch;

var gender = ["M", "F"];

it.describe("patio.Model oneToOne eager with custom filter", function (it) {
    var Works, Employee;
    it.beforeAll(function () {
        Works = patio.addModel("works").manyToOne("employee", {fetchType: patio.fetchTypes.EAGER});
        Employee = patio.addModel("employee").oneToOne("works", {fetchType: patio.fetchTypes.EAGER}, function (ds) {
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
            return Promise.all([
                Employee.remove(),
                Works.remove()
            ]);
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
                var works = employee.works;
                assert.equal(works.companyName, "Google");
                assert.equal(works.salary, 100000);
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
            return Promise.all([
                Employee.one(),
                Works.one()
            ]).then(function (res) {
                var empWorks = res[0].works,
                    worksEmp = res[1].employee;

                assert.instanceOf(worksEmp, Employee);
                assert.instanceOf(empWorks, Works);
            });
        });

        it.should("allow the removing of associations", function () {
            return Employee.one().then(function (emp) {
                emp.works = null;
                return emp.save().then(function (emp) {
                    assert.isNull(emp.works);
                    return Works.one().then(function (work) {
                        assert.isNotNull(work);
                        assert.isNull(work.employee);
                    });
                });
            });
        });

        it.should("apply the filter", function () {
            return Employee.one().then(function (emp) {
                return emp.works.save({salary: 10}).then(function () {
                    return emp.reload().then(function () {
                        assert.isNull(emp.works);
                    });
                });
            });
        });

    });

    it.context(function () {
        it.beforeEach(function () {
            return Promise.all([
                Works.remove(),
                Employee.remove()
            ]);
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
                assert.isNull(emp.works);
                emp.works = {
                    companyName: "Google",
                    salary: 100000
                };
                return emp.save().then(function () {
                    assert.instanceOf(emp.works, Works);
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