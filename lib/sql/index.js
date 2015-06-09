"use strict";
var comb = require("comb-proxy"),
    array = comb.array,
    flatten = array.flatten,
    ExpressionError = require("../errors").ExpressionError,
    methodMissing = comb.methodMissing,
    createFunctionWrapper = comb.createFunctionWrapper,
    isUndefined = comb.isUndefined,
    isUndefinedOrNull = comb.isUndefinedOrNull,
    isNull = comb.isNull,
    isInstanceOf = comb.isInstanceOf,
    argsToArray = comb.argsToArray,
    isDate = comb.isDate,
    isHash = comb.isHash,
    merge = comb.merge,
    isArray = comb.isArray,
    toArray = array.toArray,
    format = comb.string.format,
    isBoolean = comb.isBoolean,
    isNumber = comb.isNumber,
    isObject = comb.isObject,
    isString = comb.isString,
    define = comb.define,
    isRegExp = comb.isRegExp,
    Dataset, patio;


/**
 * @namespace  Collection of SQL related types, and expressions.
 *
 * <p>
 *  The {@link patio.sql} object
 *  can be used directly to create {@link patio.sql.Expression}s, {@link patio.sql.Identifier}s, {@link patio.sql.SQLFunction}s,
 *  and {@link patio.sql.QualifiedIdentifier}s.
 * <pre class='code'>
 *  var sql = patio.sql;
 *  //creating an identifier
 *  sql.a; //=> a;
 *
 *  //creating a qualified identifier
 *  sql.table__column; //table.column;
 *
 *  //BooleanExpression
 *  sql.a.lt(sql.b); //=> a < 'b';
 *
 *  //SQL Functions
 *  sql.sum(sql.a); //=> sum(a)
 *  sql.avg(sql.b); //=> avg(b)
 *  sql.a("b", 1); //=> a(b, 1)
 *  sql.myDatabasesObjectFunction(sql.a, sql.b, sql.c); //=> myDatabasesObjectFunction(a, b, c);
 *
 *  //combined
 *  sql.a.cast("boolean"); //=> 'CAST(a AS boolean)'
 *  sql.a.plus(sql.b).lt(sql.c.minus(3) //=> ((a + b) < (c - 3))
 *
 * </pre>
 *
 * This is useful when combined with dataset filtering
 *
 * <pre class="code">
 *  var ds = DB.from("t");
 *
 *  ds.filter({a:[sql.b, sql.c]}).sql;
 *      //=> SELECT * FROM t WHERE (a IN (b, c))
 *
 *  ds.select(sql["case"]({b:{c:1}}, false)).sql;
 *      //=> SELECT (CASE WHEN b THEN (c = 1) ELSE 'f' END) FROM t
 *
 *  ds.select(sql.a).qualifyToFirstSource().sql;
 *      //=>  SELECT a FROM t
 *
 *  ds.order(sql.a.desc(), sql.b.asc()).sql;
 *      //=>  SELECT * FROM t ORDER BY a DESC, b ASC
 *
 *  ds.select(sql.a.as("b")).sql;
 *      //=> SELECT a AS b FROM t
 *
 *  ds.filter(sql["case"]({a:sql.b}, sql.c, sql.d)).sql
 *      //=> SELECT * FROM t WHERE (CASE d WHEN a THEN b ELSE c END)
 *
 *  ds.filter(sql.a.cast("boolean")).sql;
 *      //=> SELECT * FROM t WHERE CAST(a AS boolean)
 *
 *  ds.filter(sql.a("b", 1)).sql
 *      //=> SELECT * FROM t WHERE a(b, 1)
 *  ds.filter(sql.a.plus(sql.b).lt(sql.c.minus(3)).sql;
 *      //=> SELECT * FROM t WHERE ((a + b) < (c - 3))
 *
 *  ds.filter(sql.a.sqlSubscript(sql.b, 3)).sql;
 *      //=> SELECT * FROM t WHERE a[b, 3]
 *
 *  ds.filter('? > ?', sql.a, 1).sql;
 *     //=> SELECT * FROM t WHERE (a > 1);
 *
 *  ds.filter('{a} > {b}', {a:sql.c, b:1}).sql;
 *      //=>SELECT * FROM t WHERE (c > 1)
 *
 *  ds.select(sql.literal("'a'"))
 *     .filter(sql.a(3))
 *     .filter('blah')
 *     .order(sql.literal(true))
 *     .group(sql.literal('a > ?', [1]))
 *     .having(false).sql;
 *      //=>"SELECT 'a' FROM t WHERE (a(3) AND (blah)) GROUP BY a > 1 HAVING 'f' ORDER BY true");
 </pre>
 *
 * </p>
 * @name sql
 * @memberOf patio
 */
