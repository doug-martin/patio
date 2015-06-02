"use strict";
var comb = require("comb"),
    isFunction = comb.isFunction,
    Queue = comb.collections.Queue,
    merge = comb.merge,
    define = comb.define,
    Pool = comb.collections.Pool;

module.exports = Pool.extend({

    instance: {
        /**@lends patio.ConnectionPool.prototype*/

        /**
         * ConnectionPool object used internall by the {@link patio.Database} class;
         * @constructs;
         * @param options
         */
        constructor: function (options) {
            options = options || {};
            if (!options.createConnection || !isFunction(options.createConnection)) {
                throw new Error("patio.adapters.clients.ConnectionPool : create connection CB required.");
            }
            if (!options.closeConnection || !isFunction(options.closeConnection)) {
                throw new Error("patio.adapters.clients.ConnectionPool : close connection CB required.");
            }
            options.minObjects = parseInt(options.minConnections || 0, 10);
            options.maxObjects = parseInt(options.maxConnections || 10, 10);
            this.__deferredQueue = new Queue();
            this._options = options;
            this.__createConnectionCB = options.createConnection;
            this.__closeConnectionCB = options.closeConnection;
            this.__validateConnectionCB = options.validateConnection;
            this._super(arguments);
        },

        /**
         * Checks all deferred connection requests.
         */
        __checkQueries: function () {
            var fc = this.freeCount, def, defQueue = this.__deferredQueue;
            while (fc-- >= 0 && defQueue.count) {
                def = defQueue.dequeue();
                var conn = this.getObject();
                if (conn) {
                    def.resolve(conn);
                } else {
                    throw new Error("UNEXPECTED ERROR");
                }
                fc--;
            }
        },

        /**
         * Performs a query on one of the connection in this Pool.
         *
         * @return {comb.Promise} A promise to called back with a connection.
         */
        getConnection: function () {
            var self = this;
            return new Promise(function (resolve, reject) {
                var conn,
                    ret = {resolve: resolve, reject: reject};
                if (self.count > self.__maxObjects) {
                    self.__deferredQueue.enqueue(ret);
                } else {
                    //todo override getObject to make async so creating a connetion can execute setup sql
                    conn = self.getObject();
                    if (!conn) {
                        //we need to deffer it
                        self.__deferredQueue.enqueue(ret);
                    } else {
                        resolve(conn);
                    }
                }
                if (self.count > self.__maxObjects && !conn) {
                    reject(new Error("Unexpected ConnectionPool error"));
                }
            });
        },

        /**
         * Override comb.collections.Pool to allow async validation to allow
         * pools to do any calls to reset a connection if it needs to be done.
         *
         * @param {*} connection the connection to return.
         *
         */
        returnObject: function (obj) {
            var self = this;
            this.validate(obj).then(function (valid) {
                var index;
                if (self.count <= self.__maxObjects && valid && (index = self.__inUseObjects.indexOf(obj)) > -1) {
                    self.__inUseObjects.splice(index, 1);
                    self.__freeObjects.enqueue(obj);
                    self.__checkQueries();
                } else {
                    self.removeObject(obj);
                }
            });
        },

        /**
         * Removes a connection from the pool.
         * @param conn
         */
        removeConnection: function (conn) {
            this.closeConnection(conn);
            return this.removeObject(conn);
        },

        /**
         * Return a connection to the pool.
         *
         * @param {*} connection the connection to return.
         *
         * @return {*} an adapter specific connection.
         */
        returnConnection: function (connection) {
            this.returnObject(connection);
        },

        createObject: function () {
            return this.createConnection();
        },

        /**
         * Override to implement the closing of all connections.
         *
         * @return {comb.Promise} called when all connections are closed.
         */
        endAll: function () {
            this.__ending = true;
            var conn, fQueue = this.__freeObjects, ps = [];
            while ((conn = fQueue.dequeue()) !== undefined) {
                ps.push(this.closeConnection(conn));
            }
            var inUse = this.__inUseObjects;
            for (var i = inUse.length - 1; i >= 0; i--) {
                ps.push(this.closeConnection(inUse[i]));
            }
            this.__inUseObjects.length = 0;
            return Promise.all(ps);
        },


        /**
         * Override to provide any additional validation. By default the promise is called back with true.
         *
         * @param {*} connection the conneciton to validate.
         *
         * @return {Promise} called back with a valid or invalid state.
         */
        validate: function (conn) {
            if (!this.__validateConnectionCB) {
                return Promise.resolve(true);
            } else {
                return this.__validateConnectionCB(conn);
            }
        },

        /**
         * Override to create connections to insert into this ConnectionPool.
         */
        createConnection: function () {
            return this.__createConnectionCB(this._options);
        },

        /**
         * Override to implement close connection functionality;
         * @param {*} conn the connection to close;
         *
         * @return {comb.Promise} called back when the connection is closed.
         */
        closeConnection: function (conn) {
            return this.__closeConnectionCB(conn);
        }
    },

    "static": {
        /**@lends patio.ConnectionPool*/

        getPool: function (opts, createConnection, closeConnection, validateConnection) {
            var Self = this;
            return new Self(merge(opts, {
                createConnection: createConnection,
                closeConnection: closeConnection,
                validateConnection: validateConnection
            }));
        }
    }
});