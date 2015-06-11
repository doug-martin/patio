"use strict";
var p =  require("../../promise"),
    comb = require("comb"),
    isNull = comb.isNull,
    isUndefinedOrNull = comb.isUndefinedOrNull,
    _Association = require("./association");
/**
 * @class Class to define a many to one association.
 *
 * </br>
 * <b>NOT to be instantiated directly</b>
 * Its just documented for reference.
 *
 * @name ManyToOne
 * @augments patio.associations.Association
 * @memberOf patio.associations
 *
 * */
module.exports = _Association.extend({
    instance: {
        /**@lends patio.associations.ManyToOne.prototype*/

        _fetchMethod: "one",

        type: "manyToOne",

        isOwner: false,

        __checkAndSetAssociation: function (next, model) {
            var assoc,
                self = this;

            function handler() {
                var recip = self.model._findAssociation(self);
                if (recip) {
                    //set up our association
                    recip[1]._setAssociationKeys(assoc, model);
                }
            }

            if (this.associationLoaded(model) && !isUndefinedOrNull((assoc = this.getAssociation(model)))) {
                if (assoc.isNew) {
                    p.nodeify(assoc.save().then(handler, handler), next);
                } else {
                    next();
                }
            } else {
                this._clearAssociations(model);
                next();
            }
        },

        _preSave: function (next, model) {
            this.__checkAndSetAssociation(next, model);
        },

        _preUpdate: function (next, model) {
            this.__checkAndSetAssociation(next, model);
        },

        //override
        //@see _Association
        _postSave: function (next, model) {
            if (this.isEager() && !this.associationLoaded(model)) {
                p.nodeify(this.fetch(model), next);
            } else {
                next();
            }
        },

        //override
        //@see _Association
        _postLoad: function (next, model) {
            if (this.isEager() && !this.associationLoaded(model)) {
                p.nodeify(this.fetch(model), next);
            } else {
                next();
            }
        },

        //override
        //@see _Association
        _setter: function (val, model) {
            if (!isUndefinedOrNull(val)) {
                val = this._toModel(val);
                this.__setValue(model, val);
                if (!val.isNew) {
                    var recip = this.model._findAssociation(this);
                    if (recip) {
                        //set up our association
                        recip[1]._setAssociationKeys(val, model);
                    }
                }
            } else if (!model.isNew && isNull(val)) {
                this._getAssociationKey(model)[0].forEach(function (k) {
                    model[k] = null;
                });
            }
        }
    }
});
