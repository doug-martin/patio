module.exports = function (sql) {
    "use strict";
    var comb = require("comb-proxy"),
        array = comb.array,
        flatten = array.flatten,
        ExpressionError = require("../errors").ExpressionError,
        isNull = comb.isNull,
        isInstanceOf = comb.isInstanceOf,
        argsToArray = comb.argsToArray,
        isHash = comb.isHash,
        isArray = comb.isArray,
        isBoolean = comb.isBoolean,
        isObject = comb.isObject,
        define = comb.define,
        Dataset;

    /**
     * @class Mixin to provide alias methods to an expression.
     *
     * @name AliasMethods
     * @memberOf patio.sql
     */
    sql.AliasMethods = define(null, {
        instance: {
            /**@lends patio.sql.AliasMethods.prototype*/

            /**
             *  Create an SQL alias {@link patio.sql.AliasedExpression} of the receiving column or expression
             *  to the given alias.
             *
             * @example
             *
             *  sql.identifier("column").as("alias");
             *      //=> "column" AS "alias"
             *
             * @param {String} alias the alias to assign to the expression.
             *
             * @return {patio.sql.AliasedExpression} the aliased expression.
             */
            as: function (alias) {
                return new sql.AliasedExpression(this, alias);
            }

        }
    });

    /**
     * @class Defines the bitwise methods: bitWiseAnd, bitWiseOr, exclusiveOr, leftShift, and rightShift.  These
     * methods are only on {@link patio.sql.NumericExpression}
     *
     * @example
     *   sql.a.sqlNumber.bitWiseAnd("b"); //=> "a" & "b"
     *   sql.a.sqlNumber.bitWiseOr("b") //=> "a" | "b"
     *   sql.a.sqlNumber.exclusiveOr("b") //=> "a" ^ "b"
     *   sql.a.sqlNumber.leftShift("b") // "a" << "b"
     *   sql.a.sqlNumber.rightShift("b") //=> "a" >> "b"
     *
     * @name BitWiseMethods
     * @memberOf patio.sql
     */
    sql.BitWiseMethods = define(null, {
        instance: {
            /**@lends patio.sql.BitWiseMethods.prototype*/

            /**
             * Bitwise and
             *
             * @example
             * sql.a.sqlNumber.bitWiseAnd("b"); //=> "a" & "b"
             */
            bitWiseAnd: bitWiseMethod("bitWiseAnd"),

            /**
             * Bitwise or
             *
             * @example
             * sql.a.sqlNumber.bitWiseOr("b") //=> "a" | "b"
             */
            bitWiseOr: bitWiseMethod("bitWiseOr"),

            /**
             * Exclusive Or
             *
             * @example
             *
             * sql.a.sqlNumber.exclusiveOr("b") //=> "a" ^ "b"
             */
            exclusiveOr: bitWiseMethod("exclusiveOr"),

            /**
             *  Bitwise shift left
             *
             *  @example
             *
             *  sql.a.sqlNumber.leftShift("b") // "a" << "b"
             */
            leftShift: bitWiseMethod("leftShift"),

            /**
             * Bitwise shift right
             *
             * @example
             *
             * sql.a.sqlNumber.rightShift("b") //=> "a" >> "b"
             */
            rightShift: bitWiseMethod("rightShift")
        }
    });

    /**
     * @class Defines boolean/logical AND (&), OR (|) and NOT (~) operators
     * that are defined on objects that can be used in a boolean context in SQL
     * ({@link patio.sql.LiteralString}, and {@link patio.sql.GenericExpression}).
     *
     * @example
     * sql.a.and(sql.b) //=> "a" AND "b"
     * sql.a.or(sql.b) //=> "a" OR "b"
     * sql.a.not() //=> NOT "a"
     *
     * @name BooleanMethods
     * @memberOf patio.sql
     */
    sql.BooleanMethods = define({
        instance: {
            /**@lends patio.sql.BooleanMethods.prototype*/

            /**
             *
             * @function
             * Logical AND
             *
             * @example
             *
             * sql.a.and(sql.b) //=> "a" AND "b"
             *
             * @return {patio.sql.BooleanExpression} a ANDed boolean expression.
             */
            and: booleanMethod("and"),

            /**
             * @function
             * Logical OR
             *
             * @example
             *
             * sql.a.or(sql.b) //=> "a" OR "b"
             *
             * @return {patio.sql.BooleanExpression} a ORed boolean expression
             */
            or: booleanMethod("or"),

            /**
             * Logical NOT
             *
             * @example
             *
             * sql.a.not() //=> NOT "a"
             *
             * @return {patio.sql.BooleanExpression} a inverted boolean expression.
             */
            not: function () {
                return sql.BooleanExpression.invert(this);
            }

        }
    });

    /**
     * @class Defines case methods
     *
     * @name CastMethods
     * @memberOf patio.sql
     */
    sql.CastMethods = define({
        instance: {
            /**@lends patio.sql.CastMethods.prototype*/
            /**
             * Cast the reciever to the given SQL type.
             *
             * @example
             *
             * sql.a.cast("integer") //=> CAST(a AS integer)
             * sql.a.cast(String) //=> CAST(a AS varchar(255))
             *
             * @return {patio.sql.Cast} the casted expression
             */
            cast: function (type) {
                return new sql.Cast(this, type);
            },

            /**
             * Cast the reciever to the given SQL type (or the database's default Number type if none given.
             *
             * @example
             *
             * sql.a.castNumeric() //=> CAST(a AS integer)
             * sql.a.castNumeric("double") //=> CAST(a AS double precision)
             *
             * @param type the numeric type to cast to
             *
             * @return {patio.sql.NumericExpression} a casted numberic expression
             */
            castNumeric: function (type) {
                return this.cast(type || "integer").sqlNumber;
            },

            /**
             * Cast the reciever to the given SQL type (or the database's default String type if none given),
             * and return the result as a {@link patio.sql.StringExpression}.
             *
             * @example
             *
             *  sql.a.castString() //=> CAST(a AS varchar(255))
             *  sql.a.castString("text") //=> CAST(a AS text)
             * @param type the string type to cast to
             *
             * @return {patio.sql.StringExpression} the casted string expression
             */
            castString: function (type) {
                return this.cast(type || String).sqlString;
            }
        }
    });


    /**
     * @class Provides methods to assist in assigning a SQL type to
     * particular types, i.e. Boolean, Function, Number or String.
     *
     * @name ComplexExpressionMethods
     * @memberOf patio.sql
     * @property {patio.sql.BooleanExpression} sqlBoolean Return a {@link patio.sql.BooleanExpression} representation of this expression type.
     * @property {patio.sql.BooleanExpression} sqlFunction Return a {@link patio.sql.SQLFunction} representation of this expression type.
     * @property {patio.sql.BooleanExpression} sqlNumber Return a {@link patio.sql.NumericExpression} representation of this expression type.
     * <pre class="code">
     * sql.a.not("a") //=> NOT "a"
     * sql.a.sqlNumber.not() //=> ~"a"
     * </pre>
     * @property {patio.sql.BooleanExpression} sqlString  Return a {@link patio.sql.StringExpression} representation of this expression type.
     * <pre class="code">
     * sql.a.plus(sql.b); //=> "a" + "b"
     * sql.a.sqlString.concat(sql.b) //=> "a" || "b"
     * </pre>
     */
    sql.ComplexExpressionMethods = define({
        instance: {
            /**@ignore*/
            getters: {

                /**
                 * @ignore
                 */
                sqlBoolean: function () {
                    return new sql.BooleanExpression("noop", this);
                },


                /**
                 * @ignore
                 */
                sqlFunction: function () {
                    return new sql.SQLFunction(this);
                },


                /**
                 * @ignore
                 */
                sqlNumber: function () {
                    return new sql.NumericExpression("noop", this);
                },

                /**
                 * @ignore
                 */
                sqlString: function () {
                    return new sql.StringExpression("noop", this);
                }
            }
        }
    });

    /**
     * @class This mixin includes the inequality methods (>, <, >=, <=) that are defined on objects that can be
     * used in a numeric or string context in SQL.
     *
     * @example
     * sql.a.gt("b")  //=> a > "b"
     * sql.a.lt("b")  //=> a > "b"
     * sql.a.gte("b") //=> a >= "b"
     * sql.a.lte("b") //=> a <= "b"
     * sql.a.eq("b") //=> a = "b"
     *
     * @name InequalityMethods
     * @memberOf patio.sql
     */
    sql.InequalityMethods = define({
        instance: {
            /**@lends patio.sql.InequalityMethods.prototype*/

            /**
             * @function Creates a gt {@link patio.sql.BooleanExpression} compared to this expression.
             * @example
             *
             * sql.a.gt("b")  //=> a > "b"
             *
             * @return {patio.sql.BooleanExpression}
             */
            gt: inequalityMethod("gt"),
            /**
             * @function Creates a gte {@link patio.sql.BooleanExpression} compared to this expression.
             *
             * @example
             *
             * sql.a.gte("b")  //=> a >= "b"
             *
             * @return {patio.sql.BooleanExpression}
             */
            gte: inequalityMethod("gte"),
            /**
             * @function Creates a lt {@link patio.sql.BooleanExpression} compared to this expression.
             *
             * @example
             *
             * sql.a.lt("b")  //=> a < "b"
             *
             * @return {patio.sql.BooleanExpression}
             */
            lt: inequalityMethod("lt"),
            /**
             * @function  Creates a lte {@link patio.sql.BooleanExpression} compared to this expression.
             *
             * @example
             *
             * sql.a.lte("b")  //=> a <= "b"
             *
             * @return {patio.sql.BooleanExpression}
             */
            lte: inequalityMethod("lte"),
            /**
             * @function  Creates a eq {@link patio.sql.BooleanExpression} compared to this expression.
             *
             * @example
             *
             * sql.a.eq("b")  //=> a = "b"
             *
             * @return {patio.sql.BooleanExpression}
             */
            eq: inequalityMethod("eq"),

            neq: inequalityMethod("neq"),

            /**
             * @private
             *
             * Creates a boolean expression where the key is '>=' value 1 and '<=' value two.
             *
             * @example
             *
             * sql.x.between([1,2]) => //=> WHERE ((x >= 1) AND (x <= 10))
             * sql.x.between([1,2]).invert() => //=> WHERE ((x < 1) OR (x > 10))
             *
             * @param {Object} items a two element array where the first element it the item to be gte and the second item lte.
             *
             * @return {patio.sql.BooleanExpression} a boolean expression containing the between expression.
             */
            between: function (items) {
                return new sql.BooleanExpression("AND", new sql.BooleanExpression("gte", this, items[0]), new sql.BooleanExpression("lte", this, items[1]));
            }
        }
    });

    /**
     * @class This mixin augments the default constructor for {@link patio.sql.ComplexExpression},
     * so that attempting to use boolean input when initializing a {@link patio.sql.NumericExpression}
     * or {@link patio.sql.StringExpression} results in an error. <b>It is not expected to be used directly.</b>
     *
     * @name NoBooleanInputMethods
     * @memberOf patio.sql
     */
    sql.NoBooleanInputMethods = define({
        instance: {
            constructor: function (op) {
                var args = argsToArray(arguments, 1);
                args.forEach(function (expression) {
                    if ((isInstanceOf(expression, sql.BooleanExpression)) ||
                        isBoolean(expression) ||
                        isNull(expression) ||
                        (isObject(expression) && !isInstanceOf(expression, sql.Expression, Dataset, sql.LiteralString)) ||
                        isArray(expression)) {
                        throw new ExpressionError("Cannot apply " + op + " to a boolean expression");
                    }
                });
                this._super(arguments);
            }
        }
    });

    /**
     * @class This mixin includes the standard mathematical methods (+, -, *, and /)
     * that are defined on objects that can be used in a numeric context in SQL.
     *
     * @example
     * sql.a.plus(sql.b) //=> "a" + "b"
     * sql.a.minus(sql.b) //=> "a" - "b"
     * sql.a.multiply(sql.b) //=> "a" * "b"
     * sql.a.divide(sql.b) //=> "a" / "b"
     *
     * @name NumericMethods
     * @memberOf patio.sql
     */
    sql.NumericMethods = define({
        instance: {
            /**@lends patio.sql.NumericMethods.prototype*/


            /**
             * @function  Adds the provided expression to this expression and returns a {@link patio.sql.NumericExpression}.
             *
             * @example
             *
             * sql.a.plus(sql.b)  //=> "a" + "b"
             *
             * @return {patio.sql.NumericExpression}
             */
            plus: numericMethod("plus"),

            /**
             * @function  Subtracts the provided expression from this expression and returns a {@link patio.sql.NumericExpression}.
             *
             * @example
             *
             * sql.a.minus(sql.b)  //=> "a" - "b"
             *
             * @return {patio.sql.NumericExpression}
             */
            minus: numericMethod("minus"),

            /**
             * @function  Divides this expression by the  provided expression and returns a {@link patio.sql.NumericExpression}.
             *
             * @example
             *
             * sql.a.divide(sql.b)  //=> "a" / "b"
             *
             * @return {patio.sql.NumericExpression}
             */
            divide: numericMethod("divide"),

            /**
             * @function  Divides this expression by the  provided expression and returns a {@link patio.sql.NumericExpression}.
             *
             * @example
             *
             * sql.a.multiply(sql.b)  //=> "a" * "b"
             *
             * @return {patio.sql.NumericExpression}
             */
            multiply: numericMethod("multiply")
        }
    });


    /**
     * @class This mixin provides ordering methods ("asc", "desc") to expression.
     *
     * @example
     *
     * sql.name.asc(); //=> name ASC
     * sql.price.desc(); //=> price DESC
     * sql.name.asc({nulls:"last"}); //=> name ASC NULLS LAST
     * sql.price.desc({nulls:"first"}); //=> price DESC NULLS FIRST
     *
     * @name OrderedMethods
     * @memberOf patio.sql
     */
    sql.OrderedMethods = define({
        instance: {
            /**@lends patio.sql.OrderedMethods.prototype*/

            /**
             * Mark the receiving SQL column as sorting in an ascending fashion (generally a no-op).
             *
             * @example
             * sql.name.asc(); //=> name ASC
             * sql.name.asc({nulls:"last"}); //=> name ASC NULLS LAST
             *
             * @param {Object} [options] options to use when sorting
             * @param {String} [options.nulls = null] Set to "first" to use NULLS FIRST (so NULL values are ordered
             *           before other values), or "last" to use NULLS LAST (so NULL values are ordered after other values).
             * @return {patio.sql.OrderedExpression}
             */
            asc: function (options) {
                return new sql.OrderedExpression(this, false, options);
            },

            /**
             * Mark the receiving SQL column as sorting in a descending fashion.
             * @example
             *
             * sql.price.desc(); //=> price DESC
             * sql.price.desc({nulls:"first"}); //=> price DESC NULLS FIRST
             *
             * @param {Object} [options] options to use when sorting
             * @param {String} [options.nulls = null] Set to "first" to use NULLS FIRST (so NULL values are ordered
             *           before other values), or "last" to use NULLS LAST (so NULL values are ordered after other values).
             * @return {patio.sql.OrderedExpression}
             */
            desc: function (options) {
                return new sql.OrderedExpression(this, true, options);
            }
        }
    });


    /**
     * @class This mixin provides methods related to qualifying expression.
     *
     * @example
     *
     * sql.column.qualify("table") //=> "table"."column"
     * sql.table.qualify("schema") //=> "schema"."table"
     * sql.column.qualify("table").qualify("schema") //=> "schema"."table"."column"
     *
     * @name QualifyingMethods
     * @memberOf patio.sql
     */
    sql.QualifyingMethods = define({
        instance: {
            /**@lends patio.sql.QualifyingMethods.prototype*/

            /**
             * Qualify the receiver with the given qualifier (table for column/schema for table).
             *
             * @example
             * sql.column.qualify("table") //=> "table"."column"
             * sql.table.qualify("schema") //=> "schema"."table"
             * sql.column.qualify("table").qualify("schema") //=> "schema"."table"."column"
             *
             * @param {String|patio.sql.Identifier} qualifier table/schema to qualify this expression to.
             *
             * @return {patio.sql.QualifiedIdentifier}
             */
            qualify: function (qualifier) {
                return new sql.QualifiedIdentifier(qualifier, this);
            },

            /**
             * Use to create a .* expression.
             *
             * @example
             * sql.table.all() //=> "table".*
             * sql.table.qualify("schema").all() //=> "schema"."table".*
             *
             *
             * @return {patio.sql.ColumnAll}
             */
            all: function () {
                return new sql.ColumnAll(this);
            }


        }
    });


    /**
     * @class This mixin provides SQL string methods such as (like and iLike).
     *
     * @example
     *
     * sql.a.like("A%"); //=> "a" LIKE 'A%'
     * sql.a.iLike("A%"); //=> "a" LIKE 'A%'
     * sql.a.like(/^a/); //=>  "a" ~* '^a'
     *
     * @name StringMethods
     * @memberOf patio.sql
     */
    sql.StringMethods = define({
        instance: {
            /**@lends patio.sql.StringMethods.prototype*/

            /**
             * Create a {@link patio.sql.BooleanExpression} case insensitive pattern match of the receiver
             * with the given patterns.  See {@link patio.sql.StringExpression#like}.
             *
             * @example
             * sql.a.iLike("A%"); //=> "a" LIKE 'A%'
             *
             * @return {patio.sql.BooleanExpression}
             */
            ilike: function (expression) {
                expression = argsToArray(arguments);
                return sql.StringExpression.like.apply(sql.StringExpression, [this].concat(expression).concat([
                    {caseInsensitive: true}
                ]));
            },

            /**
             * Create a {@link patio.sql.BooleanExpression} case sensitive (if the database supports it) pattern match of the receiver with
             * the given patterns.  See {@link patio.sql.StringExpression#like}.
             *
             * @example
             * sql.a.like(/^a/); //=>  "a" ~* '^a'
             * sql.a.like("A%"); //=> "a" LIKE 'A%'
             *
             * @param expression
             */
            like: function (expression) {
                expression = argsToArray(arguments);
                return sql.StringExpression.like.apply(sql.StringExpression, [this].concat(expression));
            }
        }
    });

    /**
     * @class This mixin provides string concatenation methods ("concat");
     *
     * @example
     *
     * sql.x.sqlString.concat("y"); //=> "x" || "y"
     *
     * @name StringConcatenationMethods
     * @memberOf patio.sql
     */
    sql.StringConcatenationMethods = define({
        instance: {
            /**@lends patio.sql.StringConcatenationMethods.prototype*/

            /**
             * Return a {@link patio.sql.StringExpression} representing the concatenation of this expression
             * with the given argument.
             *
             * @example
             *
             * sql.x.sqlString.concat("y"); //=> "x" || "y"
             *
             * @param expression expression to concatenate this expression with.
             */
            concat: function (expression) {
                return new sql.StringExpression("||", this, expression);
            }
        }
    });

    /**
     * @class This mixin provides the ability to access elements within a SQL array.
     *
     * @example
     * sql.array.sqlSubscript(1) //=> array[1]
     * sql.array.sqlSubscript(1, 2) //=> array[1, 2]
     * sql.array.sqlSubscript([1, 2]) //=> array[1, 2]
     *
     * @name SubscriptMethods
     * @memberOf patio.sql
     */
    sql.SubscriptMethods = define({
        instance: {

            /**
             * Return a {@link patio.sql.Subscript} with the given arguments, representing an
             * SQL array access.
             *
             * @example
             * sql.array.sqlSubscript(1) //=> array[1]
             * sql.array.sqlSubscript(1, 2) //=> array[1, 2]
             * sql.array.sqlSubscript([1, 2]) //=> array[1, 2]
             *
             * @param subscript
             */
            sqlSubscript: function (subscript) {
                subscript = argsToArray(arguments);
                return new sql.SubScript(this, flatten(subscript));
            }
        }
    });

    function bitWiseMethod(op) {
        return function (expression) {
            if (isInstanceOf(expression, sql.StringExpression) || isInstanceOf(expression, sql.BooleanExpression)) {
                throw new ExpressionError("Cannot apply " + op + " to a non numeric expression");
            }
            else {
                return new sql.BooleanExpression(op, this, expression);
            }
        };
    }

    function booleanMethod(op) {
        return function (expression) {
            if (isInstanceOf(expression, sql.StringExpression) || isInstanceOf(expression, sql.NumericExpression)) {
                throw new ExpressionError("Cannot apply " + op + " to a non boolean expression");
            }
            else {
                return new sql.BooleanExpression(op, this, expression);
            }
        };
    }

    function inequalityMethod(op) {
        return function (expression) {
            if (isInstanceOf(expression, sql.BooleanExpression) ||
                isBoolean(expression) ||
                isNull(expression) ||
                (isHash(expression)) ||
                isArray(expression)) {
                throw new ExpressionError("Cannot apply " + op + " to a boolean expression");
            } else {
                return new sql.BooleanExpression(op, this, expression);
            }
        };
    }

    function numericMethod(op) {
        return function (expression) {
            if (isInstanceOf(expression, sql.BooleanExpression, sql.StringExpression)) {
                throw new ExpressionError("Cannot apply " + op + " to a non numeric expression");
            } else {
                return new sql.NumericExpression(op, this, expression);
            }
        };
    }
};













