"use strict";

var it = require('it'),
    assert = require('assert'),
    comb = require("comb"),
    patio = require("index");

var patioMigrationVersion = -1, patioMigrationFiles = [];

function getFileVersion(file) {
    return parseInt(file.split(".")[0], 10);
}

function sortMigrationFiles() {
    return patioMigrationFiles.sort(function (f1, f2) {
        return getFileVersion(f1) - getFileVersion(f2);
    });
}


it.describe("Migrators", function (it) {

    var DB, MockDB, MockDS;
    it.beforeAll(function () {
        MockDS = patio.Dataset.extend({
            instance: {

                fetchRows: function () {
                    return comb.async.array([
                        {version: patioMigrationVersion}
                    ]);
                },

                insert: function (values) {
                    var from = this.__opts.from[0];
                    if (from.toString() === "schema_info") {
                        patioMigrationVersion = values[Object.keys(values)[0]];
                    }
                    return Promise.resolve(0);
                },

                update: function (values) {
                    var from = this.__opts.from[0];
                    if (from.toString() === "schema_info") {
                        patioMigrationVersion = values[Object.keys(values)[0]];
                    }
                    return Promise.resolve(1);
                },

                count: function () {
                    return Promise.resolve(1);
                },

                getters: {
                    columns: function () {
                        return Promise.resolve(this.db.columnsCreated);
                    }
                }
            }
        });

        MockDB = patio.Database.extend({

            instance: {

                constructor: function () {
                    this._super(arguments);
                    this.type = this._static.type;
                    this.quoteIdentifiers = false;
                    this.identifierInputMethod = null;
                    this.identifierOutputMethod = null;
                    this.connectionExecuteMethod = "query";
                    this.sqls = [];
                    this.tables = {};
                    this.alteredTables = {};
                    this.closedCount = 0;
                    this.createdCount = 0;
                    this.columnsCreated = [];
                    this.columnsAltered = {};
                    this.droppedTables = [];
                },

                createConnection: function () {
                    this.createdCount++;
                    return {
                        query: function (sql) {
                            DB.sqls.push(sql);
                            return Promise.resolve(sql);
                        }
                    };
                },

                closeConnection: function () {
                    this.closedCount++;
                    return Promise.resolve();
                },

                validate: function () {
                    return Promise.resolve(true);
                },

                execute: function (sql) {
                    this.sqls.push(sql);
                    return Promise.resolve();
                },

                createTable: function (name) {
                    this.tables[name] = true;
                    return this._super(arguments).then(function () {
                        var match = this.sqls[this.sqls.length - 1].match(/ \(?(\w+) integer.*\)?$/);
                        if (match != null) {
                            this.columnsCreated.push(match[1]);
                        }
                    }.bind(this));
                },

                dropTable: function () {
                    comb.argsToArray(arguments).forEach(function (name) {
                        this.droppedTables.push(name);
                        this.tables[name] = null;
                    }, this);
                    return Promise.resolve();
                },

                tableExists: function (name) {
                    return Promise.resolve(!comb.isUndefinedOrNull(this.tables[name]));
                },

                alterTable: function (name) {
                    this.alteredTables[name] = true;
                    var promise = this._super(arguments);
                    return promise.then(function () {
                        this.columnsCreated = [];
                        this.columnsAltered = {};
                        this.sqls.forEach(function (sql) {
                            var match = sql.match(/ \(?(\w+) integer.*\)?$/);
                            var alterMatch = sql.match(/(\w+) TO (\w+)$/);
                            if (match != null) {
                                this.columnsCreated.push(match[1]);
                            }
                            if (alterMatch != null) {
                                this.columnsAltered[alterMatch[1]] = alterMatch[2];
                            }
                        }, this);
                        return 1;
                    }.bind(this));
                },


                reset: function () {
                    this.sqls = [];
                    this.columnsCreated = [];
                    this.droppedTables = [];
                    this.columnsAltered = {};
                    this.tables = {};
                    this.alteredTables = {};
                    patioMigrationVersion = -1;
                    patioMigrationFiles = [];
                },

                getters: {
                    dataset: function () {
                        return new MockDS(this);
                    }
                }
            }

        });

        DB = new MockDB();
    });

    it.describe("Integer Migrator", function (it) {

        it.beforeEach(function () {
            DB.reset();
        });

        it.should("raise and error if there is a missing integer migration version", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/missing_migration_file").then(assert.fail, function (err) {
                assert.deepEqual(err.message, "Migration error : Missing migration for 1");
            });
        });

        it.should("raise and error if there is a duplicate integer migration version", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/duplicate_migration_file").then(assert.fail, function (err) {
                assert.deepEqual(err.message, "Migration error : Duplicate migration number 0");
            });
        });

        it.should("add a column name if it doesn't already exist in the schemaInfo table", function () {
            return DB.createTable("schema_info", function () {
            }).then(function () {
                return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration").then(function () {
                    assert.isTrue(DB.alteredTables["schema_info"]);
                    assert.isTrue(DB.columnsCreated.indexOf("version") !== -1);
                });
            });
        });

        it.should("add a create a schemaInfoTable if it doesn't already exist", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration").then(function () {
                assert.isTrue(DB.tables["schema_info"]);
                assert.isTrue(DB.columnsCreated.indexOf("version") !== -1);
            });
        });


        it.should("add a allow one to specify the schema and column", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration", {
                table: "migration_info",
                column: "mi"
            }).then(function () {
                assert.isTrue(DB.tables["migration_info"]);
                assert.isTrue(DB.columnsCreated.indexOf("mi") !== -1);
            });
        });

        it.should("apply a migration correctly if no target is given", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration").then(function () {
                assert.isTrue(DB.tables.test1);
                assert.isTrue(DB.tables.test2);
                assert.isTrue(DB.tables.test3);
                assert.isTrue(DB.tables.test4);
                assert.isTrue(DB.alteredTables.test1);
                assert.isTrue(DB.alteredTables.test2);
                assert.isTrue(DB.alteredTables.test3);
                assert.isTrue(DB.alteredTables.test4);
                assert.deepEqual(DB.columnsAltered, {
                    column1: "column2",
                    column2: "column3",
                    column3: "column4",
                    column4: "column5"
                });
            });
        });

        it.should("apply a migration correctly in the up direction if a target is given", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration", {target: 2}).then(function () {
                assert.isTrue(DB.tables.test1);
                assert.isTrue(DB.tables.test2);
                assert.isTrue(DB.tables.test3);
                assert.isTrue(comb.isEmpty(DB.alteredTables));
                assert.isTrue(comb.isEmpty(DB.columnsAltered));
                assert.equal(patioMigrationVersion, 2);
            });
        });

        it.should("apply a migration correctly in the down direction if a target is given", function () {
            return DB.createTable("schema_info", function () {
                this.version("integer", {"default": 0});
            }).then(function () {
                return DB.from("schema_info").update({version: 3}).then(function () {
                    return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration", {target: -1}).then(function () {
                        assert.deepEqual(DB.droppedTables, ["test4", "test3", "test2", "test1"]);
                        assert.equal(patioMigrationVersion, -1);
                        assert.isTrue(comb.isEmpty(DB.alteredTables));
                        assert.isTrue(comb.isEmpty(DB.columnsAltered));
                    });
                });
            });
        });

        it.should("apply a migration correctly in the down direction if a target and current is given", function () {
            return DB.createTable("schema_info", function () {
                this.version("integer", {"default": 0});
            }).then(function () {
                return DB.from("schema_info").update({version: 3}).then(function () {
                    return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration", {
                        target: -1,
                        current: 4
                    }).then(function () {
                        assert.deepEqual(DB.droppedTables, ["test4", "test3", "test2", "test1"]);
                        assert.equal(patioMigrationVersion, -1);
                        assert.isTrue(DB.alteredTables.test1);
                        assert.isTrue(DB.alteredTables.test2);
                        assert.isTrue(DB.alteredTables.test3);
                        assert.isTrue(DB.alteredTables.test4);
                        assert.deepEqual(DB.columnsAltered, {
                            column2: "column1",
                            column3: "column2",
                            column4: "column3",
                            column5: "column4"
                        });
                    });
                });
            });
        });
        it.should("apply return the correct target number", function () {
            return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration", {target: 4, current: 2})
                .then(function (val) {
                    assert.equal(val, 4);
                    return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration", {target: -1});
                })
                .then(function (val) {
                    assert.equal(val, 0);
                    return patio.migrate(DB, __dirname + "/migrations/files/basic_integer_migration");
                })
                .then(function (val) {
                    assert.equal(val, 4);
                });
        });
    });


    it.describe("Timestamp migrator", function (it) {

        var MockTimestampDB, MockTimestampDs, TSDB;
        it.beforeAll(function () {
            MockTimestampDs = comb.define(MockDS, {
                instance: {

                    fetchRows: function () {
                        var from = this.__opts.from[0], ret = Promise.resolve();

                        if (from.toString() === "schema_info") {
                            ret = comb.async.array([{version: patioMigrationVersion}]);
                        } else if (from.toString() === "schema_migrations") {
                            sortMigrationFiles();
                            ret = comb.async.array(patioMigrationFiles.map(function (f) {
                                return {filename: f};
                            }));
                        } else if (from.toString() === "sm") {
                            ret = comb.async.array(patioMigrationFiles.map(function (f) {
                                return {fn: f};
                            }));
                        }
                        return ret;
                    },

                    insert: function (values) {
                        var from = this.__opts.from[0].toString();
                        if (from === "schema_info") {
                            patioMigrationVersion = values[Object.keys(values)[0]];
                        } else if (from === "schema_migrations" || from === "sm") {
                            patioMigrationFiles.push(values[Object.keys(values)[0]]);
                        }
                        return Promise.resolve(0);
                    },

                    remove: function () {
                        var from = this.__opts.from[0].toString();
                        if (from === "schema_migrations" || from === "sm") {
                            var where = this.__opts.where.args, index = patioMigrationFiles.indexOf(where[where.length - 1]);
                            if (index > -1) {
                                patioMigrationFiles.splice(index, 1);
                            }
                        }
                        return Promise.resolve(1);
                    },

                    getters: {
                        columns: function () {
                            var from = this.__opts.from[0].toString();

                            return new Promise(function (resolve, reject) {
                                if (from === "schema_info") {
                                    resolve(["version"]);
                                } else if (from === "schema_migrations") {
                                    resolve(["filename"]);
                                } else if (from === "sm") {
                                    resolve(["fn"]);
                                }
                            });
                        }
                    }
                }
            });
            MockTimestampDB = comb.define(MockDB, {
                instance: {
                    getters: {
                        dataset: function () {
                            return new MockTimestampDs(this);
                        }
                    }
                }
            });

            TSDB = new MockTimestampDB();
        });

        it.beforeEach(function () {
            TSDB.reset();
        });


        it.should("migrate all the way up", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration").then(function () {
                assert.isTrue(TSDB.tables.test1);
                assert.isTrue(TSDB.tables.test2);
                assert.isTrue(TSDB.tables.test3);
                assert.isTrue(TSDB.tables.test4);
                assert.deepEqual(TSDB.columnsCreated, ["column1", "column2", "column3", "column4"]);
                assert.lengthOf(patioMigrationFiles, 4);
                assert.deepEqual(patioMigrationFiles, ["1327997153.create_table.js", "1327997224.create_table.js", "1327997243.migration.js", "1327997262.migration.js"]);
            });
        });

        it.should("migrate all the way down", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration")
                .then(function () {
                    return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration", {target: -1});
                })
                .then(function () {
                    assert.isNull(TSDB.tables.test1);
                    assert.isNull(TSDB.tables.test2);
                    assert.isNull(TSDB.tables.test3);
                    assert.isNull(TSDB.tables.test4);
                    assert.deepEqual(TSDB.droppedTables, ["test4", "test3", "test2", "test1"]);
                    assert.deepEqual(TSDB.columnsCreated, ["column1", "column2", "column3", "column4"]);
                    assert.lengthOf(patioMigrationFiles, 0);
                });
        });

        it.should("migrate all the way up to a timestamp", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration", {target: 1327997243}).then(function () {
                assert.isTrue(TSDB.tables.test1);
                assert.isTrue(TSDB.tables.test2);
                assert.isTrue(TSDB.tables.test3);
                assert.deepEqual(TSDB.columnsCreated, ["column1", "column2", "column3"]);
                assert.lengthOf(patioMigrationFiles, 3);
                assert.deepEqual(patioMigrationFiles, ["1327997153.create_table.js", "1327997224.create_table.js", "1327997243.migration.js"]);
            });
        });

        it.should("migrate all the way down to a timestamp", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration", {target: 1327997243})
                .then(function () {
                    return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration", {target: -1});
                })
                .then(function () {
                    assert.isNull(TSDB.tables.test1);
                    assert.isNull(TSDB.tables.test2);
                    assert.isNull(TSDB.tables.test3);
                    assert.deepEqual(TSDB.droppedTables, ["test3", "test2", "test1"]);
                    assert.lengthOf(patioMigrationFiles, 0);
                });
        });

        it.should("apply missing migration files", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration").then(function () {
                return patio.migrate(TSDB, __dirname + "/migrations/files/interleaved_timestamp_migrations");
            })
                .then(function () {
                    assert.isTrue(TSDB.tables.test1);
                    assert.isTrue(TSDB.tables.test2);
                    assert.isTrue(TSDB.tables.test3);
                    assert.lengthOf(TSDB.droppedTables, 0);
                    assert.isTrue(TSDB.alteredTables.test1);
                    assert.isTrue(TSDB.alteredTables.test2);
                    assert.isTrue(TSDB.alteredTables.test3);
                    assert.isTrue(TSDB.alteredTables.test4);
                    assert.deepEqual(TSDB.columnsAltered, {
                        column1: "column2",
                        column2: "column3",
                        column3: "column4",
                        column4: "column5"
                    });
                    assert.lengthOf(patioMigrationFiles, 8);
                    assert.deepEqual(patioMigrationFiles, [
                        '1327997153.create_table.js',
                        '1327997224.create_table.js',
                        '1327997243.migration.js',
                        '1327997262.migration.js',
                        '1327997155.create_table.js',
                        '1327997230.create_table.js',
                        '1327997250.migration.js',
                        '1327997265.migration.js'
                    ]);
                });
        });

        it.should("not apply down action when up has not been called", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration").then(function () {
                assert.isTrue(TSDB.tables.test1);
                assert.isTrue(TSDB.tables.test2);
                assert.isTrue(TSDB.tables.test3);
                assert.deepEqual(TSDB.columnsCreated, ["column1", "column2", "column3", "column4"]);
                assert.lengthOf(patioMigrationFiles, 4);
                assert.deepEqual(patioMigrationFiles, ["1327997153.create_table.js", "1327997224.create_table.js", "1327997243.migration.js", '1327997262.migration.js']);
                return patio.migrate(TSDB, __dirname + "/migrations/files/interleaved_timestamp_migrations", {target: -1}).then(function () {
                    assert.lengthOf(TSDB.droppedTables, 4);
                    assert.deepEqual(TSDB.droppedTables, ["test4", "test3", "test2", "test1"]);
                    assert.isTrue(comb.isEmpty(TSDB.alteredTables));
                    assert.deepEqual(TSDB.columnsAltered, {});
                    assert.lengthOf(patioMigrationFiles, 0);
                });
            });
        });

        it.should("apply missing files up to a certian timestamp", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/timestamp_migration").then(function () {
                return patio.migrate(TSDB, __dirname + "/migrations/files/interleaved_timestamp_migrations", {target: 1327997262}).then(function () {
                    assert.isTrue(TSDB.tables.test1);
                    assert.isTrue(TSDB.tables.test2);
                    assert.isTrue(TSDB.tables.test3);
                    assert.lengthOf(TSDB.droppedTables, 0);
                    assert.isTrue(TSDB.alteredTables.test1);
                    assert.isTrue(TSDB.alteredTables.test2);
                    assert.isTrue(TSDB.alteredTables.test3);
                    assert.isUndefined(TSDB.alteredTables.test4);
                    assert.deepEqual(TSDB.columnsAltered, {
                        column1: "column2",
                        column2: "column3",
                        column3: "column4"
                    });
                    assert.lengthOf(patioMigrationFiles, 7);
                    sortMigrationFiles();
                    assert.deepEqual(patioMigrationFiles, [
                        '1327997153.create_table.js',
                        '1327997155.create_table.js',
                        '1327997224.create_table.js',
                        '1327997230.create_table.js',
                        '1327997243.migration.js',
                        '1327997250.migration.js',
                        '1327997262.migration.js'
                    ]);
                });
            });
        });

        it.should("handle bad migrations", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/bad_timestamp_migration").then(assert.fail, function () {
                assert.isTrue(TSDB.tables.test1);
                assert.isTrue(TSDB.tables.test2);
                assert.isTrue(TSDB.tables.test3);
                assert.deepEqual(TSDB.columnsCreated, ["column1", "column2", "column3"]);
                assert.lengthOf(patioMigrationFiles, 3);
                sortMigrationFiles();
                assert.deepEqual(patioMigrationFiles, ['1327997153.create_table.js', '1327997224.create_table.js', '1327997243.migration.js']);
                return patio.migrate(TSDB, __dirname + "/migrations/files/bad_timestamp_migration", {target: -1}).then(assert.fail, function () {
                    assert.isTrue(TSDB.tables.test1);
                    assert.isNull(TSDB.tables.test2);
                    assert.isNull(TSDB.tables.test3);
                    assert.lengthOf(patioMigrationFiles, 1);
                    sortMigrationFiles();
                    assert.deepEqual(patioMigrationFiles, ['1327997153.create_table.js']);
                });
            });
        });

        it.should("handle duplicate timestamps", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/duplicate_timestamp_migration").then(function () {
                assert.isTrue(TSDB.tables.test1);
                assert.isTrue(TSDB.tables.test2);
                assert.isTrue(TSDB.tables.test3);
                assert.isTrue(TSDB.tables.test4);
                assert.isTrue(TSDB.tables.test5);
                assert.deepEqual(TSDB.columnsCreated, ["column1", "column5", "column2", "column3", "column4"]);
                assert.lengthOf(patioMigrationFiles, 5);
                sortMigrationFiles();
                assert.deepEqual(patioMigrationFiles, [
                    '1327997153.create_table.js',
                    '1327997153.migration.js',
                    '1327997224.create_table.js',
                    '1327997243.migration.js',
                    '1327997262.migration.js'
                ]);
                return patio.migrate(TSDB, __dirname + "/migrations/files/duplicate_timestamp_migration", {target: -1}).then(function () {
                    assert.isNull(TSDB.tables.test1);
                    assert.isNull(TSDB.tables.test2);
                    assert.isNull(TSDB.tables.test3);
                    assert.isNull(TSDB.tables.test4);
                    assert.isNull(TSDB.tables.test5);
                    assert.lengthOf(patioMigrationFiles, 0);
                });
            });
        });

        it.should("convert integer migrations", function () {
            return patio.migrate(TSDB, __dirname + "/migrations/files/basic_integer_migration").then(function () {
                return patio.migrate(TSDB, __dirname + "/migrations/files/both_migration").then(function () {
                    assert.isTrue(TSDB.tables.test1);
                    assert.isTrue(TSDB.tables.test2);
                    assert.isTrue(TSDB.tables.test3);
                    assert.isTrue(TSDB.tables.test4);
                    assert.isTrue(TSDB.tables.test5);
                    assert.deepEqual(TSDB.columnsCreated, ["version", "column1", "column2", "column3", "column4", "column5"]);
                    assert.deepEqual(TSDB.columnsAltered, {
                        column1: "column2",
                        column2: "column3",
                        column3: "column4",
                        column4: "column5",
                        column5: "column6"
                    });
                    assert.lengthOf(patioMigrationFiles, 7);
                    sortMigrationFiles();
                    assert.deepEqual(patioMigrationFiles, [
                        '0.create_tables.js',
                        '1.create_2.js',
                        '2.create_table.js',
                        '3.create_3.js',
                        '4.alter_tables.js',
                        '1327997153.create_table.js',
                        '1327997224.create_table.js'
                    ]);
                    return patio.migrate(TSDB, __dirname + "/migrations/files/both_migration", {target: -1}).then(function () {
                        assert.isNull(TSDB.tables.test1);
                        assert.isNull(TSDB.tables.test2);
                        assert.isNull(TSDB.tables.test3);
                        assert.isNull(TSDB.tables.test4);
                        assert.isNull(TSDB.tables.test5);
                        assert.lengthOf(patioMigrationFiles, 0);
                    });
                });
            });
        });
    });

    it.afterAll(function () {
        return patio.disconnect();
    });

});