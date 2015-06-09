"use strict";

var it = require('it'),
    assert = require('assert'),
    helper = require("../../../data/manyToOne.helper.js"),
    patio = require("../../../../lib"),
    sql = patio.sql;

var gender = ["M", "F"],
    cities = ["Omaha", "Lincoln", "Kearney"];

it.describe("patio.Model manyToOne lazy with custom filter", function (it) {

    var Company, Employee;
    it.beforeAll(function () {
        Company = patio.addModel("company")
            .oneToMany("employees")
            .oneToMany("omahaEmployees", {model: "employee"}, function (ds) {
                return ds.filter(sql.identifier("city").ilike("omaha"));
            })
            .oneToMany("lincolnEmployees", {model: "employee"}, function (ds) {
                return ds.filter(sql.identifier("city").ilike("lincoln"));
            });
        Employee = patio.addModel("employee").manyToOne("company");

        return helper.createSchemaAndSync();
    });


    it.should("have associations", function () {
        assert.deepEqual(Employee.associations, ["company"]);
        assert.deepEqual(Company.associations, ["employees", "omahaEmployees", "lincolnEmployees"]);
        var emp = new Employee();
        var company = new Company();
        assert.deepEqual(emp.associations, ["company"]);
        assert.deepEqual(company.associations, ["employees", "omahaEmployees", "lincolnEmployees"]);
    });


    it.describe("creating a model one to many association", function (it) {


        it.beforeAll(function () {
            return Promise.all([
                Company.remove(),
                Employee.remove()
            ]);
        });

        it.should("it should save the associations", function () {
            var employees = [];
            for (var i = 0; i < 3; i++) {
                employees.push({
                    lastname: "last" + i,
                    firstname: "first" + i,
                    midinitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: cities[i % 3]
                });
            }
            var c1 = new Company({
                companyName: "Google",
                employees: employees
            });
            return c1.save().then(function () {
                return Company.one().then(function (company) {
                    Promise.all([
                        company.employees,
                        company.omahaEmployees,
                        company.lincolnEmployees
                    ]).then(function (ret) {
                        assert.lengthOf(ret[0], 3);
                        assert.lengthOf(ret[1], 1);
                        assert.isTrue(ret[1].every(function (emp) {
                            return emp.city.match(/omaha/i) !== null;
                        }));
                        assert.lengthOf(ret[2], 1);
                        assert.isTrue(ret[2].every(function (emp) {
                            return emp.city.match(/lincoln/i) !== null;
                        }));
                    });
                });

            });
        });

        it.should("have child associations when queried", function () {
            return Company.one().then(function (company) {
                return company.employees.then(function (emps) {
                    assert.lengthOf(emps, 3);
                });
            });
        });

        it.should("the child associations should also be associated to the parent ", function () {
            return Employee.all().then(function (emps) {
                assert.lengthOf(emps, 3);
                Promise.all([
                    emps[0].company,
                    emps[1].company
                ]).then(function (companies) {
                    assert.equal(companies[0].companyName, "Google");
                    assert.equal(companies[1].companyName, "Google");
                });
            });
        });
    });

    it.describe("creating a model many to one association", function (it) {


        it.beforeAll(function () {
            return Promise.all([
                Company.remove(),
                Employee.remove()
            ]);
        });

        it.should("it should save the associations", function () {
            var emp = new Employee({
                lastname: "last",
                firstname: "first",
                midinitial: "m",
                gender: "M",
                street: "Street",
                city: "Omaha",
                company: {
                    companyName: "Google"
                }
            });
            return emp.save().then(function () {
                return emp.company.then(function (company) {
                    assert.equal(company.companyName, "Google");
                    Promise.all([
                        company.employees,
                        company.omahaEmployees,
                        company.lincolnEmployees
                    ]).then(function (employees) {
                        assert.lengthOf(employees[0], 1);
                        assert.lengthOf(employees[1], 1);
                        assert.isTrue(employees[1].every(function (emp) {
                            return emp.city.match(/omaha/i) !== null;
                        }));
                        assert.lengthOf(employees[2], 0);
                    });
                });
            });
        });

    });

    it.describe("add methods", function (it) {

        it.beforeEach(function () {
            return Company.remove().then(function () {
                return new Company({companyName: "Google"}).save();
            });
        });

        it.should("have an add method for filtered datasets", function () {
            return Company.one().then(function (company) {
                var lincolnEmp = new Employee({
                    lastname: "last",
                    firstname: "first",
                    midInitial: "m",
                    gender: gender[0],
                    street: "Street",
                    city: "Lincoln"
                });
                var omahaEmp = new Employee({
                    lastname: "last",
                    firstname: "first",
                    midInitial: "m",
                    gender: gender[0],
                    street: "Street",
                    city: "Omaha"
                });

                return Promise.all([
                    company.addOmahaEmployee(omahaEmp),
                    company.addLincolnEmployee(lincolnEmp)
                ]).then(function () {
                    Promise.all([
                        company.omahaEmployees,
                        company.lincolnEmployees
                    ]).then(function (ret) {
                        assert.lengthOf(ret[0], 1);
                        assert.lengthOf(ret[1], 1);
                    });
                });
            });
        });

        it.should("have a add multiple method for filtered associations", function () {
            var omahaEmployees = [], lincolnEmployees = [];
            for (var i = 0; i < 3; i++) {
                omahaEmployees.push({
                    lastname: "last" + i,
                    firstname: "first" + i,
                    midInitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: "Omaha"
                });
            }
            for (i = 0; i < 3; i++) {
                lincolnEmployees.push({
                    lastname: "last" + i,
                    firstname: "first" + i,
                    midInitial: "m",
                    gender: gender[i % 2],
                    street: "Street " + i,
                    city: "Lincoln"
                });
            }
            return Company.one().then(function (company) {
                Promise.all([
                    company.addOmahaEmployees(omahaEmployees),
                    company.addLincolnEmployees(lincolnEmployees)
                ]).then(function () {
                    Promise.all([
                        company.omahaEmployees,
                        company.lincolnEmployees
                    ]).then(function (ret) {
                        assert.lengthOf(ret[0], 1);
                        assert.lengthOf(ret[1], 1);
                    });
                });
            });
        });
    });

    it.describe("remove methods", function (it) {
        var employees = [];
        for (var i = 0; i < 3; i++) {
            employees.push({
                lastname: "last" + i,
                firstname: "first" + i,
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
                Promise.all([
                    company.removeOmahaEmployee(company.omahaEmployees[0], true),
                    company.removeLincolnEmployee(company.lincolnEmployees[0], true)
                ]).then(function () {
                    return Employee.count().then(function (count) {
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                        assert.equal(count, 1);
                    });
                });
            });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return Company.one().then(function (company) {
                Promise.all([
                    company.removeOmahaEmployee(company.omahaEmployees[0]),
                    company.removeLincolnEmployee(company.lincolnEmployees[0])
                ]).then(function () {
                    return Employee.count().then(function (count) {
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                        assert.equal(count, 3);
                    });
                });
            });
        });

        it.should("the removing of filtered associations and deleting them", function () {
            return Company.one().then(function (company) {
                Promise.all([
                    company.removeOmahaEmployee(company.omahaEmployees, true),
                    company.removeLincolnEmployee(company.lincolnEmployees, true)
                ]).then(function () {
                    return Employee.count().then(function (count) {
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                        assert.equal(count, 1);
                    });
                });
            });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return Company.one().then(function (company) {
                Promise.all([
                    company.removeOmahaEmployee(company.omahaEmployees),
                    company.removeLincolnEmployee(company.lincolnEmployees)
                ]).then(function () {
                    return Employee.count().then(function (count) {
                        assert.lengthOf(company.omahaEmployees, 0);
                        assert.lengthOf(company.lincolnEmployees, 0);
                        assert.equal(count, 3);
                    });
                });
            });
        });
    });

    it.afterAll(function () {
        return helper.dropModels();
    });
});
