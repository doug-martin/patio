module.exports = function (sql) {
    "use strict";
    var comb = require("comb-proxy"),
        array = comb.array,
        ExpressionError = require("../errors").ExpressionError,
        isUndefined = comb.isUndefined,
        isNull = comb.isNull,
        isInstanceOf = comb.isInstanceOf,
        argsToArray = comb.argsToArray,
        isHash = comb.isHash,
        merge = comb.merge,
        isArray = comb.isArray,
        toArray = array.toArray,
        format = comb.string.format,
        isBoolean = comb.isBoolean,
        isString = comb.isString,
        define = comb.define,
        isRegExp = comb.isRegExp,
        Dataset;


    var OPERTATOR_INVERSIONS = {
        AND: "OR",
        OR: "AND",
        GT: "lte",
        GTE: "lt",
        LT: "gte",
        LTE: "gt",
        EQ: "neq",
        NEQ: "eq",
        LIKE: 'NOT LIKE',
        "NOT LIKE": "LIKE",
        '!~*': '~*',
        '~*': '!~*',
        "~": '!~',
        "IN": 'NOTIN',
        "NOTIN": "IN",
        "IS": 'IS NOT',
        "ISNOT": "IS",
        NOT: "NOOP",
        NOOP: "NOT",
        ILIKE: 'NOT ILIKE',
        NOTILIKE: "ILIKE"
    };

    // Standard mathematical operators used in +NumericMethods+
    var MATHEMATICAL_OPERATORS = {PLUS: "+", MINUS: "-", DIVIDE: "/", MULTIPLY: "*"};

    // Bitwise mathematical operators used in +NumericMethods+
    var BITWISE_OPERATORS = {bitWiseAnd: "&", bitWiseOr: "|", exclusiveOr: "^", leftShift: "<<", rightShift: ">>"};


    var INEQUALITY_OPERATORS = {GT: ">", GTE: ">=", LT: "<", LTE: "<="};

    //Hash of ruby operator symbols to SQL operators, used in +BooleanMethods+
    var BOOLEAN_OPERATORS = {AND: "AND", OR: "OR"};

    //Operators that use IN/NOT IN for inclusion/exclusion
    var IN_OPERATORS = {IN: "IN", NOTIN: 'NOT IN'};

    //Operators that use IS, used for special casing to override literal true/false values
    var IS_OPERATORS = {IS: "IS", ISNOT: 'IS NOT'};

    //Operator symbols that take exactly two arguments
    var TWO_ARITY_OPERATORS = merge({
        EQ: '=',
        NEQ: '!=',
        LIKE: "LIKE",
        "NOT LIKE": 'NOT LIKE',
        ILIKE: "ILIKE",
        "NOT ILIKE": 'NOT ILIKE',
        "~": "~",
        '!~': "!~",
        '~*': "~*",
        '!~*': "!~*"
    }, INEQUALITY_OPERATORS, BITWISE_OPERATORS, IS_OPERATORS, IN_OPERATORS);

    //Operator symbols that take one or more arguments
    var N_ARITY_OPERATORS = merge({"||": "||"}, BOOLEAN_OPERATORS, MATHEMATICAL_OPERATORS);

    //Operator symbols that take only a single argument
    var ONE_ARITY_OPERATORS = {"NOT": "NOT", "NOOP": "NOOP"};


    /**
     * @class This is the parent of all expressions.
     *
     * @name Expression
     * @memberOf patio.sql
     */
    sql.Expression = define({

        instance: {
            /**@lends patio.sql.Expression.prototype*/

            /**
             * Returns the string representation of this expression
             *
             * @param {patio.Dataset} ds the dataset that will be used to SQL-ify this expression.
             * @return {String} a string literal version of this expression.
             */
            sqlLiteral: function (ds) {
                return this.toString(ds);
            }

        },

        "static": {
            /**@lends patio.sql.Expression*/

            /**
             * This is a helper method that will take in an array of arguments and return an expression.
             *
             * @example
             *
             * QualifiedIdentifier.fromArgs(["table", "column"]);
             *
             * @param {*[]} args array of arguments to pass into the constructor of the function.
             *
             * @return {patio.sql.Expression} an expression.
             */
            fromArgs: function (args) {
                var ret, Self = this;
                try {
                    ret = new Self();
                } catch (ignore) {
                }
                this.apply(ret, args);
                return ret;
            },

            /**
             * Helper to determine if something is a condition specifier. Returns true if the object
             * is a Hash or is an array of two element arrays.
             *
             * @example
             * Expression.isConditionSpecifier({a : "b"}); //=> true
             * Expression.isConditionSpecifier("a"); //=> false
             * Expression.isConditionSpecifier([["a", "b"], ["c", "d"]]); //=> true
             * Expression.isConditionSpecifier([["a", "b", "e"], ["c", "d"]]); //=> false
             *
             * @param {*} obj object to test if it is a condition specifier
             * @return {Boolean} true if the object is a Hash or is an array of two element arrays.
             */
            isConditionSpecifier: function (obj) {
                return isHash(obj) || (isArray(obj) && obj.length && obj.every(function (i) {
                        return isArray(i) && i.length === 2;
                    }));
            }
        }

    });

    /**
     * @class Base class for all GenericExpressions
     *
     * @augments patio.sql.Expression
     * @augments patio.sql.AliasMethods
     * @augments patio.sql.BooleanMethods
     * @augments patio.sql.CastMethods
     * @augments patio.sql.ComplexExpressionMethods
     * @augments patio.sql.InequalityMethods
     * @augments patio.sql.NumericMethods
     * @augments patio.sql.OrderedMethods
     * @augments patio.sql.StringMethods
     * @augments patio.sql.SubscriptMethods
     *
     * @name GenericExpression
     * @memberOf patio.sql
     */
    var GenericExpression = sql.GenericExpression = define([
        sql.Expression,
        sql.AliasMethods,
        sql.BooleanMethods,
        sql.CastMethods,
        sql.ComplexExpressionMethods,
        sql.InequalityMethods,
        sql.NumericMethods,
        sql.OrderedMethods,
        sql.StringMethods,
        sql.SubscriptMethods
    ]);


    sql.AliasedExpression = sql.Expression.extend({
        instance: {
            /**@lends patio.sql.AliasedExpression.prototype*/

            /**
             * This class reperesents an Aliased Expression
             *
             * @constructs
             * @augments patio.sql.Expression
             *
             * @param expression  the expression to alias.
             * @param alias the alias to alias the expression to.
             *
             * @property expression the expression being aliased
             * @property alias the alias of the expression
             *
             */
            constructor: function (expression, alias) {
                this.expression = expression;
                this.alias = alias;
            },

            /**
             * Converts the aliased expression to a string
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL alias fragment.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.aliasedExpressionSql(this);
            }
        }
    });


    sql.CaseExpression = GenericExpression.extend({
        instance: {
            /**@lends patio.sql.CaseExpression.prototype*/

            /**
             * Create an object with the given conditions and
             * default value.  An expression can be provided to
             * test each condition against, instead of having
             * all conditions represent their own boolean expression.
             *
             * @constructs
             * @augments patio.sql.GenericExpression
             * @param {Array|Object} conditions conditions to create the case expression from
             * @param def default value
             * @param expression expression to create the CASE expression from
             *
             * @property {Boolean} hasExpression returns true if this case expression has a expression
             * @property conditions the conditions of the {@link patio.sql.CaseExpression}.
             * @property def the default value of the {@link patio.sql.CaseExpression}.
             * @property expression the expression of the {@link patio.sql.CaseExpression}.
             * @property {Boolean} noExpression true if this {@link patio.sql.CaseExpression}'s expression is undefined.
             */
            constructor: function (conditions, def, expression) {
                if (sql.Expression.isConditionSpecifier(conditions)) {
                    this.conditions = toArray(conditions);
                    this.def = def;
                    this.expression = expression;
                    this.noExpression = isUndefined(expression);
                }
            },

            /**
             * Converts the case expression to a string
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL case expression fragment.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.caseExpressionSql(this);
            },

            /**@ignore*/
            getters: {
                /**@ignore*/
                hasExpression: function () {
                    return !this.noExpression;
                }
            }
        }
    });


    var ComplexExpression = sql.ComplexExpression = define([sql.Expression, sql.AliasMethods, sql.CastMethods, sql.OrderedMethods, sql.SubscriptMethods], {
        instance: {
            /**@lends patio.sql.ComplexExpression.prototype*/

            /**
             * Represents a complex SQL expression, with a given operator and one
             * or more attributes (which may also be ComplexExpressions, forming
             * a tree).
             *
             * This is an abstract class that is not that useful by itself.  The
             * subclasses @link patio.sql.BooleanExpression},
             * {@link patio.sql.NumericExpression} and {@link patio.sql.StringExpression} should
             * be used instead of this class directly.
             *
             * @constructs
             * @augments patio.sql.Expression
             * @augments patio.sql.AliasMethods
             * @augments patio.sql.CastMethods
             * @augments patio.sql.OrderedMethods
             * @augments patio.sql.SubscriptMethods
             *
             * @throws {patio.sql.ExpressionError} if the operator doesn't allow boolean input and a boolean argument is given.
             * @throws {patio.sql.ExpressionError} if the wrong number of arguments for a given operator is used.
             *
             * @param {...} op The operator and arguments for this object to the ones given.
             * <p>
             *     Convert all args that are hashes or arrays of two element arrays to {@link patio.sql.BooleanExpression}s,
             *          other than the second arg for an IN/NOT IN operator.</li>
             * </p>
             */
            constructor: function (op) {
                if (op) {
                    var args = argsToArray(arguments, 1);
                    //make a copy of the args
                    var origArgs = args.slice(0);
                    args.forEach(function (a, i) {
                        if (sql.Expression.isConditionSpecifier(a)) {
                            args[i] = sql.BooleanExpression.fromValuePairs(a);
                        }
                    });
                    op = op.toUpperCase();

                    if (N_ARITY_OPERATORS.hasOwnProperty(op)) {
                        if (args.length < 1) {
                            throw new ExpressionError("The " + op + " operator requires at least 1 argument");
                        }
                        var oldArgs = args.slice(0);
                        args = [];
                        oldArgs.forEach(function (a) {
                            a instanceof ComplexExpression && a.op === op ? args = args.concat(a.args) : args.push(a);
                        });

                    } else if (TWO_ARITY_OPERATORS.hasOwnProperty(op)) {
                        if (args.length !== 2) {
                            throw new ExpressionError("The " + op + " operator requires precisely 2 arguments");
                        }
                        //With IN/NOT IN, even if the second argument is an array of two element arrays,
                        //don't convert it into a boolean expression, since it's definitely being used
                        //as a value list.
                        if (IN_OPERATORS[op]) {
                            args[1] = origArgs[1];
                        }
                    } else if (ONE_ARITY_OPERATORS.hasOwnProperty(op)) {
                        if (args.length !== 1) {
                            throw new ExpressionError("The " + op + " operator requires only one argument");
                        }
                    } else {
                        throw new ExpressionError("Invalid operator " + op);
                    }
                    this.op = op;
                    this.args = args;
                }
            },

            /**
             * Converts the ComplexExpression to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.ComplexExpression}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.complexExpressionSql(this.op, this.args);
            }
        },

        "static": {
            /**@lends patio.sql.ComplexExpression*/

            /**
             * Hash of operator inversions
             * @type Object
             * @default {
         *      AND:"OR",
         *      OR:"AND",
         *      GT:"lte",
         *      GTE:"lt",
         *      LT:"gte",
         *      LTE:"gt",
         *      EQ:"neq",
         *      NEQ:"eq",
         *      LIKE:'NOT LIKE',
         *      "NOT LIKE":"LIKE",
         *      '!~*':'~*',
         *      '~*':'!~*',
         *      "~":'!~',
         *      "IN":'NOTIN',
         *      "NOTIN":"IN",
         *      "IS":'IS NOT',
         *      "ISNOT":"IS",
         *      NOT:"NOOP",
         *      NOOP:"NOT",
         *      ILIKE:'NOT ILIKE',
         *      NOTILIKE:"ILIKE"
         * }
             */
            OPERATOR_INVERSIONS: OPERTATOR_INVERSIONS,

            /**
             * Default mathematical operators.
             *
             * @type Object
             * @default {PLUS:"+", MINUS:"-", DIVIDE:"/", MULTIPLY:"*"}
             */
            MATHEMATICAL_OPERATORS: MATHEMATICAL_OPERATORS,

            /**
             * Default bitwise operators.
             *
             * @type Object
             * @default {bitWiseAnd:"&", bitWiseOr:"|", exclusiveOr:"^", leftShift:"<<", rightShift:">>"}
             */
            BITWISE_OPERATORS: BITWISE_OPERATORS,
            /**
             * Default inequality operators.
             *
             * @type Object
             * @default {GT:">",GTE:">=",LT:"<",LTE:"<="}
             */
            INEQUALITY_OPERATORS: INEQUALITY_OPERATORS,

            /**
             * Default boolean operators.
             *
             * @type Object
             * @default {AND:"AND",OR:"OR"}
             */
            BOOLEAN_OPERATORS: BOOLEAN_OPERATORS,

            /**
             * Default IN operators.
             *
             * @type Object
             * @default {IN:"IN",NOTIN:'NOT IN'}
             */
            IN_OPERATORS: IN_OPERATORS,
            /**
             * Default IS operators.
             *
             * @type Object
             * @default {IS:"IS", ISNOT:'IS NOT'}
             */
            IS_OPERATORS: IS_OPERATORS,
            /**
             * Default two arity operators.
             *
             * @type Object
             * @default {
         *      EQ:'=',
         *      NEQ:'!=', LIKE:"LIKE",
         *      "NOT LIKE":'NOT LIKE',
         *      ILIKE:"ILIKE",
         *      "NOT ILIKE":'NOT ILIKE',
         *      "~":"~",
         *      '!~':"!~",
         *      '~*':"~*",
         *      '!~*':"!~*",
         *      GT:">",
         *      GTE:">=",
         *      LT:"<",
         *      LTE:"<=",
         *      bitWiseAnd:"&",
         *      bitWiseOr:"|",
         *      exclusiveOr:"^",
         *      leftShift:"<<",
         *      rightShift:">>",
         *      IS:"IS",
         *      ISNOT:'IS NOT',
         *      IN:"IN",
         *      NOTIN:'NOT IN'
         *  }
             */
            TWO_ARITY_OPERATORS: TWO_ARITY_OPERATORS,

            /**
             * Default N(multi) arity operators.
             *
             * @type Object
             * @default {
         *      "||":"||",
         *      AND:"AND",
         *      OR:"OR",
         *      PLUS:"+",
         *      MINUS:"-",
         *      DIVIDE:"/", MULTIPLY:"*"
         * }
             */
            N_ARITY_OPERATORS: N_ARITY_OPERATORS,

            /**
             * Default ONE operators.
             *
             * @type Object
             * @default {
         *      "NOT":"NOT",
         *      "NOOP":"NOOP"
         *  }
             */
            ONE_ARITY_OPERATORS: ONE_ARITY_OPERATORS
        }
    });


    /**
     * @class Subclass of {@link patio.sql.ComplexExpression} where the expression results
     * in a boolean value in SQL.
     *
     * @augments patio.sql.ComplexExpression
     * @augments patio.sql.BooleanMethods
     * @name BooleanExpression
     * @memberOf patio.sql
     */
    sql.BooleanExpression = define([ComplexExpression, sql.BooleanMethods], {
        "static": {
            /**@lends patio.sql.BooleanExpression*/

            /**
             * Invert the expression, if possible.  If the expression cannot
             * be inverted, it throws an {@link patio.error.ExpressionError}.  An inverted expression should match
             * everything that the uninverted expression did not match, and vice-versa, except for possible issues with
             * SQL NULL (i.e. 1 == NULL is NULL and 1 != NULL is also NULL).
             *
             * @example
             *   BooleanExpression.invert(sql.a) //=> NOT "a"
             *
             * @param {patio.sql.BooleanExpression} expression
             * the expression to invert.
             *
             * @return {patio.sql.BooleanExpression} the inverted expression.
             */
            invert: function (expression) {
                if (isInstanceOf(expression, sql.BooleanExpression)) {
                    var op = expression.op, newArgs;
                    if (op === "AND" || op === "OR") {
                        newArgs = [OPERTATOR_INVERSIONS[op]].concat(expression.args.map(function (arg) {
                            return sql.BooleanExpression.invert(arg);
                        }));
                        return sql.BooleanExpression.fromArgs(newArgs);
                    } else {
                        newArgs = [OPERTATOR_INVERSIONS[op]].concat(expression.args);
                        return sql.BooleanExpression.fromArgs(newArgs);
                    }
                } else if (isInstanceOf(expression, sql.StringExpression) || isInstanceOf(expression, sql.NumericExpression)) {
                    throw new ExpressionError(format("Cannot invert %4j", [expression]));
                } else {
                    return new sql.BooleanExpression("NOT", expression);
                }
            },
            /**
             * Take pairs of values (e.g. a hash or array of two element arrays)
             * and converts it to a {@link patio.sql.BooleanExpression}.  The operator and args
             * used depends on the case of the right (2nd) argument:
             *
             * <pre class='code'>
             * BooleanExpression.fromValuePairs({a : [1,2,3]}) //=> a IN (1,2,3)
             * BooleanExpression.fromValuePairs({a : true}); // a IS TRUE;
             * BooleanExpression.fromValuePairs({a : /^A/i}); // a *~ '^A'
             * </pre>
             *
             * If multiple arguments are given, they are joined with the op given (AND
             * by default, OR possible).  If negate is set to true,
             * all subexpressions are inverted before used.
             * <pre class='code'>
             * BooleanExpression.fromValuePairs({a : [1,2,3], b : true}) //=> a IN (1,2,3) AND b IS TRUE
             * BooleanExpression.fromValuePairs({a : [1,2,3], b : true}, "OR") //=> a IN (1,2,3) OR b IS TRUE
             * BooleanExpression.fromValuePairs({a : [1,2,3], b : true}, "OR", true) //=> a NOT IN (1,2,3) AND b IS NOT TRUE
             * </pre>
             * @param {Object} a object to convert to a {@link patio.sql.BooleanExpression}
             * @param {String} [op="AND"] Boolean operator to join each subexpression with.
             * <pre class="code">
             *     BooleanExpression.fromValuePairs({a : [1,2,3], b : true}, "OR") //=> a IN (1,2,3) OR b IS TRUE
             * </pre>
             * @param {Boolean} [negate=false] set to try to invert the {@link patio.sql.BooleanExpression}.
             * <pre class="code">
             * BooleanExpression.fromValuePairs({a : [1,2,3], b : true}, "OR", true) //=> a NOT IN (1,2,3) AND b IS NOT TRUE
             * </pre>
             * @return {patio.sql.BooleanExpression} expression composed of sub expressions built from the hash.
             */
            fromValuePairs: function (a, op, negate) {
                !Dataset && (Dataset = require("../dataset"));
                op = op || "AND", negate = negate || false;
                var pairArr = [];
                var isArr = isArray(a) && sql.Expression.isConditionSpecifier(a);
                if (isHash(a)) {
                    pairArr.push(this.__filterObject(a, null, op));
                } else {
                    for (var k in a) {
                        var v = isArr ? a[k][1] : a[k], ret;
                        k = isArr ? a[k][0] : k;
                        if (isArray(v) || isInstanceOf(v, Dataset)) {
                            k = isArray(k) ? k.map(sql.stringToIdentifier) : sql.stringToIdentifier(k);
                            ret = new sql.BooleanExpression("IN", k, v);
                        } else if (isInstanceOf(v, sql.NegativeBooleanConstant)) {
                            ret = new sql.BooleanExpression("ISNOT", k, v.constant);
                        } else if (isInstanceOf(v, sql.BooleanConstant)) {
                            ret = new sql.BooleanExpression("IS", k, v.constant);
                        } else if (isNull(v) || isBoolean(v)) {
                            ret = new sql.BooleanExpression("IS", k, v);
                        } else if (isHash(v)) {
                            ret = sql.BooleanExpression.__filterObject(v, k, op);
                        } else if (isRegExp(v)) {
                            ret = sql.StringExpression.like(sql.stringToIdentifier(k), v);
                        } else {
                            ret = new sql.BooleanExpression("EQ", sql.stringToIdentifier(k), v);
                        }
                        negate && (ret = sql.BooleanExpression.invert(ret));
                        pairArr.push(ret);
                    }
                }
                //if We just have one then return the first otherwise create a new Boolean expression
                return pairArr.length === 1 ? pairArr[0] : sql.BooleanExpression.fromArgs([op].concat(pairArr));
            },

            /**
             * @private
             *
             * This builds an expression from a hash
             *
             * @example
             *
             *  Dataset._filterObject({a : 1}) //=> WHERE (a = 1)
             *  Dataset._filterObject({x : {gt : 1}}) //=> WHERE (x > 1)
             *  Dataset._filterObject({x : {gt : 1}, a : 1}) //=> WHERE ((x > 1) AND (a = 1))
             *  Dataset._filterObject({x : {like : "name"}}) //=> WHERE (x LIKE 'name')
             *  Dataset._filterObject({x : {iLike : "name"}}) //=> WHERE (x LIKE 'name')
             *  Dataset._filterObject({x : {between : [1,10]}}) //=> WHERE ((x >= 1) AND (x <= 10))
             *  Dataset._filterObject({x : {notBetween : [1,10]}}) //=> WHERE ((x < 1) OR (x > 10))
             *  Dataset._filterObject({x : {neq : 1}}) //=> WHERE (x != 1)
             *
             * @param {Object} expr the expression we need to create an expression out of
             * @param {String} [key=null] the key that the hash corresponds to
             *
             * @return {patio.sql.Expression} an expression to use in the filter
             */
            __filterObject: function (expr, key, op) {
                /*jshint loopfunc:true*/
                var pairs = [], opts, newKey;
                var twoArityOperators = this.TWO_ARITY_OPERATORS;
                for (var k in expr) {
                    var v = expr[k];
                    if (isHash(v)) { //its a hash too filter it too!
                        pairs.push(this.__filterObject(v, k, op));
                    } else if (key && (twoArityOperators[k.toUpperCase()] || k.match(/between/i))) {
                        //its a two arrity operator (e.g. '=', '>')
                        newKey = isString(key) ? key.split(",") : [key];
                        if (newKey.length > 1) {
                            //this represents a hash where the key represents two columns
                            //(e.g. {"col1,col2" : 1}) => WHERE (col1 = 1 AND col2 = 1)
                            pairs = pairs.concat(newKey.map(function (k) {
                                //filter each column with the expression
                                return this.__filterObject(expr, k, op);
                            }, this));
                        } else {
                            newKey = [sql.stringToIdentifier(newKey[0])];
                            if (k.match(/^like$/)) {
                                //its a like clause {col : {like : "hello"}}

                                pairs.push(sql.StringExpression.like.apply(sql.StringExpression, (newKey.concat(isArray(v) ? v : [v]))));
                            } else if (k.match(/^iLike$/)) {
                                //its a like clause {col : {iLike : "hello"}}
                                pairs.push(sql.StringExpression.like.apply(sql.StringExpression, (newKey.concat(isArray(v) ? v : [v]).concat({caseInsensitive: true}))));
                            } else if (k.match(/between/i)) {
                                //its a like clause {col : {between : [1,10]}}
                                var between = sql.stringToIdentifier(newKey[0]).between(v);
                                k === "notBetween" && (between = between.not());
                                pairs.push(between);
                            } else {
                                //otherwise is just a boolean expressio
                                //it its not a valid operator then we
                                //BooleanExpression with throw an error
                                pairs.push(new sql.BooleanExpression(k, newKey[0], v));
                            }
                        }
                    } else {
                        //we're not a twoarity operator
                        //so we create a boolean expression out of it
                        newKey = k.split(",");
                        if (newKey.length === 1) {
                            newKey = sql.stringToIdentifier(newKey[0]);
                        }
                        opts = [
                            [newKey, v]
                        ];
                        pairs.push(sql.BooleanExpression.fromValuePairs(opts));
                    }
                }
                //if the total of pairs is one then we just return the first element
                //otherwise we join them all with an AND
                return pairs.length === 1 ? pairs[0] : sql.BooleanExpression.fromArgs([op || "AND"].concat(pairs));
            }
        }
    });

    /**
     * @class Subclass of {@link patio.sql.ComplexExpression} where the expression results
     * in a numeric value in SQL.
     *
     * @name NumericExpression
     * @memberOf patio.sql
     * @augments patio.sql.ComplexExpression
     * @augments patio.sql.BitWiseMethods
     * @augments patio.sql.NumericMethods
     * @augments patio.sql.InequalityMethods
     */
    sql.NumericExpression = define([ComplexExpression, sql.BitWiseMethods, sql.NumericMethods, sql.InequalityMethods]);


    sql.OrderedExpression = sql.Expression.extend({
        instance: {
            /**@lends patio.sql.OrderedExpression.prototype*/

            /**
             * Represents a column/expression to order the result set by.
             * @constructs
             * @augments patio.sql.Expression
             *
             * @param expression the expression to order
             * @param {Boolean}[descending=true] set to false to order ASC
             * @param {String|Object} [opts=null] additional options
             * <ul>
             *     <li>String: if value is "first" the null values will be first, if "last" then null values
             *     will be last</li>
             *     <li>Object: will pull the nulls property off of the object use use the same rules as if it
             *     were a string</li>
             * </ul>
             * @property expression <b>READ ONLY</b> the expression to order.
             * @property {Boolean} [descending=true] <b>READ ONLY</b> true if decending, false otherwise.
             * @property {String} [nulls=null] if value is "first" the null values will be first, if "last" then null values
             *     will be last
             */
            constructor: function (expression, descending, opts) {
                descending = isBoolean(descending) ? descending : true;
                opts = opts || {};
                this.__expression = expression;
                this.__descending = descending;
                var nulls = isString(opts) ? opts : opts.nulls;
                this.__nulls = isString(nulls) ? nulls.toLowerCase() : null;
            },

            /**
             * @return {patio.sql.OrderedExpression} a copy that is ordered ASC
             */
            asc: function () {
                return new sql.OrderedExpression(this.__expression, false, {nulls: this.__nulls});
            },

            /**
             * @return {patio.sql.OrderedExpression} Return a copy that is ordered DESC
             */
            desc: function () {
                return new sql.OrderedExpression(this.__expression, true, {nulls: this.__nulls});
            },

            /**
             * * @return {patio.sql.OrderedExpression} an inverted expression, changing ASC to DESC and NULLS FIRST to NULLS LAST.
             * */
            invert: function () {
                return new sql.OrderedExpression(this.__expression, !this.__descending, {nulls: this._static.INVERT_NULLS[this.__nulls] || this.__nulls});
            },

            /**
             * Converts the {@link patio.sql.OrderedExpression} to a string.
             *
             * @param {patio.Dataset} [ds] dataset used to created the SQL fragment, if
             * the dataset is ommited then the default {@link patio.Dataset} implementation is used.
             *
             * @return String the SQL version of the {@link patio.sql.OrderedExpression}.
             */
            toString: function (ds) {
                !Dataset && (Dataset = require("../dataset"));
                ds = ds || new Dataset();
                return ds.orderedExpressionSql(this);
            },

            /**@ignore*/
            getters: {
                expression: function () {
                    return this.__expression;
                },
                descending: function () {
                    return this.__descending;
                },
                nulls: function () {
                    return this.__nulls;
                }
            }
        },
        "static": {
            /**@lends patio.sql.OrderedExpression*/
            /**
             * Hash that contains the inversions for "first" and "last".
             * @type Object
             * @default {first:"last", last:"first"}
             */
            INVERT_NULLS: {first: "last", last: "first"}
        }
    });

    /**
     * @class Subclass of {@link patio.sql.ComplexExpression} where the expression results
     * in a text/string/varchar value in SQL.
     *
     * @augments patio.sql.ComplexExpression
     * @augments patio.sql.StringMethods
     * @augments patio.sql.StringConcatenationMethods
     * @augments patio.sql.InequalityMethods
     * @augments patio.sql.NoBooleanInputMethods
     * @name StringExpression
     * @memberOf patio.sql
     */
    sql.StringExpression = define([ComplexExpression, sql.StringMethods, sql.StringConcatenationMethods, sql.InequalityMethods, sql.NoBooleanInputMethods], {
        "static": {
            /**@lends patio.sql.StringExpression*/

            /**
             * <p>Creates a SQL pattern match expression. left (l) is the SQL string we
             * are matching against, and ces are the patterns we are matching.
             * The match succeeds if any of the patterns match (SQL OR).</p>
             *
             * <p>If a regular expression is used as a pattern, an SQL regular expression will be
             * used, which is currently only supported on MySQL and PostgreSQL.  Be aware
             * that MySQL and PostgreSQL regular expression syntax is similar to javascript
             * regular expression syntax, but it not exactly the same, especially for
             * advanced regular expression features.  Patio just uses the source of the
             * regular expression verbatim as the SQL regular expression string.</p>
             *
             * <p>If any other object is used as a regular expression, the SQL LIKE operator will
             * be used, and should be supported by most databases.</p>
             *
             * <p>The pattern match will be case insensitive if the last argument is a hash
             * with a key of caseInsensitive that is not false or null. Also,
             * if a case insensitive regular expression is used (//i), that particular
             * pattern which will always be case insensitive.</p>
             *
             * @example
             *   StringExpression.like(sql.a, 'a%') //=> "a" LIKE 'a%'
             *   StringExpression.like(sql.a, 'a%', {caseInsensitive : true}) //=> "a" ILIKE 'a%'
             *   StringExpression.like(sql.a, 'a%', /^a/i) //=> "a" LIKE 'a%' OR "a" ~* '^a'
             */
            like: function (l) {
                var args = argsToArray(arguments, 1);
                var params = likeElement(l);
                var likeMap = this.likeMap;
                var lre = params[1], lci = params[2];
                var last = args[args.length - 1];
                lci = (isHash(last) ? args.pop() : {})["caseInsensitive"] ? true : lci;
                args = args.map(function (ce) {
                    var r, rre, rci;
                    var ceArr = likeElement(ce);
                    r = ceArr[0], rre = ceArr[1], rci = ceArr[2];
                    return new sql.BooleanExpression(likeMap["" + (lre || rre) + (lci || rci)], l, r);
                }, this);
                return args.length === 1 ? args[0] : sql.BooleanExpression.fromArgs(["OR"].concat(args));
            },

            /**
             * Like map used to by {@link patio.sql.StringExpression.like} to create the
             * LIKE expression.
             * @type Object
             */
            likeMap: {"truetrue": '~*', "truefalse": "~", "falsetrue": "ILIKE", "falsefalse": "LIKE"}


        }
    });

    function likeElement(re) {
        var ret;
        if (isRegExp(re)) {
            ret = [("" + re).replace(/^\/|\/$|\/[i|m|g]*$/g, ""), true, re.ignoreCase];
        } else {
            ret = [re, false, false];
        }
        return ret;
    }

};

