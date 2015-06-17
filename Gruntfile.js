"use strict";
/*global module:false*/
module.exports = function (grunt) {
    // Project configuration.

    var DEFAULT_COVERAGE_ARGS = ["cover", "-x", "Gruntfile.js", "--report", "none", "--print", "none", "--include-pid", "grunt", "--", "recreate_databases", "it"],
        path = require("path"),
        comb = require("comb");

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            src: ["./index.js", "lib/**/*.js", "Gruntfile.js"],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        exec: {
            sendToCoveralls: "cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js",
            removeCoverage: "rm -rf ./coverage",
            removeDocs: "rm -rf docs/*",
            createDocs: 'coddoc -f multi-html -d ./lib --dir ./docs'
        },

        it: {
            all: {
                src: 'test/**/*.test.js',
                options: {
                    timeout: 3000, // not fully supported yet
                    reporter: 'tap'
                }
            }
        }
    });

    grunt.registerTask("recreate_databases", "recreates test databases for tests", function () {
        var done = this.async();
        require("./test/test.config")
            .recreateDatabases()
            .then(function () {
                done();
            })
            .catch(function (err) {
                console.log(err.stack || err);
                done(false);
            });
    });

    grunt.registerTask("benchmarks", "runs benchmarks", function () {
        var done = this.async();
        require("./benchmark/benchmark")()
            .then(function () {
                done(true);
            })
            .catch(function (err) {
                console.log(err.stack || err);
                done(false);

            });
    });

    grunt.registerTask("spawn-test", "spawn tests", function (db) {
        var done = this.async();
        var env = process.env;
        env.PATIO_DB = db;
        grunt.util.spawn({
            cmd: "grunt",
            args: ["recreate_databases", "it"],
            opts: {stdio: 'inherit', env: env}
        }, function (err) {
            if (err) {
                done(false);
            } else {
                done();
            }
        });
    });

    grunt.registerTask("spawn-example", "spawn tests", function (db, exp) {
        var done = this.async();
        grunt.util.spawn({
            cmd: "grunt",
            args: ["example" + ":" + db + ":" + exp],
            opts: {stdio: 'inherit'}
        }, function (err) {
            if (err) {
                done(false);
            } else {
                done();
            }
        });
    });

    grunt.registerTask("spawn-test-coverage", "spawn tests with coverage", function (db) {
        var done = this.async();
        var env = process.env;
        env.PATIO_DB = db;
        grunt.util.spawn({
            cmd: "./node_modules/istanbul/lib/cli.js",
            args: DEFAULT_COVERAGE_ARGS,
            opts: {stdio: 'inherit', env: env}
        }, function (err) {
            if (err) {
                console.log(err);
                done(false);
            } else {
                done();
            }
        });
    });

    grunt.registerTask("example", "Runs an example from the examples directory", function (db, exp) {
        if (!exp) {
            console.log("Please choose one of the following examples:");
            grunt.file.expand("./example/**/*.example.js").forEach(function (exp) {
                console.log("\tgrunt example:%s", exp.replace("./example/", "").replace(/\.js$/, ""));
            });
        } else {
            if (!/\.example$/.test(exp)) {
                //get all the files to run
                grunt.file.expand("./example/" + exp + "/*.example.js").forEach(function (exp) {
                    grunt.task.run("spawn-example:" + db + ":" + exp.replace("./example/", "").replace(/\.js$/, ""));
                });
            } else {
                process.env.PATIO_DB = db;
                var done = this.async();
                require(path.resolve("./example/", exp))()
                    .then(function () {
                        done();
                    })
                    .catch(function (err) {
                        console.log(err.stack || err);
                        done(false);
                    });
            }
        }
    });

    grunt.registerTask("process-coverage", "process coverage obects", function () {
        var files = grunt.file.expand("./coverage/coverage*.json"),
            istanbul = require('istanbul'),
            collector = new istanbul.Collector(),
            reporter = new istanbul.Reporter(),
            sync = false,
            done = this.async();

        files.forEach(function (file) {
            collector.add(grunt.file.readJSON(file));
        });

        reporter.add('text');
        reporter.addAll(['lcovonly']);
        reporter.write(collector, sync, function (err) {
            if (err) {
                console.error(err.stack);
                return done(false);
            }
            console.log('All reports generated');
            done();
        });
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    // Default task.
    grunt.registerTask('default', ['jshint', "test", "test-coverage", "docs"]);

    grunt.registerTask('test', ['jshint', 'test-mysql', 'test-pg']);
    grunt.registerTask('test-mysql', ['jshint', "spawn-test:mysql"]);
    grunt.registerTask('test-pg', ['jshint', "spawn-test:pg"]);

    grunt.registerTask('coveralls', ['exec:removeCoverage', 'test-mysql-coverage', 'test-pg-coverage', 'process-coverage', 'exec:sendToCoveralls', 'exec:removeCoverage']);
    grunt.registerTask('test-coverage', ['exec:removeCoverage', 'test-mysql-coverage', 'test-pg-coverage', 'process-coverage', 'exec:removeCoverage']);
    grunt.registerTask('test-mysql-coverage', ["spawn-test-coverage:mysql"]);
    grunt.registerTask('test-pg-coverage', ["spawn-test-coverage:pg"]);


    grunt.registerTask("docs", ["exec:removeDocs", "exec:createDocs"]);

    grunt.loadNpmTasks('grunt-it');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-exec');

};
