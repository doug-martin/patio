"use strict";
var it = require('it'),
    assert = require('assert'),
    helper = require("../../data/manyToMany.helper.js"),
    patio = require("index");

var gender = ["M", "F"];


it.describe("Many to Many camelize properties", function (it) {


    var Company, Employee;
    it.beforeAll(function () {
        Company = patio.addModel("company").manyToMany("employees", {fetchType: patio.fetchTypes.EAGER})
        Employee = patio.addModel("employee").manyToMany("companies", {fetchType: patio.fetchTypes.EAGER})
        return helper.createSchemaAndSync(true);
    });


    it.should("have associations", function () {
        assert.deepEqual(Employee.associations, ["companies"]);
        assert.deepEqual(Company.associations, ["employees"]);
        var emp = new Employee();
        var company = new Company();
        assert.deepEqual(emp.associations, ["companies"]);
        assert.deepEqual(company.associations, ["employees"]);
    });


    it.describe("creating a model with associations", function (it) {

        it.should("it should save the associations", function () {
            var c1 = new Company({
                companyName: "Google",
                employees: [
                    {
                        lastName: "last" + 1,
                        firstName: "first" + 1,
                        midInitial: "m",
                        gender: gender[1 % 2],
                        street: "Street " + 1,
                        city: "City " + 1
                    },
                    {
                        lastName: "last" + 2,
                        firstName: "first" + 2,
                        midInitial: "m",
                        gender: gender[2 % 2],
                        street: "Street " + 2,
                        city: "City " + 2
                    }
                ]
            });
            return c1.save().then(function () {
                var emps = c1.employees;
                assert.lengthOf(emps, 2);
            });
        });

        it.should("have child associations when queried", function () {
            return Company.one().then(function (company) {
                var emps = company.employees;
                assert.lengthOf(emps, 2);
                var ids = [1, 2];
                emps.forEach(function (emp, i) {
                    assert.equal(ids[i], emp.id);
                });
            });
        });

        it.should("the child associations should also be associated to the parent ", function () {
            return Employee.all().then(function (emps) {
                assert.lengthOf(emps, 2);
                emps.forEach(function (emp) {
                    assert.lengthOf(emp.companies, 1);
                    emp.companies.forEach(function (company) {
                        assert.equal(company.companyName, "Google");
                    });
                });
            });
        });
    });

    it.describe("access children immediately after save operation", function (it) {
        it.beforeAll(function () {
            return Promise.all([
                Company.remove(),
                Employee.remove()
            ]);
        });

        it.should("never return a promise for fetchType eager, parent null", function () {
            var c1 = new Company({
                companyName: "Bubu Inc."
            });

            return c1.save().then(function () {
                assert.isFalse(c1.employees instanceof Promise);
                assert.lengthOf(c1.employees, 0);
            });
        });

    });


    it.describe("add methods", function (it) {

        it.beforeEach(function () {
            return Company.remove().then(function () {
                return new Company({companyName: "Google"}).save();
            });
        });

        it.should("have an add method", function () {
            return Company.one().then(function (company) {
                var emp = new Employee({
                    lastName: "last",
                    firstName: "first",
                    midInitial: "m",
                    gender: gender[0],
                    street: "Street",
                    city: "City"
                });
                return company.addEmployee(emp).then(function () {
                    assert.lengthOf(company.employees, 1);
                });
            });
        });
        it.should("have a add multiple method", function () {
            var employees = [];
            for (var i = 0; i < 3; i++) {
                employees.push({
                    lastName: "last" + i,
                    firstName: "first" + i,
                    midInitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: "City " + i
                });
            }
            return Company.one().then(function (company) {
                return company.addEmployees(employees).then(function () {
                    var emps = company.employees;
                    assert.lengthOf(emps, 3);
                    emps.forEach(function (emp) {
                        assert.instanceOf(emp, Employee);
                    });
                });
            });
        });

    });

    it.describe("remove methods", function (it) {
        var employees = [];
        for (var i = 0; i < 3; i++) {
            employees.push({
                lastName: "last" + i,
                firstName: "first" + i,
                midInitial: "m",
                gender: gender[i % 2],
                street: "Street " + i,
                city: "City " + i
            });
        }
        it.beforeEach(function () {
            return Promise.all([Company.remove(), Employee.remove()]).then(function () {
                return new Company({companyName: "Google", employees: employees}).save();
            });
        });

        it.should("the removing of associations and deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeEmployee(company.employees[0], true)
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (ret) {
                        var emps = company.employees;
                        assert.lengthOf(emps, 2);
                        assert.equal(ret, 2);
                    });
            });

        });

        it.should("allow the removing of associations without deleting", function () {
            return Company.one().then(function (company) {
                return company.removeEmployee(company.employees[0])
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (ret) {
                        var emps = company.employees;
                        assert.lengthOf(emps, 2);
                        assert.equal(ret, 3);
                    });
            });
        });

        it.should("allow the removal of multiple associations and deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeEmployees(company.employees, true)
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (ret) {
                        var emps = company.employees;
                        assert.lengthOf(emps, 0);
                        assert.equal(ret, 0);
                    });
            });
        });

        it.should("allow the removal of multiple associations and not deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeEmployees(company.employees)
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (ret) {
                        var emps = company.employees;
                        assert.lengthOf(emps, 0);
                        assert.equal(ret, 3);
                    });
            });
        });

        it.should("allow the removal of all associations and deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeAllEmployees(true)
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (ret) {
                        var emps = company.employees;
                        assert.lengthOf(emps, 0);
                        assert.equal(ret, 0);
                    });
            });
        });

        it.should("allow the removal of all associations and not deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeAllEmployees()
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (ret) {
                        var emps = company.employees;
                        assert.lengthOf(emps, 0);
                        assert.equal(ret, 3);
                    });
            });
        });
    });

    it.should("should not delete associations when deleting", function () {
        return Company.one().then(function (company) {
            return company.remove()
                .then(function () {
                    return Employee.count();
                })
                .then(function (ret) {
                    assert.equal(ret, 3);
                });
        });
    });


    it.afterAll(function () {
        return helper.dropModels();
    });

});