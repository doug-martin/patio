var patio = require("../../index"), comb = require("comb");
patio.camelize = true;

var DB = patio.createConnection("mysql://test:testpass@localhost:3306/sandbox");

patio.configureLogging();
var disconnectErr = function (err) {
    patio.logError(err);
    patio.disconnect();
};

var checkTables = function () {
    return Promise.all([DB.tableExists("class"), DB.tableExists("student"), DB.tableExists("classesStudents"), DB.from("schema_migrations").selectMap("filename")]).then(function (res) {
        console.log("The class table %s exist!", res[0] ? "does" : "does not");
        console.log("The student table %s exist!", res[1] ? "does" : "does not");
        console.log("the classes_students table %s exist!", res[2] ? "does" : "does not");
        if (res[3].length) {
            console.log("The following migrations are currently applied : \n\t%s ", res[3].join("\n\t"));
        } else {
            console.log("No migrations are currently applied");
        }
    });
}

var directory = __dirname + "/timestamp_migration";
patio.migrate(DB, directory)
    .chain(function () {
        console.log("Done migrating up");
        return checkTables()
    })
    .chain(function () {
        return patio.migrate(DB, directory, {target: 0});
    })
    .chain(function () {
        console.log("\nDone migrating down");
        return checkTables()
    })
    .chain(comb.hitch(patio, "disconnect"), disconnectErr);
