"use strict";

"use strict";
var server = "pg://postgres@127.0.0.1:5432/sandbox?maxConnections=10",
    patio = require("../index"),
    TIMES = parseInt(process.env.TIMES || 3),
    LIMIT = parseInt(process.env.LIMIT || 1000),
    comb = require("comb"),
    format = comb.string.format,
    noTransactions = require("./benchmark.noTransacitons"),
    defaults = require("./benchmark.defaults"),
    Entry;

patio.camelize = true;

module.exports = benchmarks;

function benchmarks() {
    console.log("Starting Benchmark...");
    return bench(noTransactions, "NO TRANSACTIONS MODEL", TIMES, LIMIT)
        .then(function (durations) {
            return printDurations("NO TRANSACTIONS MODEL", noTransactions, LIMIT, durations);
        })
        .then(function () {
            return bench(defaults, "DEFAULT MODEL", TIMES, LIMIT);
        })
        .then(function (durations) {
            return printDurations("DEFAULT MODEL", defaults, LIMIT, durations);
        });
}

function bench(module, header, times, limit) {
    return module.createTableAndModel(server).then(function () {
        Entry = patio.getModel("patioEntry");
        var res = {};

        function runTestsOnce(index) {
            console.log("%s RUN %d...", header, index + 1);
            addResult(res, "total", 1);
            return testInserts(false, limit)
                .then(function (result) {
                    addResult(res, "Serial Insert", result);
                    return testInserts(true, limit);
                })
                .then(function (result) {
                    addResult(res, "Async Insert", result);
                    return testUpdates(false, limit);
                })
                .then(function (result) {
                    addResult(res, "Serial Update", result);
                    return testUpdates(true, limit);
                })
                .then(function (result) {
                    addResult(res, "Async Update", result);
                    return testRead(false, limit);
                })
                .then(function (result) {
                    addResult(res, "Serial Read", result);
                    return testRead(true, limit);
                })
                .then(function (result) {
                    addResult(res, "Async Read", result);
                    return testDelete(false, limit);
                })
                .then(function (result) {
                    addResult(res, "Serial Delete", result);
                    return testDelete(true, limit);
                })
                .then(function (result) {
                    addResult(res, "Async Delete", result);
                });
        }

        return loop(false, runTestsOnce, times).then(function () {
            return res;
        });
    });
}

function loop(async, cb, limit) {
    var saves = [];
    limit = limit || LIMIT;
    for (var i = 0; i < limit; i++) {
        saves.push(async ? cb(i) : asyncLoopCb(cb, i));
    }
    if (async) {
        saves = Promise.all(saves);
    }
    return async ? saves : comb.serial(saves);
}

function asyncLoopCb(cb, i) {
    return function _asyncLoopCb() {
        return cb(i);
    };
}

function testInserts(async, limit) {
    var start = +new Date();
    return loop(async, function () {
        return new Entry({
            number: Math.floor(Math.random() * 99999),
            string: 'asdasd'
        }).save();
    }, limit).then(function () {
        return +(new Date()) - start;
    });
}

function testUpdates(async, limit) {
    return Entry.all().then(function (entries) {
        var start = +new Date;
        return loop(async, function (index) {
            return entries[index].update({number: Math.floor(Math.random() * 99999)});
        }, limit).then(function () {
            return +(new Date()) - start;
        });

    });
}

function testRead() {
    var start = +new Date;
    return Entry.all().then(function () {
        return (+new Date) - start;
    });
}

function testDelete(async, limit) {
    return Entry.all().then(function (entries) {
        var start = +new Date();
        return loop(async, function (index) {
            return entries[index].remove();
        }, limit).then(function () {
            return +(new Date()) - start;
        });
    });
}

function addResult(obj, key, res) {
    !obj[key] && (obj[key] = 0);
    obj[key] += res;
}


function printDurations(header, module, limit, durations) {
    console.log(header);
    var msg = "%-15s (%02s runs): Average duration % 8dms for %d items";
    for (var testName in durations) {
        if (testName !== "total") {
            console.log(format(msg, testName, durations.total, durations[testName] / durations.total), limit);
        }
    }
    var memStats = process.memoryUsage();
    console.log(format("RSS:= %.2d mb; HEAP_TOTAL := %.2d mb; HEAP_USED := %.2d mb", memStats.rss / 1048576, memStats.heapTotal / 1048576, memStats.heapUsed / 1048576));
    module.disconnect();
}

