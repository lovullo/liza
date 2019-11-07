"use strict";
/**
 * Mongo DB DAO for program server
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = require('events').EventEmitter;
/**
 * Uses MongoDB as a data store
 */
var MongoServerDao = /** @class */ (function (_super) {
    __extends(MongoServerDao, _super);
    /**
     * Initializes DAO
     *
     * @param {Mongo.Db} db mongo database connection
     */
    function MongoServerDao(_db) {
        var _this = _super.call(this) || this;
        _this._db = _db;
        /** Collection used to store quotes */
        _this.COLLECTION = 'quotes';
        /** Sequence (auto-increment) collection */
        _this.COLLECTION_SEQ = 'seq';
        /** Sequence key for quote ids */
        _this.SEQ_QUOTE_ID = 'quoteId';
        /** Sequence quoteId default */
        _this.SEQ_QUOTE_ID_DEFAULT = 200000;
        /** Whether the DAO is initialized and ready to be used */
        _this._ready = false;
        return _this;
    }
    /**
     * Initializes error events and attempts to connect to the database
     *
     * connectError event will be emitted on failure.
     *
     * @param Function callback function to call when connection is complete
     *                          (will not be called if connection fails)
     *
     * @return MongoServerDao self to allow for method chaining
     */
    MongoServerDao.prototype.init = function (callback) {
        var dao = this;
        // map db error event (on connection error) to our connectError event
        this._db.on('error', function (err) {
            dao._ready = false;
            dao._collection = null;
            dao.emit('connectError', err);
        });
        this.connect(callback);
        return this;
    };
    /**
     * Attempts to connect to the database
     *
     * connectError event will be emitted on failure.
     *
     * @param Function callback function to call when connection is complete
     *                          (will not be called if connection fails)
     *
     * @return MongoServerDao self to allow for method chaining
     */
    MongoServerDao.prototype.connect = function (callback) {
        var dao = this;
        // attempt to connect to the database
        this._db.open(function (err, db) {
            // if there was an error, don't bother with anything else
            if (err) {
                // in some circumstances, it may just be telling us that we're
                // already connected (even though the connection may have been
                // broken)
                if (err.errno !== undefined) {
                    dao.emit('connectError', err);
                    return;
                }
            }
            var ready_count = 0;
            var check_ready = function () {
                if (++ready_count < 2) {
                    return;
                }
                // we're ready to roll!
                dao._ready = true;
                dao.emit('ready');
                // connection was successful; call the callback
                if (callback instanceof Function) {
                    callback.call(dao);
                }
            };
            // quotes collection
            db.collection(dao.COLLECTION, function (_err, collection) {
                // for some reason this gets called more than once
                if (collection == null) {
                    return;
                }
                // initialize indexes
                collection.createIndex([['id', 1]], true, function (_err, _index) {
                    // mark the DAO as ready to be used
                    dao._collection = collection;
                    check_ready();
                });
            });
            // seq collection
            db.collection(dao.COLLECTION_SEQ, function (err, collection) {
                if (err) {
                    dao.emit('seqError', err);
                    return;
                }
                if (collection == null) {
                    return;
                }
                dao._seqCollection = collection;
                // has the sequence we'll be referencing been initialized?
                collection.find({ _id: dao.SEQ_QUOTE_ID }, { limit: 1 }, function (err, cursor) {
                    if (err) {
                        dao._initQuoteIdSeq(check_ready);
                        return;
                    }
                    cursor.toArray(function (_err, data) {
                        if (data.length == 0) {
                            dao._initQuoteIdSeq(check_ready);
                            return;
                        }
                        check_ready();
                    });
                });
            });
        });
        return this;
    };
    MongoServerDao.prototype._initQuoteIdSeq = function (callback) {
        var dao = this;
        this._seqCollection.insert({
            _id: this.SEQ_QUOTE_ID,
            val: this.SEQ_QUOTE_ID_DEFAULT,
        }, function (err, _docs) {
            if (err) {
                dao.emit('seqError', err);
                return;
            }
            dao.emit('seqInit', dao.SEQ_QUOTE_ID);
            callback.call(dao);
        });
    };
    /**
     * Saves a quote to the database
     *
     * A full save will include all metadata.  This should not cause any
     * problems with race conditions for pending Data API calls on meta
     * fields because those results write to individual indexes and do not
     * rely on existing data.
     *
     * @param Quote    quote            the quote to save
     * @param Function success_callback function to call on success
     * @param Function failure_callback function to call if save fails
     * @param Object   save_data        quote data to save (optional)
     * @param Object   push_data        quote data to push (optional)
     */
    MongoServerDao.prototype.saveQuote = function (quote, success_callback, failure_callback, save_data, push_data) {
        var dao = this;
        var meta = {};
        // if we're not ready, then we can't save the quote!
        if (this._ready === false) {
            this.emit('saveQuoteError', { message: 'Database server not ready' }, Error('Database not ready'), quote);
            failure_callback.call(this, quote);
            return dao;
        }
        if (save_data === undefined) {
            save_data = {
                data: quote.getBucket().getData(),
            };
            // full save will include all metadata
            meta = quote.getMetabucket().getData();
        }
        var id = quote.getId();
        // some data should always be saved because the quote will be created if
        // it does not yet exist
        save_data.id = id;
        save_data.pver = quote.getProgramVersion();
        save_data.importDirty = 1;
        save_data.lastPremDate = quote.getLastPremiumDate();
        save_data.initialRatedDate = quote.getRatedDate();
        save_data.explicitLock = quote.getExplicitLockReason();
        save_data.explicitLockStepId = quote.getExplicitLockStep();
        save_data.importedInd = +quote.isImported();
        save_data.boundInd = +quote.isBound();
        save_data.lastUpdate = Math.round((new Date()).getTime() / 1000);
        // meta will eventually take over for much of the above data
        meta.liza_timestamp_initial_rated = [quote.getRatedDate()];
        // save the stack so we can track this call via the oplog
        save_data._stack = (new Error()).stack;
        // avoid wiping out other metadata (since this may not be a full set)
        Object.keys(meta).forEach(function (key) { return save_data['meta.' + key] = meta[key]; });
        // do not push empty objects
        var document = (!push_data || !Object.keys(push_data).length)
            ? { '$set': save_data }
            : { '$set': save_data, '$push': push_data };
        // update the quote data if it already exists (same id), otherwise
        // insert it
        this._collection.update({ id: id }, document, 
        // create record if it does not yet exist
        { upsert: true }, 
        // on complete
        function (err, _docs) {
            // if an error occurred, then we cannot continue
            if (err) {
                dao.emit('saveQuoteError', err, quote);
                // let the caller handle the error
                if (failure_callback instanceof Function) {
                    failure_callback.call(dao, quote);
                }
                return;
            }
            // successful
            if (success_callback instanceof Function) {
                success_callback.call(dao, quote);
            }
        });
        return this;
    };
    /**
     * Merges quote data with the existing (rather than overwriting)
     *
     * @param {Quote}    quote     quote to save
     * @param {Object}   data      quote data
     * @param {Function} scallback successful callback
     * @param {Function} fcallback failure callback
     */
    MongoServerDao.prototype.mergeData = function (quote, data, scallback, fcallback) {
        // we do not want to alter the original data; use it as a prototype
        var update = data;
        // save the stack so we can track this call via the oplog
        var _self = this;
        this._collection.update({ id: quote.getId() }, { '$set': update }, {}, function (err, _docs) {
            if (err) {
                _self.emit('saveQuoteError', err, quote);
                if (typeof fcallback === 'function') {
                    fcallback(quote);
                }
                return;
            }
            if (typeof scallback === 'function') {
                scallback(quote);
            }
        });
        return this;
    };
    /**
     * Merges bucket data with the existing bucket (rather than overwriting the
     * entire bucket)
     *
     * @param {Quote}    quote     quote to save
     * @param {Object}   data      bucket data
     * @param {Function} scallback successful callback
     * @param {Function} fcallback failure callback
     *
     * @return {MongoServerDao} self
     */
    MongoServerDao.prototype.mergeBucket = function (quote, data, success, failure) {
        var update = {};
        for (var field in data) {
            if (!field) {
                continue;
            }
            update['data.' + field] = data[field];
        }
        return this.mergeData(quote, update, success, failure);
    };
    /**
     * Saves the quote state to the database
     *
     * The quote state includes the current step, the top visited step and the
     * explicit lock message.
     *
     * @param Quote    quote            the quote to save
     * @param Function success_callback function to call on success
     * @param Function failure_callback function to call if save fails
     *
     * @return MongoServerDao self
     */
    MongoServerDao.prototype.saveQuoteState = function (quote, success_callback, failure_callback) {
        var update = {
            currentStepId: quote.getCurrentStepId(),
            topVisitedStepId: quote.getTopVisitedStepId(),
            topSavedStepId: quote.getTopSavedStepId(),
        };
        return this.mergeData(quote, update, success_callback, failure_callback);
    };
    MongoServerDao.prototype.saveQuoteClasses = function (quote, classes, success, failure) {
        return this.mergeData(quote, { classData: classes }, success, failure);
    };
    /**
     * Save document metadata (meta field on document)
     *
     * Only the provided indexes will be modified (that is---data will be
     * merged with what is already in the database).
     *
     * @param {Quote}    quote    destination quote
     * @param {Object}   new_meta bucket-formatted data to write
     * @param {Function} success  callback on success
     * @param {Function} failure  callback on error
     *
     * @return {undefined}
     */
    MongoServerDao.prototype.saveQuoteMeta = function (quote, new_meta, success, failure) {
        var update = {};
        for (var key in new_meta) {
            var meta = new_meta[key];
            for (var i in meta) {
                update['meta.' + key + '.' + i] = new_meta[key][i];
            }
        }
        this.mergeData(quote, update, success, failure);
    };
    /**
     * Saves the quote lock state to the database
     *
     * @param Quote    quote            the quote to save
     * @param Function success_callback function to call on success
     * @param Function failure_callback function to call if save fails
     *
     * @return MongoServerDao self
     */
    MongoServerDao.prototype.saveQuoteLockState = function (quote, success_callback, failure_callback) {
        // lock state is saved by default
        return this.saveQuote(quote, success_callback, failure_callback, {});
    };
    /**
     * Pulls quote data from the database
     *
     * @param Integer          quote_id id of quote
     * @param Function( data ) callback function to call when data is available
     *
     * @return MongoServerDao self to allow for method chaining
     */
    MongoServerDao.prototype.pullQuote = function (quote_id, callback) {
        var dao = this;
        // XXX: TODO: Do not read whole of record into memory; filter out
        // revisions!
        this._collection.find({ id: quote_id }, { limit: 1 }, function (_err, cursor) {
            cursor.toArray(function (_err, data) {
                // was the quote found?
                if (data.length == 0) {
                    callback.call(dao, null);
                    return;
                }
                // return the quote data
                callback.call(dao, data[0]);
            });
        });
        return this;
    };
    MongoServerDao.prototype.getMinQuoteId = function (callback) {
        // just in case it's asynchronous later on
        callback.call(this, this.SEQ_QUOTE_ID_DEFAULT);
        return this;
    };
    MongoServerDao.prototype.getMaxQuoteId = function (callback) {
        var dao = this;
        this._seqCollection.find({ _id: this.SEQ_QUOTE_ID }, { limit: 1 }, function (_err, cursor) {
            cursor.toArray(function (_err, data) {
                if (data.length == 0) {
                    callback.call(dao, 0);
                    return;
                }
                // return the max quote id
                callback.call(dao, data[0].val);
            });
        });
    };
    MongoServerDao.prototype.getNextQuoteId = function (callback) {
        var dao = this;
        this._seqCollection.findAndModify({ _id: this.SEQ_QUOTE_ID }, [['val', 'descending']], { $inc: { val: 1 } }, { 'new': true }, function (err, doc) {
            if (err) {
                dao.emit('seqError', err);
                callback.call(dao, 0);
                return;
            }
            // return the new id
            callback.call(dao, doc.val);
        });
        return this;
    };
    /**
     * Create a new revision with the provided quote data
     *
     * The revision will contain the whole the quote. If space is a concern, we
     * can (in the future) calculate a delta instead (Mike recommends the Git
     * model of storing the deltas in previous revisions and the whole of the
     * bucket in the most recently created revision).
     */
    MongoServerDao.prototype.createRevision = function (quote, callback) {
        var _self = this, qid = quote.getId(), data = quote.getBucket().getData();
        this._collection.update({ id: qid }, { '$push': { revisions: { data: data } } }, 
        // create record if it does not yet exist
        { upsert: true }, 
        // on complete
        function (err) {
            if (err) {
                _self.emit('mkrevError', err);
            }
            callback(err);
            return;
        });
    };
    MongoServerDao.prototype.getRevision = function (quote, revid, callback) {
        revid = +revid;
        // XXX: TODO: Filter out all but the revision we want
        this._collection.find({ id: quote.getId() }, { limit: 1 }, function (_err, cursor) {
            cursor.toArray(function (_err, data) {
                // was the quote found?
                if ((data.length === 0)
                    || (data[0].revisions.length < (revid + 1))) {
                    callback(null);
                    return;
                }
                // return the quote data
                callback(data[0].revisions[revid]);
            });
        });
    };
    MongoServerDao.prototype.setWorksheets = function (qid, data, callback) {
        this._collection.update({ id: qid }, { '$set': { worksheets: { data: data } } }, 
        // create record if it does not yet exist
        { upsert: true }, 
        // on complete
        function (err) {
            callback(err);
            return;
        });
    };
    MongoServerDao.prototype.getWorksheet = function (qid, supplier, index, callback) {
        this._collection.find({ id: qid }, { limit: 1 }, function (_err, cursor) {
            cursor.toArray(function (_err, data) {
                // was the quote found?
                if ((data.length === 0)
                    || (!data[0].worksheets)
                    || (!data[0].worksheets.data)
                    || (!data[0].worksheets.data[supplier])) {
                    callback(null);
                    return;
                }
                // return the quote data
                callback(data[0].worksheets.data[supplier][index]);
            });
        });
    };
    return MongoServerDao;
}(EventEmitter));
exports.MongoServerDao = MongoServerDao;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9uZ29TZXJ2ZXJEYW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJNb25nb1NlcnZlckRhby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7Ozs7Ozs7Ozs7Ozs7OztBQVNILElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBRSxRQUFRLENBQUUsQ0FBQyxZQUFZLENBQUM7QUFJdEQ7O0dBRUc7QUFDSDtJQUFvQyxrQ0FBWTtJQXlCNUM7Ozs7T0FJRztJQUNILHdCQUNxQixHQUFRO1FBRDdCLFlBSUksaUJBQU8sU0FDVjtRQUpvQixTQUFHLEdBQUgsR0FBRyxDQUFLO1FBN0I3QixzQ0FBc0M7UUFDN0IsZ0JBQVUsR0FBVyxRQUFRLENBQUM7UUFFdkMsMkNBQTJDO1FBQ2xDLG9CQUFjLEdBQVcsS0FBSyxDQUFDO1FBRXhDLGlDQUFpQztRQUN4QixrQkFBWSxHQUFXLFNBQVMsQ0FBQztRQUUxQywrQkFBK0I7UUFDdEIsMEJBQW9CLEdBQVcsTUFBTSxDQUFDO1FBRy9DLDBEQUEwRDtRQUNsRCxZQUFNLEdBQVksS0FBSyxDQUFDOztJQW1CaEMsQ0FBQztJQUdEOzs7Ozs7Ozs7T0FTRztJQUNILDZCQUFJLEdBQUosVUFBTSxRQUFrQjtRQUVwQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7UUFFZixxRUFBcUU7UUFDckUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUUsT0FBTyxFQUFFLFVBQVUsR0FBUTtZQUVwQyxHQUFHLENBQUMsTUFBTSxHQUFRLEtBQUssQ0FBQztZQUN4QixHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QixHQUFHLENBQUMsSUFBSSxDQUFFLGNBQWMsRUFBRSxHQUFHLENBQUUsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDekIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUdEOzs7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