/**
 * Mongo DB DAO for program server
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( 'events' ).EventEmitter,
    ServerDao    = require( './ServerDao' ).ServerDao;


/**
 * Uses MongoDB as a data store
 */
module.exports = Class( 'MongoServerDao' )
    .implement( ServerDao )
    .extend( EventEmitter,
{
    /**
     * Collection used to store quotes
     * @type String
     */
    'const COLLECTION': 'quotes',

    /**
     * Sequence (auto-increment) collection
     * @type {string}
     */
    'const COLLECTION_SEQ': 'seq',

    /**
     * Sequence key for quote ids
     *
     * @type {string}
     * @const
     */
    'const SEQ_QUOTE_ID': 'quoteId',

    /**
     * Sequence quoteId default
     *
     * @type {number}
     * @const
     */
    'const SEQ_QUOTE_ID_DEFAULT': 200000,


    /**
     * Database instance
     * @type Mongo.Db
     */
    'private _db': null,

    /**
     * Whether the DAO is initialized and ready to be used
     * @type Boolean
     */
    'private _ready': false,

    /**
     * Collection to save data to
     * @type null|Collection
     */
    'private _collection': null,

    /**
     * Collection to read sequences (auto-increments) from
     * @type {null|Collection}
     */
    'private _seqCollection': null,


    /**
     * Initializes DAO
     *
     * @param {Mongo.Db} db mongo database connection
     *
     * @return undefined
     */
    'public __construct': function( db )
    {
        this._db = db;
    },


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
    'public init': function( callback )
    {
        var dao = this;

        // map db error event (on connection error) to our connectError event
        this._db.on( 'error', function( err )
        {
            dao._ready      = false;
            dao._collection = null;

            dao.emit( 'connectError', err );
        });

        this.connect( callback );
        return this;
    },


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
    'public connect': function( callback )
    {
        var dao = this;

        // attempt to connect to the database
        this._db.open( function( err, db )
        {
            // if there was an error, don't bother with anything else
            if ( err )
            {
                // in some circumstances, it may just be telling us that we're
                // already connected (even though the connection may have been
                // broken)
                if ( err.errno !== undefined )
                {
                    dao.emit( 'connectError', err );
                    return;
                }
            }

            var ready_count = 0;
            var check_ready = function()
            {
                if ( ++ready_count < 2 )
                {
                    return;
                }

                // we're ready to roll!
                dao._ready = true;
                dao.emit( 'ready' );

                // connection was successful; call the callback
                if ( callback instanceof Function )
                {
                    callback.call( dao );
                }
            }

            // quotes collection
            db.collection( dao.__self.$('COLLECTION'), function( err, collection )
            {
                // for some reason this gets called more than once
                if ( collection == null )
                {
                    return;
                }

                // initialize indexes
                collection.createIndex(
                    [ ['id', 1] ],
                    true,
                    function( err, index )
                    {
                        // mark the DAO as ready to be used
                        dao._collection = collection;
                        check_ready();
                    }
                );
            });

            // seq collection
            db.collection( dao.__self.$('COLLECTION_SEQ'), function( err, collection )
            {
                if ( err )
                {
                    dao.emit( 'seqError', err );
                    return;
                }

                if ( collection == null )
                {
                    return;
                }

                dao._seqCollection = collection;

                // has the sequence we'll be referencing been initialized?
                collection.find(
                    { _id: dao.__self.$('SEQ_QUOTE_ID') },
                    { limit: 1 },
                    function( err, cursor )
                    {
                        if ( err )
                        {
                            dao.initQuoteIdSeq( check_ready )
                            return;
                        }

                        cursor.toArray( function( err, data )
                        {
                            if ( data.length == 0 )
                            {
                                dao.initQuoteIdSeq( check_ready );
                                return;
                            }

                            check_ready();
                        });
                    }
                );
            });
        });

        return this;
    },


    'public initQuoteIdSeq': function( callback )
    {
        var dao = this;

        this._seqCollection.insert(
            {
                _id: this.__self.$('SEQ_QUOTE_ID'),
                val: this.__self.$('SEQ_QUOTE_ID_DEFAULT'),
            },
            function( err, docs )
            {
                if ( err )
                {
                    dao.emit( 'seqError', err );
                    return;
                }

                dao.emit( 'seqInit', this.__self.$('SEQ_QUOTE_ID') );
                callback.call( this );
            }
        );
    },


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
     *
     * @return MongoServerDao self to allow for method chaining
     */
    'public saveQuote': function(
        quote, success_callback, failure_callback, save_data
    )
    {
        var dao = this;

        // if we're not ready, then we can't save the quote!
        if ( this._ready === false )
        {
            this.emit( 'saveQuoteError',
                { message: 'Database server not ready' },
                Error( 'Database not ready' ),
                quote
            );

            failure_callback.call( this, quote );
            return;
        }

        if ( save_data === undefined )
        {
            save_data = {
                data: quote.getBucket().getData(),
            };

            // full save will include all metadata
            save_data.meta = quote.getMetabucket().getData();
        }
        else if ( save_data.data !== undefined )
        {
            // when we update the quote data, clear quick save data (this data
            // should take precedence)
            save_data.quicksave = {};
        }

        var id = quote.getId();

        // some data should always be saved because the quote will be created if
        // it does not yet exist
        save_data.id                 = id;
        save_data.pver               = quote.getProgramVersion();
        save_data.importDirty        = 1;
        save_data.lastPremDate       = quote.getLastPremiumDate();
        save_data.initialRatedDate   = quote.getRatedDate();
        save_data.explicitLock       = quote.getExplicitLockReason();
        save_data.explicitLockStepId = quote.getExplicitLockStep();
        save_data.importedInd        = +quote.isImported();
        save_data.boundInd           = +quote.isBound();
        save_data.lastUpdate         = Math.round(
            ( new Date() ).getTime() / 1000
        );

        // save the stack so we can track this call via the oplog
        save_data._stack = ( new Error() ).stack;

        // update the quote data if it already exists (same id), otherwise
        // insert it
        this._collection.update( { id: id },
            { '$set': save_data },

            // create record if it does not yet exist
            { upsert: true },

            // on complete
            function( err, docs )
            {
                // if an error occurred, then we cannot continue
                if ( err )
                {
                    dao.emit( 'saveQuoteError', err, quote );

                    // let the caller handle the error
                    if ( failure_callback instanceof Function )
                    {
                        failure_callback.call( dao, quote );
                    }

                    return;
                }

                // successful
                if ( success_callback instanceof Function )
                {
                    success_callback.call( dao, quote );
                }
            }
        );

        return this;
    },


    /**
     * Merges quote data with the existing (rather than overwriting)
     *
     * @param {Quote}    quote     quote to save
     * @param {Object}   data      quote data
     * @param {Function} scallback successful callback
     * @param {Function} fcallback failure callback
     *
     * @return {MongoServerDao} self
     */
    'public mergeData': function( quote, data, scallback, fcallback )
    {
        // we do not want to alter the original data; use it as a prototype
        var update = data;

        // save the stack so we can track this call via the oplog
        var _self = this;
        this._collection.update( { id: quote.getId() },
            { '$set': update },
            {},

            function( err, docs )
            {
                if ( err )
                {
                    _self.emit( 'saveQuoteError', err, quote );

                    if ( typeof fcallback === 'function' )
                    {
                        fcallback( quote );
                    }

                    return;
                }

                if ( typeof scallback === 'function' )
                {
                    scallback( quote );
                }
            }
        );

        return this;
    },


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
    'public mergeBucket': function( quote, data, scallback, fcallback )
    {
        var update = {};

        for ( var field in data )
        {
            if ( !field )
            {
                continue;
            }

            update[ 'data.' + field ] = data[ field ];
        }

        return this.mergeData( quote, update, scallback, fcallback );
    },


    /**
     * Perform a "quick save"
     *
     * A quick save simply saves the given diff to the database for recovery
     * purposes
     *
     * @param {Quote}  quote quote being saved
     * @param {Object} diff  staged changes
     *
     * @param {function(*)} callback callback to call when complete
     *
     * @return {MongoServerDao} self
     */
    'public quickSaveQuote': function( quote, diff, callback )
    {
        // unlikely, but possible for a request to come in before we're ready
        // since this system is asynchronous
        if ( this._ready === false )
        {
            callback( Error( 'Database server not ready' ) );
            return;
        }

        var id = quote.getId();

        this._collection.update(
            { id: id },
            { $set: { quicksave: diff } },

            // on complete
            function( err, docs )
            {
                callback( err );
            }
        );

        return this;
    },


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
    'public saveQuoteState': function(
        quote, success_callback, failure_callback
    )
    {
        var update = {
            currentStepId:    quote.getCurrentStepId(),
            topVisitedStepId: quote.getTopVisitedStepId(),
            topSavedStepId:   quote.getTopSavedStepId(),
        };

        return this.mergeData(
            quote, update, success_callback, failure_callback
        );
    },


    'public saveQuoteClasses': function( quote, classes, success, failure )
    {
        return this.mergeData(
            quote,
            { classData: classes },
            success,
            failure
        );
    },


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
    'public saveQuoteMeta'( quote, new_meta, success, failure )
    {
        const update = {};

        for ( var key in new_meta )
        {
            var meta = new_meta[ key ];

            for ( var i in meta )
            {
                update[ 'meta.' + key + '.' + i ] =
                    new_meta[ key ][ i ];
            }
        }

        this.mergeData( quote, update, success, failure );
    },


    /**
     * Saves the quote lock state to the database
     *
     * @param Quote    quote            the quote to save
     * @param Function success_callback function to call on success
     * @param Function failure_callback function to call if save fails
     *
     * @return MongoServerDao self
     */
    'public saveQuoteLockState': function(
        quote, success_callback, failure_callback
    )
    {
        // lock state is saved by default
        return this.saveQuote( quote, success_callback, failure_callback, {} );
    },


    /**
     * Pulls quote data from the database
     *
     * @param Integer          quote_id id of quote
     * @param Function( data ) callback function to call when data is available
     *
     * @return MongoServerDao self to allow for method chaining
     */
    'public pullQuote': function( quote_id, callback )
    {
        var dao = this;

        // XXX: TODO: Do not read whole of record into memory; filter out
        // revisions!
        this._collection.find( { id: quote_id }, { limit: 1 },
            function( err, cursor )
            {
                cursor.toArray( function( err, data )
                {
                    // was the quote found?
                    if ( data.length == 0 )
                    {
                        callback.call( dao, null );
                        return;
                    }

                    // return the quote data
                    callback.call( dao, data[ 0 ] );
                });
            }
        );

        return this;
    },


    'public getMinQuoteId': function( callback )
    {
        // just in case it's asynchronous later on
        callback.call( this, this.__self.$('SEQ_QUOTE_ID_DEFAULT') );
        return this;
    },


    'public getMaxQuoteId': function( callback )
    {
        var dao = this;

        this._seqCollection.find(
            { _id: this.__self.$('SEQ_QUOTE_ID') },
            { limit: 1 },
            function( err, cursor )
            {
                cursor.toArray( function( err, data )
                {
                    if ( data.length == 0 )
                    {
                        callback.call( dao, 0 );
                        return;
                    }

                    // return the max quote id
                    callback.call( dao, data[ 0 ].val );
                });
            }
        );
    },


    'public getNextQuoteId': function( callback )
    {
        var dao = this;

        this._seqCollection.findAndModify(
            { _id: this.__self.$('SEQ_QUOTE_ID') },
            [ [ 'val', 'descending' ] ],
            { $inc: { val: 1 } },
            { 'new': true },

            function( err, doc )
            {
                if ( err )
                {
                    dao.emit( 'seqError', err );

                    callback.call( dao, 0 );
                    return;
                }

                // return the new id
                callback.call( dao, doc.val );
            }
        );

        return this;
    },


    /**
     * Create a new revision with the provided quote data
     *
     * The revision will contain the whole the quote. If space is a concern, we
     * can (in the future) calculate a delta instead (Mike recommends the Git
     * model of storing the deltas in previous revisions and the whole of the
     * bucket in the most recently created revision).
     */
    'public createRevision': function( quote, callback )
    {
        var _self = this,
            qid   = quote.getId(),
            data  = quote.getBucket().getData();

        this._collection.update( { id: qid },
            { '$push': { revisions: { data: data } } },

            // create record if it does not yet exist
            { upsert: true },

            // on complete
            function( err )
            {
                if ( err )
                {
                    _self.emit( 'mkrevError', err );
                }

                callback( err );
                return;
            }
        );
    },


    'public getRevision': function( quote, revid, callback )
    {
        revid = +revid;

        // XXX: TODO: Filter out all but the revision we want
        this._collection.find(
            { id: quote.getId() },
            { limit: 1 },
            function( err, cursor )
            {
                cursor.toArray( function( err, data )
                {
                    // was the quote found?
                    if ( ( data.length === 0 )
                        || ( data[ 0 ].revisions.length < ( revid + 1 ) )
                    )
                    {
                        callback( null );
                        return;
                    }

                    // return the quote data
                    callback( data[ 0 ].revisions[ revid ] );
                });
            }
        );
    },


    'public setWorksheets': function( qid, data, callback )
    {
        this._collection.update( { id: qid },
            { '$set': { worksheets: { data: data } } },

            // create record if it does not yet exist
            { upsert: true },

            // on complete
            function( err )
            {
                callback( err );
                return;
            }
        );
    },


    'public getWorksheet': function( qid, supplier, index, callback )
    {
        this._collection.find(
            { id: qid },
            { limit: 1 },
            function( err, cursor )
            {
                cursor.toArray( function( err, data )
                {
                    // was the quote found?
                    if ( ( data.length === 0 )
                        || ( !data[ 0 ].worksheets )
                        || ( !data[ 0 ].worksheets.data )
                        || ( !data[ 0 ].worksheets.data[ supplier ] )
                    )
                    {
                        callback( null );
                        return;
                    }

                    // return the quote data
                    callback( data[ 0 ].worksheets.data[ supplier ][ index ] );
                });
            }
        );
    },
} );