var sql = {
    /**@lends patio.sql*/

    /**
     * Returns a {@link patio.sql.Identifier}, {@link patio.sql.QualifiedIdentifier},
     * or {@link patio.sql.ALiasedExpression} depending on the format of the string
     * passed in.
     *
     * <ul>
     *      <li>For columns : table__column___alias.</li>
     *      <li>For tables : schema__table___alias.</li>
     * </ul>
     * each portion of the identifier is optional. See example below
     *
     * @example
     *
     * patio.sql.identifier("a") //= > new patio.sql.Identifier("a");
     * patio.sql.identifier("table__column"); //=> new patio.sql.QualifiedIdentifier(table, column);
     * patio.sql.identifier("table__column___alias");
     *      //=> new patio.sql.AliasedExpression(new patio.sql.QualifiedIdentifier(table, column), alias);
     *
     * @param {String} name the name to covert to an an {@link patio.sql.Identifier}, {@link patio.sql.QualifiedIdentifier},
     * or {@link patio.sql.AliasedExpression}.
     *
     * @return  {patio.sql.Identifier|patio.sql.QualifiedIdentifier|patio.sql.AliasedExpression} an identifier generated based on the name string.
     */
    identifier: function (s) {
        return sql.stringToIdentifier(s);
    },

    /**
     * @see patio.sql.identifier
     */
    stringToIdentifier: function (name) {
        !Dataset && (Dataset = require("../dataset"));
        return new Dataset().stringToIdentifier(name);
    },

    /**
     * Creates a {@link patio.sql.LiteralString} or {@link patio.sql.PlaceHolderLiteralString}
     * depending on the arguments passed in. If a single string is passed in then
     * it is assumed to be a {@link patio.sql.LiteralString}. If more than one argument is
     * passed in then it is assumed to be a {@link patio.sql.PlaceHolderLiteralString}.
     *
     * @example
     *
     * //a literal string that will be placed in an SQL query with out quoting.
     * patio.sql.literal("a"); //=> new patio.sql.LiteralString('a');
     *
     * //a placeholder string that will have ? replaced with the {@link patio.Dataset#literal} version of
     * //the arugment and replaced in the string.
     * patio.sql.literal("a = ?", 1)  //=> a = 1
     * patio.sql.literal("a = ?", "b"); //=> a = 'b'
     * patio.sql.literal("a = {a} AND b = {b}", {a : 1, b : 2}); //=> a = 1 AND b = 2
     *
     * @param {String ...} s variable number of arguments where the first argument
     * is a string. If multiple arguments are passed it is a assumed to be a {@link patio.sql.PlaceHolderLiteralString}
     *
     * @return {patio.sql.LiteralString|patio.sql.PlaceHolderLiteralString} an expression that can be used as an argument
     * for {@link patio.Dataset} query methods.
     */
    literal: function (s) {
        var args = argsToArray(arguments);
        return args.length > 1 ? sql.PlaceHolderLiteralString.fromArgs(args) : new sql.LiteralString(s);
    },

    /**
     * Creates a {@link patio.sql.Json}
     * depending on the arguments passed in. If a single string is passed in then
     * it is assumed that it's a valid json string. If an objects passed in it will stringify
     * it.

     *
     * @param {String or Object ...} An object or string.
     *
     * @return {patio.sql.Json} an expression that can be used as an argument
     * for {@link patio.Dataset} query methods.
     */
    json: function (json) {
        var ret = json;
        if (!(isInstanceOf(ret, sql.Json, sql.JsonArray))) {
            if (isString(ret)) {
                ret = JSON.parse(ret);
            }
            if (isUndefinedOrNull(ret)) {
                ret = null;
            } else if (isArray(ret)) {
                ret = new sql.JsonArray(ret);
            } else if (isObject(ret)) {
                ret = new sql.Json(ret);
            } else {
                throw new ExpressionError("Invalid value for json " + ret);
            }
        }
        return ret;
    },

    /**
     * Returns a {@link patio.sql.CaseExpression}. See {@link patio.sql.CaseExpression} for argument types.
     *
     * @example
     *
     * sql["case"]({a:sql.b}, sql.c, sql.d); //=> (CASE t.d WHEN t.a THEN t.b ELSE t.c END)
     *
     */
    "case": function (hash, args) {
        args = argsToArray(arguments, 1);
        return sql.CaseExpression.fromArgs([hashToArray(hash)].concat(args));
    },

    /**
     * Creates a {@link patio.sql.StringExpression}
     *
     * Return a {@link patio.sql.StringExpression} representing an SQL string made up of the
     * concatenation of this array's elements.  If an joiner is passed
     * it is used in between each element of the array in the SQL
     * concatenation.
     *
     * @example
     *   patio.sql.sqlStringJoin(["a"]); //=> a
     *   //you can use sql.* as a shortcut to get an identifier
     *   patio.sql.sqlStringJoin([sql.identifier("a"), sql.b]);//=> a || b
     *   patio.sql.sqlStringJoin([sql.a, 'b']) # SQL: a || 'b'
     *   patio.sql.sqlStringJoin(['a', sql.b], ' '); //=> 'a' || ' ' || b
     */
    sqlStringJoin: function (arr, joiner) {
        joiner = joiner || null;
        var args;
        arr = arr.map(function (a) {
            return isInstanceOf(a, sql.Expression, sql.LiteralString, Boolean) || isNull(a) ? a : sql.stringToIdentifier(a);
        });
        if (joiner) {
            var newJoiner = [];
            for (var i = 0; i < arr.length; i++) {
                newJoiner.push(joiner);
            }
            args = array.flatten(array.zip(arr, newJoiner));
            args.pop();
        } else {
            args = arr;
        }
        args = args.map(function (a) {
            return isInstanceOf(a, sql.Expression, sql.LiteralString, Boolean) || isNull(a) ? a : "" + a;
        });
        return sql.StringExpression.fromArgs(["||"].concat(args));
    },

    get patio() {
        !patio && (patio = require("./index"));
        return patio;
    }
};

