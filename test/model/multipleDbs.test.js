"use strict";

var it = require('it'),
    assert = require('assert'),
    patio = require("../../lib"),
    config = require("./../test.config.js"),
    comb = require("comb");

var DB1, DB2;
var createTablesAndSync = function () {
    return Promise.all([
        DB1.forceCreateTable("employee", function () {
            this.primaryKey("id");
            this.firstname("string", {length: 20, allowNull: false});
            this.lastname("string", {length: 20, allowNull: false});
            this.midinitial("char", {length: 1});
            this.position("integer");
            this.gender("char", {size: 1});
            this.street("string", {length: 50, allowNull: false});
            this.city("string", {length: 20, allowNull: false});
        }),
        DB2.forceCreateTable("employee", function () {
            this.primaryKey("id");
            this.firstname("string", {length: 20, allowNull: false});
            this.lastname("string", {length: 20, allowNull: false});
            this.midinitial("char", {length: 1});
            this.position("integer");
            this.gender("char", {size: 1});
            this.street("string", {length: 50, allowNull: false});
            this.city("string", {length: 20, allowNull: false});
        })
    ]).then(patio.syncModels);
};

var dropTableAndDisconnect = function () {
    return DB1.forceDropTable("employee")
        .then(function () {
            return DB2.forceDropTable("employee");
        })
        .then(function () {
            return patio.disconnect();
        })
        .then(function () {
            return patio.resetIdentifierMethods();
        });
};


it.describe("patio.Model from mutliple databases", function (it) {

    var Employee, Employee2, ds1, ds2;

    it.beforeAll(function () {
        DB1 = patio.connect(config.DB_URI + "/sandbox");
        DB2 = patio.connect(config.DB_URI + "/sandbox2");
        Employee = patio.addModel((ds1 = DB1.from("employee")), {
            "static": {
                //class methods
                findByGender: function (gender, callback, errback) {
                    return this.filter({gender: gender}).all();
                }
            }
        });
        Employee2 = patio.addModel((ds2 = DB2.from("employee")), {
            "static": {
                //class methods
                findByGender: function (gender, callback, errback) {
                    return this.filter({gender: gender}).all();
                }
            }
        });
        return createTablesAndSync();
    });

    var emp1, emp2;
    it.beforeEach(function () {

        emp1 = new Employee({
            firstname: "doug",
            lastname: "martin",
            position: 1,
            midinitial: null,
            gender: "M",
            street: "1 nowhere st.",
            city: "NOWHERE"
        });
        emp2 = new Employee2({
            firstname: "doug1",
            lastname: "martin1",
            position: 1,
            midinitial: null,
            gender: "F",
            street: "2 nowhere st.",
            city: "NOWHERE2"
        });
        return comb.serial([
            function () {
                return Promise.all([Employee.remove(), Employee2.remove()]);
            },
            function () {
                return Promise.all([emp1.save(), emp2.save()]);
            }]);
    });

    it.describe("patio", function (it) {
        it.should("retrive models by database", function () {
            // check for both methods of retrieving the model
            assert.strictEqual(patio.getModel(ds1), Employee);
            assert.strictEqual(patio.getModel(ds2), Employee2);
            assert.strictEqual(patio.getModel("employee", DB1), Employee);
            assert.strictEqual(patio.getModel("employee", DB2), Employee2);
        });
    });


    it.should("save models to respective databases", function () {
        assert.instanceOf(emp1, Employee);
        assert.equal("doug", emp1.firstname);
        assert.equal("martin", emp1.lastname);
        assert.isNull(emp1.midinitial);
        assert.equal("M", emp1.gender);
        assert.equal("1 nowhere st.", emp1.street);
        assert.equal("NOWHERE", emp1.city);

        assert.instanceOf(emp2, Employee2);
        assert.equal("doug1", emp2.firstname);
        assert.equal("martin1", emp2.lastname);
        assert.isNull(emp2.midinitial);
        assert.equal("F", emp2.gender);
        assert.equal("2 nowhere st.", emp2.street);
        assert.equal("NOWHERE2", emp2.city);

        return Promise.all([Employee.count(), Employee2.count()]).then(function (res) {
            assert.equal(res[0], 1);
            assert.equal(res[1], 1);
        });
    });

    it.should("retrieve models from respective database", function () {
        return Promise.all([Employee.all(), Employee2.all()]).then(function (res) {
            assert.lengthOf(res[0], 1);
            assert.lengthOf(res[1], 1);
        });
    });

    it.should("remove models from respective databases", function () {
        return Promise.all([Employee.all(), Employee2.all()])
            .then(function (res) {
                assert.lengthOf(res[0], 1);
                assert.lengthOf(res[1], 1);
                return Employee.remove();
            })
            .then(function () {
                return Promise.all([Employee.all(), Employee2.all()]);
            })
            .then(function (res) {
                assert.lengthOf(res[0], 0);
                assert.lengthOf(res[1], 1);
                return Employee2.remove();
            })
            .then(function () {
                return Promise.all([Employee.all(), Employee2.all()]);
            })
            .then(function (res) {
                assert.lengthOf(res[0], 0);
                assert.lengthOf(res[1], 0);
            });
    });

    it.afterAll(dropTableAndDisconnect);

});