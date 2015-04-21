"use strict";
var it = require('it'),
    assert = require('assert'),
    helper = require("../../data/manyToMany.helper.js"),
    patio = require("index"),
    sql = patio.sql;


var gender = ["M", "F"];
var cities = ["Omaha", "Lincoln", "Kearney"];


it.describe("Many to Many eager with filter", function (it) {

    var Company, Employee;
    it.beforeAll(function () {
        Company = patio.addModel("company")
            .manyToMany("employees", {fetchType: this.fetchType.EAGER})
            .manyToMany("omahaEmployees", {model: "employee", fetchType: this.fetchType.EAGER}, function (ds) {
                return ds.filter(sql.identifier("city").ilike("omaha"));
            })
            .manyToMany("lincolnEmployees", {model: "employee", fetchType: this.fetchType.EAGER}, function (ds) {
                return ds.filter(sql.identifier("city").ilike("lincoln"));
            });
        Employee = patio.addModel("employee").manyToMany("companies", {fetchType: this.fetchType.EAGER})
        return helper.createSchemaAndSync(true);
    });


    it.should("have associations", function () {
        assert.deepEqual(Employee.associations, ["companies"]);
        assert.deepEqual(Company.associations, ["employees", "omahaEmployees", "lincolnEmployees"]);
        var emp = new Employee();
        var company = new Company();
        assert.deepEqual(emp.associations, ["companies"]);
        assert.deepEqual(company.associations, ["employees", "omahaEmployees", "lincolnEmployees"]);
    });


    it.describe("creating a model with associations", function (it) {

        it.should("it should save the associations", function () {
            var employees = [];
            for (var i = 0; i < 3; i++) {
                employees.push({
                    lastName: "last" + i,
                    firstName: "first" + i,
                    midInitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: cities[i % 3]
                });
            }
            var c1 = new Company({
                companyName: "Google",
                employees: employees
            });
            return c1.save().chain(function () {
                return Company.one().chain(function (ret) {
                    assert.lengthOf(ret.employees, 3);
                    assert.lengthOf(ret.omahaEmployees, 1);
                    assert.isTrue(ret.omahaEmployees.every(function (emp) {
                        return emp.city.match(/omaha/i) !== null;
                    }));
                    assert.lengthOf(ret.lincolnEmployees, 1);
                    assert.isTrue(ret.lincolnEmployees.every(function (emp) {
                        return emp.city.match(/lincoln/i) !== null;
                    }));
                });
            });
        });

        it.should("have child associations when queried", function () {
            return Company.one().then(function (company) {
                assert.lengthOf(company.employees, 3);
            });
        });

        it.should("the child associations should also be associated to the parent ", function () {
            return Employee.all().then(function (emps) {
                emps.forEach(function (emp) {
                    assert.lengthOf(emp.companies, 1);
                    emp.companies.forEach(function (company) {
                        assert.equal(company.companyName, "Google");
                    });
                });
            });
        });

    });

    it.describe("add methods", function (it) {

        it.beforeEach(function () {
            return Company.remove().then(function () {
                new Company({companyName: "Google"}).save();
            });
        });

        it.should("have an add method for filtered datasets", function () {
            return Company.one().then(function (company) {
                var lincolnEmp = new Employee({
                    lastName: "last",
                    firstName: "first",
                    midInitial: "m",
                    gender: gender[0],
                    street: "Street",
                    city: "Lincoln"
                });
                var omahaEmp = new Employee({
                    lastName: "last",
                    firstName: "first",
                    midInitial: "m",
                    gender: gender[0],
                    street: "Street",
                    city: "Omaha"
                });
                return Promise.all([
                    company.addOmahaEmployee(omahaEmp),
                    company.addLincolnEmployee(lincolnEmp)
                ])
                    .then(function () {
                        assert.lengthOf(company.omahaEmployees, 1);
                        assert.lengthOf(company.lincolnEmployees, 1);
                    });
            });
        });

        it.should("have a add multiple method for filtered associations", function () {
            var omahaEmployees = [], lincolnEmployees = [];
            for (var i = 0; i < 3; i++) {
                omahaEmployees.push({
                    lastName: "last" + i,
                    firstName: "first" + i,
                    midInitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: "Omaha"
                });
            }
            for (i = 0; i < 3; i++) {
                lincolnEmployees.push({
                    lastName: "last" + i,
                    firstName: "first" + i,
                    midInitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: "Lincoln"
                });
            }
            return Company.one().then(function (company) {
                return Promise.all([
                    company.addOmahaEmployees(omahaEmployees),
                    company.addLincolnEmployees(lincolnEmployees)
                ]).then(function () {
                    assert.lengthOf(company.omahaEmployees, 3);
                    assert.lengthOf(company.lincolnEmployees, 3);
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
                city: cities[i % 3]
            });
        }
        it.beforeEach(function () {
            return Promise.all([
                Company.remove(),
                Employee.remove()
            ]).then(function () {
                return new Company({companyName: "Google", employees: employees}).save();
            });
        });

        it.should("the removing of filtered associations and deleting them", function () {
            return Company.one().then(function (company) {
                return Promise.all([
                    company.removeOmahaEmployee(company.omahaEmployees[0], true),
                    company.removeLincolnEmployee(company.lincolnEmployees[0], true),
                ])
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (count) {
                        assert.equal(count, 1);
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                    });
            });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return Company.one().then(function (company) {
                return Promise.all([
                    company.removeOmahaEmployee(company.omahaEmployees[0]),
                    company.removeLincolnEmployee(company.lincolnEmployees[0]),
                ])
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (count) {
                        assert.equal(count, 3);
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                    });
            });
        });

        it.should("the removing of filtered associations and deleting them", function () {
            return Company.one().then(function (company) {
                return Promise.all([
                    company.removeOmahaEmployees(company.omahaEmployees, true),
                    company.removeLincolnEmployees(company.lincolnEmployees, true),
                ])
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (count) {
                        assert.equal(count, 1);
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                    });
            });

        });

        it.should("the removing of filtered associations without deleting them", function () {
            return Company.one().then(function (company) {
                return Promise.all([
                    company.removeOmahaEmployees(company.omahaEmployees),
                    company.removeLincolnEmployees(company.lincolnEmployees),
                ])
                    .then(function () {
                        return Employee.count();
                    })
                    .then(function (count) {
                        assert.equal(count, 3);
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                    });
            });
        });
    });

    it.afterAll(function () {
        return helper.dropModels();
    });

});