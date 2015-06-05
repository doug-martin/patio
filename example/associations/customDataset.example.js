"use strict";

var patio = require("../../index"),
    sql = patio.sql,
    comb = require("comb"),
    format = comb.string.format;

patio.camelize = true;

patio.configureLogging({"patio": {level: "ERROR"}});
var DB = patio.connect("mysql://test:testpass@localhost:3306/sandbox");

//define the BiologicalFather model
var BiologicalFather = patio.addModel("biologicalFather")
    .oneToMany("children")
    .oneToMany("letterBChildren", {
        model: "child",
        fetchType: patio.fetchTypes.EAGER,
        dataset: function () {
            return this.db.from("child").filter({name: {like: "B%"}, biologicalFatherId: this.id});
        }
    });


//define Child  model
var Child = patio.addModel("child").manyToOne("biologicalFather");

var errorHandler = function (err) {
    console.error(err.stack);
    patio.disconnect();
};

var createTables = function () {
    return comb.serial([
        function () {
            return DB.forceDropTable("child", "biologicalFather");
        },
        function () {
            return DB.createTable("biologicalFather", function () {
                this.primaryKey("id");
                this.name(String);
            });
        },
        function () {
            return DB.createTable("child", function () {
                this.primaryKey("id");
                this.name(String);
                this.foreignKey("biologicalFatherId", "biologicalFather", {key: "id"});
            });
        },
        function () {
            return patio.syncModels();
        }
    ]);
};

var createData = function () {
    //create some data
    return BiologicalFather.save([
        {
            name: "Fred", children: [
            {name: "Bobby"},
            {name: "Alice"},
            {name: "Susan"}
        ]
        },
        {name: "Ben"},
        {name: "Bob"},
        {
            name: "Scott", children: [
            {name: "Brad"}
        ]
        }
    ]);
};

createTables()
    .then(createData)
    .then(function () {
        return BiologicalFather.forEach(function (father) {
            //you use a promise now because this is not an
            //executeInOrderBlock
            if (father.letterBChildren.length > 0) {
                console.log(father.name + " has " + father.letterBChildren.length + " B children");
                console.log("The B letter children's names are " + father.letterBChildren.map(function (child) {
                        return child.name;
                    }));
            }
            return father.children.then(function (children) {
                console.log(father.name + " has " + children.length + " children");
                if (children.length) {
                    console.log("The children's names are " + children.map(function (child) {
                            return child.name;
                        }));
                }
            });
        });
    })
    .then(function () {
        return Child.findById(1).then(function (child) {
            return child.biologicalFather.then(function (father) {
                console.log(child.name + " father is " + father.name);
            });
        });
    })
    .then(comb.hitch(patio, "disconnect"), errorHandler);


