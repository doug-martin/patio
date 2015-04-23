"use strict";

var comb = require("comb"),
    Hive = require("hive-cache"),
    hive;

/**
 * @class Adds in memory caching support for models.
 *
 * @example
 *
 * var MyModel = patio.addModel("testTable", {
 *     plugins : [patio.plugins.CachePlugin];
 * });
 *
 * //NOW IT WILL CACHE
 *
 * @name CachePlugin
 * @memberOf patio.plugins
 */
module.exports = comb.define({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.post("load", this._postLoad);
            this._static.initHive();
        },

        reload: function () {
            var self = this;
            return this._super(arguments).then(function (m) {
                hive.replace((self.tableName.toString() + self.primaryKeyValue.toString()), m);
                return m;
            });
        },

        _postLoad: function (next) {
            hive.replace(this.tableName + this.primaryKeyValue, this);
            next();
        },

        update: function () {
            var self = this;
            return this._super(arguments).then(function (val) {
                hive.remove(self.tableName + self.primaryKeyValue, val);
                return val;
            });
        },

        remove: function () {
            hive.remove(this.tableName + this.primaryKeyValue);
            return this._super(arguments);
        }
    },

    static: {
        initHive: function () {
            if (!hive) {
                hive = new Hive();
            }
            this.cache = hive;
        },

        findById: function (id) {
            var cached = hive.get(this.tableName + id);
            if (!cached) {
                return this._super(arguments);
            } else {
                return Promise.resolve(cached);
            }
        }
    }
});