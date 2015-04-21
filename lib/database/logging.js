"use strict";
var comb = require("comb"),
    define = comb.define,
    spreadArgs = comb.__spreadArgs,
    isFunction = comb.isFunction,
    logging = comb.logging,
    Logger = logging.Logger,
    format = comb.string.format,
    QueryError = require("../errors").QueryError;


var LOGGER = Logger.getLogger("patio.Database");

module.exports = define({
    instance: {
        /**@lends patio.Database.prototype*/

        /**
         * Logs an INFO level message to the "patio.Database" logger.
         */
        logInfo: function () {
            LOGGER.info.apply(LOGGER, arguments);
        },

        /**
         * Logs a DEBUG level message to the "patio.Database" logger.
         */
        logDebug: function () {
            LOGGER.debug.apply(LOGGER, arguments);
        },

        /**
         * Logs an ERROR level message to the "patio.Database" logger.
         */
        logError: function () {
            LOGGER.error.apply(LOGGER, arguments);
        },

        /**
         * Logs a WARN level message to the "patio.Database" logger.
         */
        logWarn: function () {
            LOGGER.warn.apply(LOGGER, arguments);
        },

        /**
         * Logs a TRACE level message to the "patio.Database" logger.
         */
        logTrace: function () {
            LOGGER.trace.apply(LOGGER, arguments);
        },

        /**
         * Logs a FATAL level message to the "patio.Database" logger.
         */
        logFatal: function () {
            LOGGER.fatal.apply(LOGGER, arguments);
        },

        /* Yield to the block, logging any errors at error level to all loggers,
         * and all other queries with the duration at warn or info level.
         * */
        __logAndExecute: function (sql, opts, cb) {
            if (isFunction(opts)) {
                cb = opts;
                opts = null;
            }
            opts = opts || {};
            var ret, start = new Date(), self = this;
            sql = sql.trim();
            this.logInfo("Executing; %s", sql);
            if (isFunction(cb)) {
                if (opts.stream) {
                    var stream = cb();
                    stream.on("end", function () {
                        self.logDebug("Duration: % 6dms; %s", new Date() - start, sql);
                    }).on("error", function (err) {
                        err = new QueryError(format("%s: %s", err.message, sql));
                        self.logError(err);
                    });
                    ret = stream;
                } else {
                    sql = sql.trim();
                    return cb().then(function (res) {
                        self.logDebug("Duration: % 6dms; %s", new Date() - start, sql);
                        return res;
                    }, function (err) {
                        var details = err.detail;
                        err = new QueryError(format("%s%s: %s", err.message, details ? " DETAIL('" + details + "')" : "", sql));
                        self.logError(err);
                        throw err;
                    });
                }
            } else {
                throw new QueryError("CB is required");
            }
            return ret;
        },

        /*Log the given SQL and then execute it on the connection, used by
         *the transaction code.
         * */
        __logConnectionExecute: function (conn, sql) {
            var connectionExecuteMethod = this.connectionExecuteMethod;
            return this.__logAndExecute(sql, function () {
                return conn[connectionExecuteMethod](sql);
            });
        },


        getters: {
            /**@lends patio.Database.prototype*/
            /**
             * The "patio.Database" logger.
             * @field
             */
            logger: function () {
                return LOGGER;
            }
        }
    },

    "static": {
        /**@lends patio.Database*/
        /**
         * Logs an INFO level message to the "patio.Database" logger.
         */
        logInfo: function () {
            if (LOGGER.isInfo) {
                LOGGER.info.apply(LOGGER, arguments);
            }
        },

        /**
         * Logs a DEBUG level message to the "patio.Database" logger.
         */
        logDebug: function () {
            if (LOGGER.isDebug) {
                LOGGER.debug.apply(LOGGER, arguments);
            }
        },

        /**
         * Logs a ERROR level message to the "patio.Database" logger.
         */
        logError: function () {
            if (LOGGER.isError) {
                LOGGER.error.apply(LOGGER, arguments);
            }
        },

        /**
         * Logs a WARN level message to the "patio.Database" logger.
         */
        logWarn: function () {
            if (LOGGER.isWarn) {
                LOGGER.warn.apply(LOGGER, arguments);
            }
        },

        /**
         * Logs a TRACE level message to the "patio.Database" logger.
         */
        logTrace: function () {
            if (LOGGER.isTrace) {
                LOGGER.trace.apply(LOGGER, arguments);
            }
        },

        /**
         * Logs a FATAL level message to the "patio.Database" logger.
         */
        logFatal: function () {
            if (LOGGER.isFatal) {
                LOGGER.fatal.apply(LOGGER, arguments);
            }
        },

        getters: {
            /**@lends patio.Database*/
            /**
             * The "patio.Database" logger.
             * @field
             */
            logger: function () {
                return LOGGER;
            }
        }
    }

});
