"use strict";

var it = require('it'),
    assert = require('assert'),
    helper = require("../../data/manyToOne.helper.js"),
    patio = require("index"),
    sql = patio.sql,
    comb = require("comb-proxy");


var gender = ["M", "F"],
    cities = ["Omaha", "Lincoln", "Kearney"];


it.describe("Many to one eager with custom filter", function (it) {

    var Company, Employee;
    it.beforeAll(function () {
        Company = patio.addModel("company")
            .oneToMany("employees", {fetchType: patio.fetchTypes.EAGER})
            .oneToMany("omahaEmployees", {
                model: "employee",
                fetchType: patio.fetchTypes.EAGER
            }, function (ds) {
                return ds.filter(sql.identifier("city").ilike("omaha"));
            })
            .oneToMany("lincolnEmployees", {
                model: "employee",
                fetchType: patio.fetchTypes.EAGER
            }, function (ds) {
                return ds.filter(sql.identifier("city").ilike("lincoln"));
            });

        Employee = patio.addModel("employee").manyToOne("company", {fetchType: patio.fetchTypes.EAGER});
        return helper.createSchemaAndSync(true);
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
            return comb.when(
                Company.remove(),
                Employee.remove()
            );
        });

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
            return c1.save().then(function () {
                assert.lengthOf(c1.employees, 3);
                assert.lengthOf(c1.omahaEmployees, 1);
                assert.isTrue(c1.omahaEmployees.every(function (emp) {
                    return emp.city.match(/omaha/i) !== null;
                }));
                assert.lengthOf(c1.lincolnEmployees, 1);
                assert.isTrue(c1.lincolnEmployees.every(function (emp) {
                    return emp.city.match(/lincoln/i) !== null;
                }));
            });
        });

        it.should("have child associations when queried", function () {
            return Company.one().then(function (c1) {
                assert.lengthOf(c1.employees, 3);
                assert.lengthOf(c1.omahaEmployees, 1);
                assert.isTrue(c1.omahaEmployees.every(function (emp) {
                    return emp.city.match(/omaha/i) !== null;
                }));
                assert.lengthOf(c1.lincolnEmployees, 1);
                assert.isTrue(c1.lincolnEmployees.every(function (emp) {
                    return emp.city.match(/lincoln/i) !== null;
                }));
            });
        });

        it.should("the child associations should also be associated to the parent ", function () {
            return Employee.all().then(function (emps) {
                assert.lengthOf(emps, 3);
                assert.equal(emps[0].company.companyName, "Google");
                assert.equal(emps[0].company.companyName, "Google");
                assert.equal(emps[0].company.companyName, "Google");
            });
        });

    });

    it.describe("creating a model many to one association", function (it) {


        it.beforeAll(function () {
            return comb.when(
                Company.remove(),
                Employee.remove()
            );
        });

        it.should("it should save the associations", function () {
            var emp = new Employee({
                lastName: "last",
                firstName: "first",
                midInitial: "m",
                gender: "M",
                street: "Street",
                city: "Omaha",
                company: {
                    companyName: "Google"
                }
            });
            return emp.save().then(function () {
                //reload it here in order to get all the properties
                return emp.company.reload().then(function (company) {
                    assert.equal(company.companyName, "Google");
                    assert.lengthOf(company.employees, 1);
                    assert.lengthOf(company.omahaEmployees, 1);
                    assert.isTrue(company.omahaEmployees.every(function (emp) {
                        return emp.city.match(/omaha/i) !== null;
                    }));
                    assert.lengthOf(company.lincolnEmployees, 0);
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

                // @TODO: find better way to do this test
                var ret = {};
                return company.addOmahaEmployee(omahaEmp).then(function (omahaEmployees) {
                    ret.omahaEmployees = [omahaEmployees];
                    return company.addLincolnEmployee(lincolnEmp).then(function (lincolnEmployees) {
                        ret.lincolnEmployees = [lincolnEmployees];
                    }).then(function () {
                        assert.lengthOf(ret.omahaEmployees, 1);
                        assert.lengthOf(ret.lincolnEmployees, 1);
                    });
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
                return company.addOmahaEmployees(omahaEmployees).then(function (company) {
                    return company.addLincolnEmployees(lincolnEmployees).then(function (company) {
                        assert.lengthOf(company.omahaEmployees, 3);
                        assert.lengthOf(company.lincolnEmployees, 3);
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
                return company.removeOmahaEmployee(company.omahaEmployees[0], true).then(function () {
                    return company.removeLincolnEmployee(company.lincolnEmployees[0], true).then(function () {
                        return Employee.count().then(function (count) {
                            assert.lengthOf(company.omahaEmployees, 0);
                            assert.lengthOf(company.lincolnEmployees, 0);
                            assert.equal(count, 1);
                        });
                    });
                });
            });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeOmahaEmployee(company.omahaEmployees[0]).then(function () {
                    return company.removeLincolnEmployee(company.lincolnEmployees[0]).then(function () {
                        return Employee.count().then(function (count) {
                            assert.lengthOf(company.omahaEmployees, 0);
                            assert.lengthOf(company.lincolnEmployees, 0);
                            assert.equal(count, 3);
                        });
                    });
                });
            });
        });

        it.should("the removing of filtered associations and deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeOmahaEmployees(company.omahaEmployees, true).then(function () {
                    return company.removeLincolnEmployees(company.lincolnEmployees, true).then(function () {
                        return Employee.count().then(function (count) {
                            assert.lengthOf(company.omahaEmployees, 0);
                            assert.lengthOf(company.lincolnEmployees, 0);
                            assert.equal(count, 1);
                        });
                    });
                });
            });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return Company.one().then(function (company) {
                return company.removeOmahaEmployees(company.omahaEmployees).then(function () {
                    return company.removeLincolnEmployees(company.lincolnEmployees).then(function () {
                        return Employee.count().then(function(count) {
                            assert.lengthOf(company.omahaEmployees, 0);
                            assert.lengthOf(company.lincolnEmployees, 0);
                            assert.equal(count, 3);
                        });
                    });
                });

            });
        });
    });

    it.afterAll(function () {
        return helper.dropModels();
    });
});
