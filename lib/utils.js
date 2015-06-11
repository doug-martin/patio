"use strict";

module.exports = {
    pipeAll: pipeAll
};

function pipeAll(source, dest) {
    source.on("error", function (err) {
        dest.emit("error", err);
    });
    source.pipe(dest);
}

