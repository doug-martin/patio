var it = require('it'),
    assert = require('assert'),
    patio = new require("../lib"),
    Database = require("../lib/database"),
    Dataset = require("../lib/dataset"),
    sql = require("../lib/sql").sql,
    Constant = sql.Constant,
    BooleanConstant = sql.BooleanConstant,
    NegativeBooleanConstant = sql.NegativeBooleanConstant,
    comb = require("comb"),
    Model = require("../lib/model").Model;

patio.DATABASES.length = 0;
patio.quoteIdentifiers = true;

var getTimeZoneOffset = function (date) {
    var offset = date.getTimezoneOffset();
    var tz = [
        (offset >= 0 ? "-" : "+"),
        comb.string.pad(Math.floor(Math.abs(offset) / 60), 2, "0"),
        comb.string.pad(Math.abs(offset) % 60, 2, "0")
    ];
    return tz.join("");
};


it.describe("patio", function (it) {

    var DummyDataset, DummyDatabase;
    it.beforeAll(function () {
        return patio.disconnect().then(function () {
            DummyDatabase = comb.define(patio.Database, {
                instance: {
                    constructor: function () {
                        this._super(arguments);
                        this.sqls = [];
                        this.identifierInputMethod = null;
                        this.identifierOutputMethod = null;
                    },

                    createConnection: function (options) {
                        this.connected = true;
                        return Promise.resolve({});
                    },

                    closeConnection: function (conn) {
                        this.connected = false;
                        return Promise.resolve();
                    },

                    validate: function (conn) {
                        return Promise.resolve(true);
                    },

                    execute: function (sql) {
                        var self = this;
                        return this.pool.getConnection().then(function (conn) {
                            self.sqls.push(sql);
                            self.pool.returnConnection(conn);
                        });
                    },

                    executeError: function () {
                        return this.execute.apply(this, arguments).then(
                            function () {
                                throw new Error();
                            }, function () {
                                throw new Error();
                            });
                    },

                    reset: function () {
                        this.sqls = [];
                    }

                }
            }).setAdapterType("dummydb");
            patio.resetIdentifierMethods();
        });
    });

    it.should("have constants", function () {
        assert.deepEqual(patio.CURRENT_DATE, new Constant("CURRENT_DATE"));
        assert.deepEqual(patio.CURRENT_TIME, new Constant("CURRENT_TIME"));
        assert.deepEqual(patio.CURRENT_TIMESTAMP, new Constant("CURRENT_TIMESTAMP"));
        assert.deepEqual(patio.SQLTRUE, new BooleanConstant(1));
        assert.deepEqual(patio.TRUE, new BooleanConstant(1));
        assert.deepEqual(patio.SQLFALSE, new BooleanConstant(0));
        assert.deepEqual(patio.FALSE, new BooleanConstant(0));
        assert.deepEqual(patio.NULL, new BooleanConstant(null));
        assert.deepEqual(patio.NOTNULL, new NegativeBooleanConstant(null));
        assert.equal(patio.identifierInputMethod, null);
        assert.equal(patio.identifierOutputMethod, null);
        assert.equal(patio.quoteIdentifiers, true);
    });

    it.should("connect to a database ", function () {
        var DB1 = patio.connect("dummyDB://test:testpass@localhost/dummySchema");
        assert.instanceOf(DB1, DummyDatabase);
        assert.isTrue(DB1 === patio.defaultDatabase);
        var DB2 = patio.createConnection("dummyDB://test:testpass@localhost/dummySchema");
        assert.instanceOf(DB2, DummyDatabase);
    });

    it.should("disconnect from a db", function () {
        var DB = patio.connect("dummyDB://test:testpass@localhost/dummySchema");
        return DB.createTable("test", function () {
            this.primaryKey("id");
            this.name(String);
            this.age(Number);
        }).then(function () {
            assert.isTrue(DB.connected);
            return patio.disconnect().then(function () {
                assert.isFalse(DB.connected);
            });
        });
    });

    it.should("expose core classes", function () {
        assert.strictEqual(patio.Dataset, Dataset);
        assert.strictEqual(patio.Database, Database);
        assert.strictEqual(patio.SQL, sql);
        assert.strictEqual(patio.sql, sql);
    });

    it.should("format years ", function () {
        var date = new Date(2004, 1, 1, 1, 1, 1), year = new sql.Year(2004);
        assert.equal(patio.yearToString(date), '2004');
        assert.equal(patio.yearToString(year), '2004');
        patio.yearFormat = "yy";
        assert.equal(patio.yearToString(date), '04');
        assert.equal(patio.yearToString(year), '04');
        patio.yearFormat = patio.DEFAULT_YEAR_FORMAT;
    });

    it.should("format times ", function () {
        var date = new Date(null, null, null, 13, 12, 12), time = new sql.Time(13, 12, 12);
        assert.equal(patio.timeToString(date), '13:12:12');
        assert.equal(patio.timeToString(time), '13:12:12');
        patio.timeFormat = "hh:mm:ss";
        assert.equal(patio.timeToString(date), '01:12:12');
        assert.equal(patio.timeToString(time), '01:12:12');
        patio.timeFormat = patio.DEFAULT_TIME_FORMAT;
    });

    it.should("format dates ", function () {
        var date = new Date(2004, 1, 1);
        assert.equal(patio.dateToString(date), '2004-02-01');
        patio.dateFormat = patio.TWO_YEAR_DATE_FORMAT;
        assert.equal(patio.dateToString(date), '04-02-01');
        patio.dateFormat = patio.DEFAULT_DATE_FORMAT;
    });

    it.should("format datetimes ", function () {
        var date = new Date(2004, 1, 1, 12, 12, 12),
            dateTime = new sql.DateTime(2004, 1, 1, 12, 12, 12),
            offset = getTimeZoneOffset(date);
        assert.equal(patio.dateTimeToString(date), '2004-02-01 12:12:12');
        assert.equal(patio.dateTimeToString(dateTime), '2004-02-01 12:12:12');
        patio.dateTimeFormat = patio.DATETIME_TWO_YEAR_FORMAT;
        assert.equal(patio.dateTimeToString(date), '04-02-01 12:12:12');
        assert.equal(patio.dateTimeToString(dateTime), '04-02-01 12:12:12');
        patio.dateTimeFormat = patio.DATETIME_FORMAT_TZ;
        assert.equal(patio.dateTimeToString(date), '2004-02-01 12:12:12' + offset);
        assert.equal(patio.dateTimeToString(dateTime), '2004-02-01 12:12:12' + offset);
        patio.dateTimeFormat = patio.ISO_8601;
        assert.equal(patio.dateTimeToString(date), '2004-02-01T12:12:12' + offset);
        assert.equal(patio.dateTimeToString(dateTime), '2004-02-01T12:12:12' + offset);
        patio.dateTimeFormat = patio.ISO_8601_TWO_YEAR;
        assert.equal(patio.dateTimeToString(date), '04-02-01T12:12:12' + offset);
        assert.equal(patio.dateTimeToString(dateTime), '04-02-01T12:12:12' + offset);
        patio.dateTimeFormat = patio.DEFAULT_DATETIME_FORMAT;
        assert.equal(patio.dateTimeToString(date), '2004-02-01 12:12:12');
        assert.equal(patio.dateTimeToString(dateTime), '2004-02-01 12:12:12');


    });

    it.should("format timestamps ", function () {
        var date = new Date(2004, 1, 1, 12, 12, 12),
            dateTime = new sql.TimeStamp(2004, 1, 1, 12, 12, 12),
            offset = getTimeZoneOffset(date);
        assert.equal(patio.timeStampToString(date), '2004-02-01 12:12:12');
        assert.equal(patio.timeStampToString(dateTime), '2004-02-01 12:12:12');
        patio.timeStampFormat = patio.TIMESTAMP_TWO_YEAR_FORMAT;
        assert.equal(patio.timeStampToString(date), '04-02-01 12:12:12');
        assert.equal(patio.timeStampToString(dateTime), '04-02-01 12:12:12');
        patio.timeStampFormat = patio.TIMESTAMP_FORMAT_TZ;
        assert.equal(patio.timeStampToString(date), '2004-02-01 12:12:12' + offset);
        assert.equal(patio.timeStampToString(dateTime), '2004-02-01 12:12:12' + offset);
        patio.timeStampFormat = patio.ISO_8601;
        assert.equal(patio.timeStampToString(date), '2004-02-01T12:12:12' + offset);
        assert.equal(patio.timeStampToString(dateTime), '2004-02-01T12:12:12' + offset);
        patio.timeStampFormat = patio.ISO_8601_TWO_YEAR;
        assert.equal(patio.timeStampToString(date), '04-02-01T12:12:12' + offset);
        assert.equal(patio.timeStampToString(dateTime), '04-02-01T12:12:12' + offset);
        patio.timeStampFormat = patio.DEFAULT_TIMESTAMP_FORMAT;
        assert.equal(patio.timeStampToString(date), '2004-02-01 12:12:12');
        assert.equal(patio.timeStampToString(dateTime), '2004-02-01 12:12:12');

    });

    it.should("format arbitrary dates ", function () {
        var date = new Date(2004, 1, 1),
            timeStamp = new sql.TimeStamp(2004, 1, 1, 12, 12, 12),
            dateTime = new sql.DateTime(2004, 1, 1, 12, 12, 12),
            year = new sql.Year(2004),
            time = new sql.Time(12, 12, 12),
            offset = getTimeZoneOffset(date);

        //convert years
        assert.equal(patio.dateToString(year), '2004');
        patio.yearFormat = "yy";
        assert.equal(patio.dateToString(year), '04');
        patio.yearFormat = patio.DEFAULT_YEAR_FORMAT;
        assert.equal(patio.dateToString(year), '2004');


        //convert times
        assert.equal(patio.dateToString(time), '12:12:12');

        //convert dates
        assert.equal(patio.dateToString(date), '2004-02-01');
        patio.dateFormat = patio.TWO_YEAR_DATE_FORMAT;
        assert.equal(patio.dateToString(date), '04-02-01');
        patio.dateFormat = patio.DEFAULT_DATE_FORMAT;
        assert.equal(patio.dateToString(date), '2004-02-01');

        //convert dateTime
        assert.equal(patio.dateToString(dateTime), '2004-02-01 12:12:12');
        patio.dateTimeFormat = patio.DATETIME_TWO_YEAR_FORMAT;
        assert.equal(patio.dateToString(dateTime), '04-02-01 12:12:12');
        patio.dateTimeFormat = patio.DATETIME_FORMAT_TZ;
        assert.equal(patio.dateToString(dateTime), '2004-02-01 12:12:12' + offset);
        patio.dateTimeFormat = patio.ISO_8601;
        assert.equal(patio.dateToString(dateTime), '2004-02-01T12:12:12' + offset);
        patio.dateTimeFormat = patio.ISO_8601_TWO_YEAR;
        assert.equal(patio.dateToString(dateTime), '04-02-01T12:12:12' + offset);
        patio.dateTimeFormat = patio.DEFAULT_DATETIME_FORMAT;
        assert.equal(patio.dateToString(dateTime), '2004-02-01 12:12:12');

        //convert timestamps
        assert.equal(patio.dateToString(timeStamp), '2004-02-01 12:12:12');
        patio.timeStampFormat = patio.TIMESTAMP_TWO_YEAR_FORMAT;
        assert.equal(patio.dateToString(timeStamp), '04-02-01 12:12:12');
        patio.timeStampFormat = patio.TIMESTAMP_FORMAT_TZ;
        assert.equal(patio.dateToString(timeStamp), '2004-02-01 12:12:12' + offset);
        patio.timeStampFormat = patio.ISO_8601;
        assert.equal(patio.dateToString(timeStamp), '2004-02-01T12:12:12' + offset);
        patio.timeStampFormat = patio.ISO_8601_TWO_YEAR;
        assert.equal(patio.dateToString(timeStamp), '04-02-01T12:12:12' + offset);
        patio.timeStampFormat = patio.DEFAULT_TIMESTAMP_FORMAT;
        assert.equal(patio.dateToString(timeStamp), '2004-02-01 12:12:12');
    });

    it.should("convert years", function () {
        var year = new sql.Year(2004);
        assert.deepEqual(patio.stringToYear("2004"), year);
        patio.yearFormat = "yy";
        assert.deepEqual(patio.stringToYear("04"), year);
        patio.yearFormat = patio.DEFAULT_YEAR_FORMAT;
        assert.throws(comb.hitch(patio, "stringToYear", "aaaa"));
    });

    it.should("convert times", function () {
        var time = new sql.Time(12, 12, 12);
        assert.deepEqual(patio.stringToTime("12:12:12"), time);
        assert.throws(comb.hitch(patio, "stringToTime", "9999:9999:9999"));
    });

    it.should("convert dates", function () {
        var date = new Date(2004, 1, 1, 0, 0, 0);
        assert.deepEqual(patio.stringToDate('2004-02-01'), date);
        patio.dateFormat = patio.TWO_YEAR_DATE_FORMAT;
        assert.deepEqual(patio.stringToDate('04-02-01'), date);
        patio.dateFormat = patio.DEFAULT_DATE_FORMAT;
        assert.throws(comb.hitch(patio, "stringToDate", "2004-12--2"));
        assert.throws(comb.hitch(patio, "stringToDate", "a"));
        assert.throws(comb.hitch(patio, "stringToDate", "2004-25-2"));
    });

    it.should("convert dateTimes", function () {
        var dateTime = new sql.DateTime(2004, 1, 1, 12, 12, 12),
            offset = getTimeZoneOffset(dateTime);
        assert.deepEqual(patio.stringToDateTime('2004-02-01 12:12:12'), dateTime);
        patio.dateTimeFormat = patio.DATETIME_TWO_YEAR_FORMAT;
        assert.deepEqual(patio.stringToDateTime('04-02-01 12:12:12' + offset), dateTime);
        patio.dateTimeFormat = patio.DATETIME_FORMAT_TZ;
        assert.deepEqual(patio.stringToDateTime('2004-02-01 12:12:12' + offset), dateTime);
        patio.dateTimeFormat = patio.ISO_8601;
        assert.deepEqual(patio.stringToDateTime('2004-02-01T12:12:12' + offset), dateTime);
        patio.dateTimeFormat = patio.ISO_8601_TWO_YEAR;
        assert.deepEqual(patio.stringToDateTime('04-02-01T12:12:12' + offset), dateTime);
        patio.dateTimeFormat = patio.DEFAULT_DATETIME_FORMAT;
        assert.deepEqual(patio.stringToDateTime('2004-02-01 12:12:12'), dateTime);
        assert.throws(comb.hitch(patio, "stringToDateTime", "2004-12--2"));
        assert.throws(comb.hitch(patio, "stringToDateTime", "a"));
        assert.throws(comb.hitch(patio, "stringToDateTime", "2004-25-2"));
        assert.throws(comb.hitch(patio, "stringToDateTime", "2004-25-2THHMM"));
    });

    it.should("convert timestamps", function () {
        var dateTime = new sql.TimeStamp(2004, 1, 1, 12, 12, 12),
            offset = getTimeZoneOffset(dateTime);
        assert.deepEqual(patio.stringToTimeStamp('2004-02-01 12:12:12'), dateTime);
        patio.timeStampFormat = patio.TIMESTAMP_TWO_YEAR_FORMAT;
        assert.deepEqual(patio.stringToTimeStamp('04-02-01 12:12:12' + offset), dateTime);
        patio.timeStampFormat = patio.TIMESTAMP_FORMAT_TZ;
        assert.deepEqual(patio.stringToTimeStamp('2004-02-01 12:12:12' + offset), dateTime);
        patio.timeStampFormat = patio.ISO_8601;
        assert.deepEqual(patio.stringToTimeStamp('2004-02-01T12:12:12' + offset), dateTime);
        patio.timeStampFormat = patio.ISO_8601_TWO_YEAR;
        assert.deepEqual(patio.stringToTimeStamp('04-02-01T12:12:12' + offset), dateTime);
        patio.timeStampFormat = patio.DEFAULT_TIMESTAMP_FORMAT;
        assert.deepEqual(patio.stringToTimeStamp('2004-02-01 12:12:12'), dateTime);
        assert.throws(comb.hitch(patio, "stringToTimeStamp", "2004-12--2"));
        assert.throws(comb.hitch(patio, "stringToTimeStamp", "a"));
        assert.throws(comb.hitch(patio, "stringToTimeStamp", "2004-25-2"));
        assert.throws(comb.hitch(patio, "stringToTimeStamp", "2004-25-2THHMM"));
    });

    it.should("set underscore values when using #underscore", function () {
        patio.underscore = true;
        assert.isTrue(patio.underscore);
        assert.isTrue(Model.underscore);
        assert.equal(patio.identifierOutputMethod, "underscore");
        assert.equal(patio.identifierInputMethod, "camelize");
    });

    it.should("set camelize values when using #camelize", function () {
        patio.camelize = true;
        assert.isTrue(patio.camelize);
        assert.isTrue(Model.camelize);
        assert.equal(patio.identifierOutputMethod, "camelize");
        assert.equal(patio.identifierInputMethod, "underscore");
    });


    it.afterAll(function () {
        patio.resetIdentifierMethods();
        return patio.disconnect();
    });

});