var it = require('it'),
    assert = require('assert'),
    helper = require("../../data/manyToMany.helper.js"),
    patio = require("../../../lib"),
    sql = patio.sql,
    comb = require("comb-proxy"),
    hitch = comb.hitch;


var gender = ["M", "F"];
var cities = ["Omaha", "Lincoln", "Kearney"];

it.describe("Many to Many lazy with filter", function (it) {


    var Company, Employee;
    it.beforeAll(function () {
        Company = patio.addModel("company", {
            "static": {
                init: function () {
                    this._super(arguments);
                    this.manyToMany("buyers", {model: "company", joinTable: "buyerVendor", key: {vendorId: "buyerId"}});
                    this.manyToMany("vendors", {model: "company", joinTable: "buyerVendor", key: {buyerId: "vendorId"}});

                    this.manyToMany("employees");
                    this.manyToMany("omahaEmployees", {model: "employee"}, function (ds) {
                        return ds.filter(sql.identifier("city").ilike("omaha"));
                    });
                    this.manyToMany("lincolnEmployees", {model: "employee"}, function (ds) {
                        return ds.filter(sql.identifier("city").ilike("lincoln"));
                    });
                }
            }
        });
        Employee = patio.addModel("employee", {
            "static": {
                init: function () {
                    this._super(arguments);
                    this.manyToMany("companies");
                }
            }
        });
        return helper.createSchemaAndSync();
    });


    it.should("have associations", function () {
        assert.deepEqual(Employee.associations, ["companies"]);
        assert.deepEqual(Company.associations, ["buyers", "vendors", "employees", "omahaEmployees", "lincolnEmployees"]);
        var emp = new Employee();
        var company = new Company();
        assert.deepEqual(emp.associations, ["companies"]);
        assert.deepEqual(company.associations, ["buyers", "vendors", "employees", "omahaEmployees", "lincolnEmployees"]);
    });


    it.describe("creating a model with associations", function (it) {

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
            return c1.save().chain(function () {
                return comb.executeInOrder(Company,
                    function (Company) {
                        var company = Company.one();
                        return {
                            employees: company.employees,
                            omahaEmployees: company.omahaEmployees,
                            lincolnEmployees: company.lincolnEmployees
                        };
                    }).chain(function (ret) {
                        var emps = ret.employees;
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
            return Company.one().chain(function (company) {
                return company.employees.chain(function (emps) {
                    assert.lengthOf(emps, 3);
                });
            });
        });

        it.should("the child associations should also be associated to the parent ", function () {
            return comb.executeInOrder(assert, Employee,function (assert, Employee) {
                var emps = Employee.all();
                assert.lengthOf(emps, 3);
                return {companies1: emps[0].companies, companies2: emps[1].companies};
            }).chain(function (ret) {
                    assert.isTrue(ret.companies1.every(function (c) {
                        return c.companyName === "Google";
                    }));
                    assert.isTrue(ret.companies2.every(function (c) {
                        return c.companyName === "Google";
                    }));
                });
        });

    });

    it.describe("add methods", function (it) {

        it.beforeEach(function () {
            return comb.executeInOrder(Company, function (Company) {
                Company.remove();
                new Company({companyName: "Google"}).save();
            });
        });

        it.should("have an add method for filtered datasets", function () {
            return Company.one().chain(function (company) {
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
                return comb.executeInOrder(company,function (company) {
                    company.addOmahaEmployee(omahaEmp);
                    company.addLincolnEmployee(lincolnEmp);
                    return {omahaEmployees: company.omahaEmployees, lincolnEmployees: company.lincolnEmployees};
                }).chain(function (ret) {
                        assert.lengthOf(ret.omahaEmployees, 1);
                        assert.lengthOf(ret.lincolnEmployees, 1);
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
            return comb.executeInOrder(Company,function (Company) {
                var company = Company.one();
                company.addOmahaEmployees(omahaEmployees);
                company.addLincolnEmployees(lincolnEmployees);
                return {omahaEmployees: company.omahaEmployees, lincolnEmployees: company.lincolnEmployees};
            }).chain(function (ret) {
                    assert.lengthOf(ret.omahaEmployees, 3);
                    assert.lengthOf(ret.lincolnEmployees, 3);
                });
        });

        it.should("filter many to many relationship to itself", function () {
            var vendors = [], buyers = [];
            for (var i = 0; i < 3; i++) {
                vendors.push({
                    companyName: "company" + i
                });
            }
            for (i = 3; i < 6; i++) {
                buyers.push({
                    companyName: "company" + i
                });
            }
            return comb.executeInOrder(Company,function (Company) {
                var company = Company.one();
                company.addBuyers(buyers);
                company.addVendors(vendors);
                return {vendors: company.vendorsDataset.filter({companyName: "company0"}).all(), buyers: company.buyers};
            }).chain(function (ret) {
                    return Company.findById(ret.vendors[0].id).chain(function (vendor) {
                        assert.lengthOf(ret.vendors, 1);
                        assert.equal(ret.vendors[0].companyName, vendor.companyName);
                        assert.lengthOf(ret.buyers, 3);
                    })
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
            return comb.executeInOrder(Company, Employee, function (Company, Employee) {
                Company.remove();
                Employee.remove();
                new Company({companyName: "Google", employees: employees}).save();
            });
        });

        it.should("the removing of filtered associations and deleting them", function () {
            return comb.executeInOrder(Company, Employee,function (Company, Employee) {
                var company = Company.one();
                var omahaEmps = company.omahaEmployees;
                var lincolnEmps = company.lincolnEmployees;
                company.removeOmahaEmployee(omahaEmps[0], true);
                company.removeLincolnEmployee(lincolnEmps[0], true);
                return {omahaEmployees: company.omahaEmployees, lincolnEmployees: company.lincolnEmployees, empCount: Employee.count()};
            }).chain(function (ret) {
                    var omahaEmps = ret.omahaEmployees, lincolnEmps = ret.lincolnEmployees;
                    assert.lengthOf(omahaEmps, 0);
                    assert.lengthOf(lincolnEmps, 0);
                    assert.equal(ret.empCount, 1);
                });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return comb.executeInOrder(Company, Employee,function (Company, Employee) {
                var company = Company.one();
                var omahaEmps = company.omahaEmployees;
                var lincolnEmps = company.lincolnEmployees;
                company.removeOmahaEmployee(omahaEmps[0]);
                company.removeLincolnEmployee(lincolnEmps[0]);
                return {omahaEmployees: company.omahaEmployees, lincolnEmployees: company.lincolnEmployees, empCount: Employee.count()};
            }).chain(function (ret) {
                    var omahaEmps = ret.omahaEmployees, lincolnEmps = ret.lincolnEmployees;
                    assert.lengthOf(omahaEmps, 0);
                    assert.lengthOf(lincolnEmps, 0);
                    assert.equal(ret.empCount, 3);
                });
        });

        it.should("the removing of filtered associations and deleting them", function () {
            return comb.executeInOrder(Company, Employee,function (Company, Employee) {
                var company = Company.one();
                var omahaEmps = company.omahaEmployees;
                var lincolnEmps = company.lincolnEmployees;
                company.removeOmahaEmployees(omahaEmps, true);
                company.removeLincolnEmployees(lincolnEmps, true);
                return {omahaEmployees: company.omahaEmployees, lincolnEmployees: company.lincolnEmployees, empCount: Employee.count()};
            }).chain(function (ret) {
                    var omahaEmps = ret.omahaEmployees, lincolnEmps = ret.lincolnEmployees;
                    assert.lengthOf(omahaEmps, 0);
                    assert.lengthOf(lincolnEmps, 0);
                    assert.equal(ret.empCount, 1);
                });
        });

        it.should("the removing of filtered associations without deleting them", function () {
            return comb.executeInOrder(Company, Employee,function (Company, Employee) {
                var company = Company.one();
                var omahaEmps = company.omahaEmployees;
                var lincolnEmps = company.lincolnEmployees;
                company.removeOmahaEmployees(omahaEmps);
                company.removeLincolnEmployees(lincolnEmps);
                return {omahaEmployees: company.omahaEmployees, lincolnEmployees: company.lincolnEmployees, empCount: Employee.count()};
            }).chain(function (ret) {
                    var omahaEmps = ret.omahaEmployees, lincolnEmps = ret.lincolnEmployees;
                    assert.lengthOf(omahaEmps, 0);
                    assert.lengthOf(lincolnEmps, 0);
                    assert.equal(ret.empCount, 3);
                });
        });
    });

    it.afterAll(function () {
        return helper.dropModels();
    });
});