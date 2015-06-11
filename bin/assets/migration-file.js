"use strict";

module.exports = {
    up: up,
    down: down
};

function up(db) {
    //put logic to apply migration in here
    return Promise.reject(new Error("Up migration not implemented"));

}

function down(db) {
    //put logic to remove migration in here
    return Promise.resolve(new Error("Down migration not implemented"));
}