//require methods first as it is the base for expressions
require("./methods")(sql);
//next comes expressions as they are the base for types
require("./expressions")(sql);
//now require types.
require("./types")(sql);

exports.sql = methodMissing(sql, function (name) {
    return virtualRow(name);
});

function virtualRow(name) {
    var DOUBLE_UNDERSCORE = '__';

    var parts = name.split(DOUBLE_UNDERSCORE);
    var table = parts[0], column = parts[1];
    var ident = column ? sql.QualifiedIdentifier.fromArgs([table, column]) : sql.Identifier.fromArgs([name]);
    var prox = methodMissing(ident, function (m) {
        return function () {
            var args = argsToArray(arguments);
            return sql.SQLFunction.fromArgs([m, name].concat(args));
        };
    }, column ? sql.QualifiedIdentifier : sql.Identifier);
    var ret = createFunctionWrapper(prox, function () {
        var args = argsToArray(arguments);
        if (args.length) {
            return sql.SQLFunction.fromArgs([name].concat(args));
        } else {
            return prox;
        }
    }, function () {
        return sql.SQLFunction.fromArgs(arguments);
    });
    Object.setPrototypeOf(ret, ident);
    return ret;
}

function hashToArray(hash) {
    var ret = [];
    if (isHash(hash)) {
        for (var i in hash) {
            var k = sql.stringToIdentifier(i), v = hash[i];
            v = isHash(v) ? hashToArray(v) : v;
            ret.push([k, v]);
        }
    }
    return ret;
}





