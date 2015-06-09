/**
 * @ignore
 * @name patio.associations
 * @namespace
 * */
module.exports = {
    oneToMany: require("./oneToMany"),
    manyToOne: require("./manyToOne"),
    oneToOne: require("./oneToOne"),
    manyToMany: require("./manyToMany"),
    fetch: {
        LAZY: "lazy",
        EAGER: "eager"
    }
};

