module.exports = function (sql) {
    "use strict";
    var comb = require("comb-proxy"),
        isUndefined = comb.isUndefined,
        isInstanceOf = comb.isInstanceOf,
        argsToArray = comb.argsToArray,
        isDate = comb.isDate,
        isHash = comb.isHash,
        merge = comb.merge,
        isArray = comb.isArray,
        isNumber = comb.isNumber,
        isString = comb.isString,
        define = comb.define,
        Dataset;

    sql.Year = Year;
    sql.Time = Time;
    sql.TimeStamp = TimeStamp;
    sql.DateTime = DateTime;
    sql.Float = Float;
    sql.Decimal = Decimal;

    /**
     * @constructor
     * Creates a Year type to be used in queries that require a SQL year datatype.
     * All <i>Date</i> methods ar included in the prototype of the Year type. toString and toJSON
     * are overridden to return a year format instead of the default <i>Date</i> formatting.
     * See {@link patioTime#yearToString} for formatting information.
     *
     * @example
     *
     * var year = patio.Year(2009); //=> 2009
     * JSON.stringify(year)l //=> 2009
     *
     * @memberOf patio.sql
     * @param {Number} y the year this year represents.
     */
    function Year(y) {
        this.date = isUndefined(y) ? new Date() : isDate(y) ? y : new Date(y, 0, 1, 0, 0, 0);
    }

    Year.prototype.toJSON = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };

    Year.prototype.toString = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };


    /**
     * @constructor
     * Creates a Time type to be used in queries that require a SQL time datatype.
     * All <i>Date</i> methods ar included in the prototype of the Time type. toString and toJSON
     * are overridden to return a time format instead of the default <i>Date</i> formatting.
     * See {@link patioTime#timeToString} for formatting information.
     *
     * @example
     *
     * var time = patio.Time(12, 12, 12); //=> 12:12:12
     * JSON.stringify(time); //=> 12:12:12
     *
     * @memberOf patio.sql
     * @param {Number} [h=0] the hour
     * @param {Number} [min=0] the minute/s
     * @param {Number} [s=0] the second/s
     * @param {Number} [ms=0] the millisecond/s, this paramater is not be used, but may depending on the adapter.
     */
    function Time(h, min, s, ms) {
        var args = argsToArray(arguments);
        if (args.length === 0) {
            this.date = new Date();
        } else if (isDate(h)) {
            this.date = h;
        } else {
            var date = new Date(1970, 0, 1, 0, 0, 0);
            isNumber(h) && date.setHours(h);
            isNumber(min) && date.setMinutes(min);
            isNumber(s) && date.setSeconds(s);
            isNumber(ms) && date.setMilliseconds(ms);
            this.date = date;
        }

    }

    Time.prototype.toJSON = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };

    Time.prototype.toString = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };


    /**
     * @constructor
     * Creates a TimeStamp type to be used in queries that require a SQL timestamp datatype.
     * All <i>Date</i> methods ar included in the prototype of the TimeStamp type. toString and toJSON
     * are overridden to return a ISO8601 format instead of the default <i>Date</i> formatting.
     * See {@link patioTime#timeStampToString} for formatting information.
     *
     * @example
     *
     * var timeStamp = patio.TimeStamp(2009, 10, 10, 10, 10, 10); //=> '2009-11-10 10:10:10'
     * JSON.stringify(timeStamp); //=> '2009-11-10 10:10:10'
     *
     * @memberOf patio.sql
     * @param {Number} [y=1970] the year
     * @param {Number} [m=0] the month
     * @param {Number} [d=1] the day
     * @param {Number} [h=0] the hour
     * @param {Number} [min=0] the minute/s
     * @param {Number} [s=0] the second/s
     * @param {Number} [ms=0] the millisecond/s, this paramater is not be used, but may depending on the adapter.
     */
    function TimeStamp(y, m, d, h, min, s, ms) {
        var args = argsToArray(arguments);
        if (args.length === 0) {
            this.date = new Date();
        } else if (isDate(y)) {
            this.date = y;
        } else {
            var date = new Date(1970, 0, 1, 0, 0, 0);
            isNumber(y) && date.setYear(y);
            isNumber(m) && date.setMonth(m);
            isNumber(d) && date.setDate(d);
            isNumber(h) && date.setHours(h);
            isNumber(min) && date.setMinutes(min);
            isNumber(s) && date.setSeconds(s);
            isNumber(ms) && date.setMilliseconds(ms);
            this.date = date;
        }
    }

    TimeStamp.prototype.toJSON = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };

    TimeStamp.prototype.toString = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };

    /**
     * @constructor
     * Creates a DateTime type to be used in queries that require a SQL datetime datatype.
     * All <i>Date</i> methods ar included in the prototype of the DateTime type. toString and toJSON
     * are overridden to return a ISO8601 formatted date string instead of the default <i>Date</i> formatting.
     * See {@link patioTime#dateTimeToString} for formatting information.
     *
     * @example
     *
     * var dateTime = patio.DateTime(2009, 10, 10, 10, 10, 10); //=> '2009-11-10 10:10:10'
     * JSON.stringify(dateTime); //=> '2009-11-10 10:10:10'
     *
     * @memberOf patio.sql
     * @param {Number} [y=1970] the year
     * @param {Number} [m=0] the month
     * @param {Number} [d=1] the day
     * @param {Number} [h=0] the hour
     * @param {Number} [min=0] the minute/s
     * @param {Number} [s=0] the second/s
     * @param {Number} [ms=0] the millisecond/s, this paramater is not be used, but may depending on the adapter.
     */
    function DateTime(y, m, d, h, min, s, ms) {
        var args = argsToArray(arguments);
        if (args.length === 0) {
            this.date = new Date();
        } else if (isDate(y)) {
            this.date = y;
        } else {
            var date = new Date(1970, 0, 1, 0, 0, 0);
            isNumber(y) && date.setYear(y);
            isNumber(m) && date.setMonth(m);
            isNumber(d) && date.setDate(d);
            isNumber(h) && date.setHours(h);
            isNumber(min) && date.setMinutes(min);
            isNumber(s) && date.setSeconds(s);
            isNumber(ms) && date.setMilliseconds(ms);
            this.date = date;
        }
    }


    DateTime.prototype.toJSON = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };

    DateTime.prototype.toString = function () {
        return isUndefined(this.date) ? this.date : sql.patio.dateToString(this);
    };

    /**
     * @class Represents a SQL Float type, by default is converted to double precision
     * @param {Number} number the number to be represented as a float
     * @memberOf patio.sql
     */
    function Float(number) {
        this.number = number;
    }


    Float.prototype.toJSON = function () {
        return this.number;
    };

    /**
     * @class
     * Represents a SQL Decimal type, by default is converted to double precision
     * @param {Number} number the number to be represented as a decimal
     * @memberOf patio.sql
     */
    function Decimal(number) {
        this.number = number;
    }

    Decimal.prototype.toJSON = function () {
        return this.number;
    };


    sql.Cast = sql.GenericExpression.extend({
        instance: {
            /**@lends patio.sql.Cast*/

            /**
             * Represents a cast of an SQL expression to a specific type.
             * @constructs
             * @augments patio.sql.GenericExpression
             *
             * @param expr the expression to CAST.
             * @param type the  type to CAST the expression to.
             *
             * @property expr the expression to CAST.
             * @property type the  type to CAST the expression to.
             */
            constructor: function (expr, type) {
                this.expr = expr;
                this.type = type;
            },

            /**
             * Converts the cast expression to a string
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL cast expression fragment.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.castSql(this.expr, this.type);
            }
        }
    });


    sql.ColumnAll = sql.Expression.extend({
        instance: {
            /**@lends patio.sql.ColumnAll.prototype*/

            /**
             * Represents all columns in a given table, table.* in SQL
             * @constructs
             *
             * @augments patio.sql.Expression
             *
             * @param table the table this expression is for.
             *
             * @property table the table this all column expression represents.
             */
            constructor: function (table) {
                this.table = table;
            },

            /**
             * Converts the ColumnAll expression to a string
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL columnAll expression fragment.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.columnAllSql(this);
            }
        }
    });


    sql.Constant = sql.GenericExpression.extend({
        instance: {
            /**@lends patio.sql.Constant.prototype*/
            /**
             * Represents constants or psuedo-constants (e.g.'CURRENT_DATE) in SQL.
             *
             * @constructs
             * @augments patio.sql.GenericExpression
             * @property {String} constant <b>READ ONLY</b> the contant.
             */
            constructor: function (constant) {
                this.__constant = constant;
            },

            /**
             * Converts the {@link patio.sql.Constant} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.Constant}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.constantSql(this.__constant);
            },

            getters: {
                constant: function () {
                    return this.__constant;
                }
            }
        }
    });

    /**
     * @class Represents boolean constants such as NULL, NOTNULL, TRUE, and FALSE.
     * @augments patio.sql.Constant
     * @name BooleanConstant
     * @memberOf patio.sql
     */
    sql.BooleanConstant = sql.Constant.extend({
        instance: {
            /**@lends patio.sql.BooleanConstant.prototype*/

            /**
             * Converts the {@link patio.sql.BooleanConstant} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.BooleanConstant}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.booleanConstantSql(this.__constant);
            }
        }
    });

    /**
     * Represents inverse boolean constants (currently only NOTNULL). A
     * special class to allow for special behavior.
     *
     * @augments patio.sql.BooleanConstant
     * @name NegativeBooleanConstant
     * @memberOf patio.sql
     */
    sql.NegativeBooleanConstant = sql.BooleanConstant.extend({
        instance: {
            /**@lends patio.sql.NegativeBooleanConstant.prototype*/

            /**
             * Converts the {@link patio.sql.NegativeBooleanConstant} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.NegativeBooleanConstant}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.negativeBooleanConstantSql(this.__constant);
            }
        }
    });

    /**
     * @namespace Holds default generic constants that can be referenced.  These
     * are included in {@link patio}
     * @name Constants
     * @memberOf patio.sql
     */
    sql.Constants = {
        /**@lends patio.sql.Constants*/

        /**
         * Constant for CURRENT DATE
         * @type patio.sql.Constant
         */
        CURRENT_DATE: new sql.Constant("CURRENT_DATE"),

        /**
         * Constant for CURRENT TIME
         * @type patio.sql.Constant
         */
        CURRENT_TIME: new sql.Constant("CURRENT_TIME"),

        /**
         * Constant for CURRENT TIMESTAMP
         * @type patio.sql.Constant
         */
        CURRENT_TIMESTAMP: new sql.Constant("CURRENT_TIMESTAMP"),

        /**
         * Constant for TRUE
         * @type patio.sql.BooleanConstant
         */
        SQLTRUE: new sql.BooleanConstant(1),

        /**
         * Constant for TRUE
         * @type patio.sql.BooleanConstant
         */
        TRUE: new sql.BooleanConstant(1),

        /**
         * Constant for FALSE.
         * @type patio.sql.BooleanConstant
         */
        SQLFALSE: new sql.BooleanConstant(0),

        /**
         * Constant for FALSE
         * @type patio.sql.BooleanConstant
         */
        FALSE: new sql.BooleanConstant(0),
        /**
         * Constant for NULL
         * @type patio.sql.BooleanConstant
         */
        NULL: new sql.BooleanConstant(null),

        /**
         * Constant for NOT NULL
         * @type patio.sql.NegativeBooleanConstant
         */
        NOTNULL: new sql.NegativeBooleanConstant(null)

    };

    sql.Identifier = define([sql.GenericExpression, sql.QualifyingMethods], {
        instance: {
            /**@lends patio.sql.Identifier.prototype*/

            /**
             * Represents an identifier (column or table). Can be used
             * to specify a String with multiple underscores that should not be
             * split, or for creating an implicit identifier without using a String.
             *
             * @constructs
             * @augments patio.sql.GenericExpression
             * @augments patio.sql.QualifyingMethods
             *
             * @param {String}value the identifier.
             *
             * @property {String} value <b>READ ONLY</b> the column or table this identifier represents.
             */
            constructor: function (value) {
                this.__value = value;
            },

            /**
             * Converts the {@link patio.sql.Identifier} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.Identifier}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.quoteIdentifier(this);
            },

            /**@ignore*/
            getters: {
                value: function () {
                    return this.__value;
                }
            }
        }
    });


    sql.PlaceHolderLiteralString = sql.GenericExpression.extend({
        instance: {
            /**@lends patio.sql.PlaceHolderLiteralString.prototype*/

            /**
             * Represents a literal string with placeholders and arguments.
             * This is necessary to ensure delayed literalization of the arguments
             * required for the prepared statement support and for database-specific
             * literalization.
             *
             * @constructs
             * @augments patio.sql.GenericExpression
             *
             * @param {String} str the string that contains placeholders.
             * @param {Array} args array of arguments that will be literalized using {@link patio.Dataset#literal}, and
             * replaced in the string.
             * @param {Boolean} [parens=false] set to true to wrap the string in parens.
             *
             * @property {String} str <b>READ ONLY</b> the string that contains placeholders.
             * @property {Array} args <b>READ ONLY</b> array of arguments that will be literalized using {@link patio.Dataset#literal}, and
             * replaced in the string.
             * @property {String} parens <b>READ ONLY</b> set to true to wrap the string in parens.
             */
            constructor: function (str, args, parens) {
                parens = parens || false;
                var v;
                this.__str = str;
                this.__args = isArray(args) && args.length === 1 && isHash((v = args[0])) ? v : args;
                this.__parens = parens;
            },

            /**
             * Converts the {@link patio.sql.PlaceHolderLiteralString} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.PlaceHolderLiteralString}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.placeholderLiteralStringSql(this);
            },

            /**@ignore*/
            getters: {
                str: function () {
                    return this.__str;
                },
                args: function () {
                    return this.__args;
                },

                parens: function () {
                    return this.__parens;
                }

            }
        }
    });


    sql.SQLFunction = sql.GenericExpression.extend({
        instance: {
            /**@lends patio.sql.SQLFunction.prototype*/

            /**
             * Represents an SQL function call.
             *
             * @constructs
             * @augments patio.sql.GenericExpression
             *
             * @param {...} f variable number of arguments where the first argument is the name
             * of the SQL function to invoke. The rest of the arguments will be literalized through
             * {@link patio.Dataset#literal} and placed into the SQL function call.
             *
             * @property {String} f <b>READ ONLY</b> the SQL function to call.
             * @property {Array} args <b>READ ONLY</b> args  arguments will be literalized through
             * {@link patio.Dataset#literal} and placed into the SQL function call.
             * */
            constructor: function (f) {
                var args = argsToArray(arguments).slice(1);
                this.__f = isInstanceOf(f, sql.Identifier) ? f.value : f, this.__args = args.map(function (a) {
                    return isString(a) ? sql.stringToIdentifier(a) : a;
                });
            },

            /**
             * Converts the {@link patio.sql.SQLFunction} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.SQLFunction}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.functionSql(this);
            },

            /**@ignore*/
            getters: {
                f: function () {
                    return this.__f;
                },

                args: function () {
                    return this.__args;
                }
            }
        }
    });


    sql.QualifiedIdentifier = define([sql.GenericExpression, sql.QualifyingMethods], {
        instance: {
            /**@lends patio.sql.QualifiedIdentifier.prototype*/

            /**
             * Represents a qualified identifier (column with table or table with schema).
             *
             * @constructs
             * @augments patio.sql.GenericExpression
             * @augments patio.sql.QualifyingMethods
             *
             * @param table the table or schema to qualify the column or table to.
             * @param column the column or table to qualify.
             *
             * @property table <b>READ ONLY</b> the table or schema to qualify the column or table to.
             * @property column <b>READ ONLY</b> he column or table to qualify.
             */
            constructor: function (table, column) {
                this.__table = table;
                this.__column = column;
            },

            /**
             * Converts the {@link patio.sql.QualifiedIdentifier} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.QualifiedIdentifier}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.qualifiedIdentifierSql(this);
            },

            /**@ignore*/
            getters: {
                table: function () {
                    return this.__table;
                },

                column: function () {
                    return this.__column;
                }
            }
        }
    });


    sql.SubScript = sql.GenericExpression.extend({
        instance: {
            /**@lends patio.sql.SubScript.prototype*/

            /**
             * Represents an SQL array access, with multiple possible arguments.
             * @constructs
             * @augments patio.sql.GenericExpression
             *
             * @param arrCol the SQL array column
             * @param sub The array of subscripts to use (should be an array of numbers)
             */
            constructor: function (arrCol, sub) {
                //The SQL array column
                this.__arrCol = arrCol;
                //The array of subscripts to use (should be an array of numbers)
                this.__sub = sub;
            },

            /**
             * Create a new {@link patio.sql.Subscript} appending the given subscript(s)
             * the the current array of subscripts.
             */
            addSub: function (sub) {
                return new sql.SubScript(this.__arrCol, this.__sub.concat(sub));
            },

            /**
             * Converts the {@link patio.sql.SubScript} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.SubScript}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.subscriptSql(this);
            },

            /**@ignore*/
            getters: {
                f: function () {
                    return this.__arrCol;
                },

                sub: function () {
                    return this.__sub;
                }
            }
        }
    });


    sql.LiteralString = define([sql.OrderedMethods, sql.ComplexExpressionMethods, sql.BooleanMethods, sql.NumericMethods, sql.StringMethods, sql.InequalityMethods, sql.AliasMethods], {
        instance: {
            /**@lends patio.sql.LiteralString*/

            /**
             * Represents a string that should be placed into a SQL query literally.
             * <b>This class has all methods that a normal javascript String has.</b>
             * @constructs
             * @augments patio.sql.OrderedMethods
             * @augments patio.sql.ComplexExpressionMethods
             * @augments patio.sql.BooleanMethods
             * @augments patio.sql.NumericMethods
             * @augments patio.sql.StringMethods
             * @augments patio.sql.InequalityMethods
             * @augments patio.sql.AliasMethods
             *
             * @param {String} str the literal string.
             */
            constructor: function (str) {
                this.__str = str;
            }
        }
    });

    sql.JoinClause = sql.Expression.extend({
        instance: {
            /**@lends patio.sql.JoinClause.prototype*/

            /**
             * Represents an SQL JOIN clause, used for joining tables.
             * Created by {@link patio.Dataset} join methods.
             * @constructs
             * @augments patio.sql.Expression
             *
             * @param {String} joinType the type of join this JoinClause should use
             * @param table the table to join with
             * @param tableAlias the alias to use for this join clause
             *
             * @property {String} joinType <b>READ ONLY</b> the type of join this JoinClause should use
             * @property table <b>READ ONLY</b> the table to join with
             * @property joinType <b>READ ONLY</b> the alias to use for this join clause
             * */
            constructor: function (joinType, table, tableAlias) {
                this.__joinType = joinType;
                this.__table = table;
                this.__tableAlias = tableAlias || null;
            },

            /**
             * Converts the {@link patio.sql.JoinClause} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.JoinClause}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.joinClauseSql(this);
            },

            /**@ignore*/
            getters: {
                joinType: function () {
                    return this.__joinType;
                },

                table: function () {
                    return this.__table;
                },

                tableAlias: function () {
                    return this.__tableAlias;
                }
            }
        }
    });

    sql.JoinOnClause = sql.JoinClause.extend({
        instance: {
            /**@lends patio.sql.JoinOnClause.prototype*/
            /**
             * Represents an SQL JOIN clause with ON conditions. Created by {@link patio.Dataset} join methods.
             * See {@link patio.sql.JoinClause} for other argument parameters.
             * @constructs
             * @augments patio.sql.JoinClause
             *
             * @param on the expression to filter with. See {@link patio.Dataset#filter}
             * @property on <b>READ ONLY</b> the filter to use with joining the datasets.
             */
            constructor: function (on, joinType, table, tableAlias) {
                this.__on = on;
                this._super(arguments, [joinType, table, tableAlias]);
            },

            /**
             * Converts the {@link patio.sql.JoinOnClause} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.JoinOnClause}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.joinOnClauseSql(this);
            },

            /**@ignore*/
            getters: {
                on: function () {
                    return this.__on;
                }
            }
        }
    });

    sql.JoinUsingClause = sql.JoinClause.extend({
        instance: {
            /**@lends patio.sql.JoinUsingClause.prototype*/

            /**
             * Represents an SQL JOIN clause with USING conditions.
             * Created by {@link patio.Dataset} join methods.
             * See {@link patio.sql.JoinClause} for other argument parameters.
             *
             * @constructs
             * @augments patio.sql.JoinClause
             *
             * @param using the column/s to use when joining.
             * @property using <b>READ ONLY</b> the column/s to use when joining.
             */
            constructor: function (using, joinType, table, tableAlias) {
                this.__using = using.map(function (u) {
                    return isString(u) ? new sql.Identifier(u) : u;
                });
                this._super(arguments, [joinType, table, tableAlias]);
            },

            /**
             * Converts the {@link patio.sql.JoinUsingClause} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.JoinUsingClause}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.joinUsingClauseSql(this);
            },

            /**@ignore*/
            getters: {
                using: function () {
                    return this.__using;
                }
            }
        }
    });

    /**
     * Represents a json object that should be placed into a SQL query literally.
     * @constructs
     *
     * @name Json
     * @memberOf patio.sql
     */
    sql.Json = define({
        instance: {
            constructor: function (obj) {
                merge(this, obj);
            }
        }
    });


    /**
     * Represents a json array that should be placed into a SQL query literally.
     * @constructs
     *
     * @name JsonArray
     * @memberOf patio.sql
     */
    var id = 0;

    function JsonArray(arr) {
        if (!this instanceof JsonArray) {
            return new JsonArray(arr);
        }
        this.id = id++;
        Array.call(this);
        var i = -1, l = arr.length;
        while (++i < l) {
            this.push(arr[i]);
        }
    }

    /*jshint supernew:false*/
    JsonArray.prototype = [];
    JsonArray.prototype.toJSON = function () {
        return this.slice();
    };

    JsonArray.prototype.valueOf = function () {
        return this.slice();
    };
    sql.JsonArray = JsonArray;


    ["getDate", "getDay", "getFullYear", "getHours", "getMilliseconds", "getMinutes", "getMonth", "getSeconds",
        "getTime", "getTimezoneOffset", "getUTCDate", "getUTCDay", "getUTCFullYear", "getUTCHours", "getUTCMilliseconds",
        "getUTCMinutes", "getUTCMonth", "getUTCSeconds", "getYear", "parse", "setDate", "setFullYear", "setHours", "setMilliseconds",
        "setMinutes", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds",
        "setUTCMinutes", "setUTCMonth", "setUTCSeconds", "setYear", "toDateString", "toGMTString", "toLocaleDateString",
        "toLocaleTimeString", "toLocaleString", "toTimeString", "toUTCString", "UTC", "valueOf"
    ].forEach(function (op) {
            Year.prototype[op] = addDateMethod(op);
            Time.prototype[op] = addDateMethod(op);
            TimeStamp.prototype[op] = addDateMethod(op);
            DateTime.prototype[op] = addDateMethod(op);
        });

    ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "localeCompare", "match", "quote",
        "replace", "search", "slice", "split", "substr", "substring", "toLocaleLowerCase", "toLocaleUpperCase", "toLowerCase",
        "toSource", "toString", "toUpperCase", "trim", "trimLeft", "trimRight", "valueOf"
    ].forEach(function (op) {
            sql.LiteralString.prototype[op] = addStringMethod(op);
        });

    function addDateMethod(op) {
        return function () {
            return this.date[op].apply(this.date, arguments);
        };
    }

    function addStringMethod(op) {
        return function () {
            return this.__str[op].apply(this.__str, arguments);
        };
    }

};















