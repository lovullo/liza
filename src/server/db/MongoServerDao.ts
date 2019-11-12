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

import { ServerDao, Callback } from "./ServerDao";
import { MongoCollection, MongoUpdate } from "mongodb";
import { PositiveInteger } from "../../numeric";
import { ServerSideQuote } from "../quote/ServerSideQuote";
import { QuoteId } from "../../document/Document";
import { WorksheetData } from "../rater/Rater";

const EventEmitter = require( 'events' ).EventEmitter;

type ErrorCallback = ( err: NullableError ) => void;

/**
 * Uses MongoDB as a data store
 */
export class MongoServerDao extends EventEmitter implements ServerDao
{
    /** Collection used to store quotes */
    readonly COLLECTION: string = 'quotes';

    /** Sequence (auto-increment) collection */
    readonly COLLECTION_SEQ: string = 'seq';

    /** Sequence key for quote ids */
    readonly SEQ_QUOTE_ID: string = 'quoteId';

    /** Sequence quoteId default */
    readonly SEQ_QUOTE_ID_DEFAULT: number = 200000;


    /** Whether the DAO is initialized and ready to be used */
    private _ready: boolean = false;

    /** Collection to save data to */
    private _collection?: MongoCollection | null;

    /** Collection to read sequences (auto-increments) from */
    private _seqCollection?: MongoCollection | null;


    /**
     * Initializes DAO
     *
     * @param {Mongo.Db} db mongo database connection
     */
    constructor(
        private readonly _db: any
    )
    {
        super();
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
    init( callback: () => void ): this
    {
        var dao = this;

        // map db error event (on connection error) to our connectError event
        this._db.on( 'error', function( err: any )
        {
            dao._ready      = false;
            dao._collection = null;

            dao.emit( 'connectError', err );
        });

        this.connect( callback );
        return this;
    }


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
    connect( callback: () => void ): this
    {
        var dao = this;

        // attempt to connect to the database
        this._db.open( function( err: any, db: any )
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
            db.collection(
                dao.COLLECTION,
                function(
                    _err:       any,
                    collection: MongoCollection,
                ) {
                    // for some reason this gets called more than once
                    if ( collection == null )
                    {
                        return;
                    }

                    // initialize indexes
                    collection.createIndex(
                        [ ['id', 1] ],
                        true,
                        function( _err: any, _index: { [P: string]: any } )
                        {
                            // mark the DAO as ready to be used
                            dao._collection = collection;
                            check_ready();
                        }
                    );
                }
            );

            // seq collection
            db.collection(
                dao.COLLECTION_SEQ,
                function(
                    err:        any,
                    collection: MongoCollection,
                ) {
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
                        { _id: dao.SEQ_QUOTE_ID },
                        { limit: <PositiveInteger>1 },
                        function( err: any, cursor )
                        {
                            if ( err )
                            {
                                dao._initQuoteIdSeq( check_ready )
                                return;
                            }

                            cursor.toArray( function( _err: any, data: any[] )
                            {
                                if ( data.length == 0 )
                                {
                                    dao._initQuoteIdSeq( check_ready );
                                    return;
                                }

                                check_ready();
                            });
                        }
                    );
                }
            );
        });

        return this;
    }


    private _initQuoteIdSeq( callback: () => void )
    {
        var dao = this;

        this._seqCollection!.insert(
            {
                _id: this.SEQ_QUOTE_ID,
                val: this.SEQ_QUOTE_ID_DEFAULT,
            },
            function( err: any, _docs: any )
            {
                if ( err )
                {
                    dao.emit( 'seqError', err );
                    return;
                }

                dao.emit( 'seqInit', dao.SEQ_QUOTE_ID );
                callback.call( dao );
            }
        );
    }


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
    saveQuote(
        quote:            ServerSideQuote,
        success_callback: Callback,
        failure_callback: Callback,
        save_data?:       any,
        push_data?:       any,
    ): this
    {
        var dao                       = this;
        var meta: Record<string, any> = {};

        // if we're not ready, then we can't save the quote!
        if ( this._ready === false )
        {
            this.emit( 'saveQuoteError',
                { message: 'Database server not ready' },
                Error( 'Database not ready' ),
                quote
            );

            failure_callback.call( this, quote );
            return dao;
        }

        if ( save_data === undefined )
        {
            save_data = {
                data: quote.getBucket().getData(),
            };

            // full save will include all metadata
            meta = quote.getMetabucket().getData();
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

        // meta will eventually take over for much of the above data
        meta.liza_timestamp_initial_rated = [ quote.getRatedDate() ];

        // save the stack so we can track this call via the oplog
        save_data._stack = ( new Error() ).stack;

        // avoid wiping out other metadata (since this may not be a full set)
        Object.keys( meta ).forEach(
            key => save_data[ 'meta.' + key ] = meta[ key ]
        );

        // do not push empty objects
        const document = ( !push_data || !Object.keys( push_data ).length )
            ? { '$set': save_data }
            : { '$set': save_data, '$push': push_data };

        // update the quote data if it already exists (same id), otherwise
        // insert it
        this._collection!.update( { id: id },
            document,

            // create record if it does not yet exist
            { upsert: true },

            // on complete
            function( err, _docs )
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
    }


    /**
     * Merges quote data with the existing (rather than overwriting)
     *
     * @param {Quote}    quote     quote to save
     * @param {Object}   data      quote data
     * @param {Function} scallback successful callback
     * @param {Function} fcallback failure callback
     */
    mergeData(
        quote:     ServerSideQuote,
        data:      MongoUpdate,
        scallback: Callback,
        fcallback: Callback,
    ): this
    {
        // we do not want to alter the original data; use it as a prototype
        var update = data;

        // save the stack so we can track this call via the oplog
        var _self = this;
        this._collection!.update( { id: quote.getId() },
            { '$set': update },
            {},

            function( err, _docs )
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
    }


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
    mergeBucket(
        quote:   ServerSideQuote,
        data:    MongoUpdate,
        success: Callback,
        failure: Callback,
    ): this
    {
        var update: MongoUpdate = {};

        for ( var field in data )
        {
            if ( !field )
            {
                continue;
            }

            update[ 'data.' + field ] = data[ field ];
        }

        return this.mergeData( quote, update, success, failure );
    }


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
    saveQuoteState(
        quote:            ServerSideQuote,
        success_callback: any,
        failure_callback: any,
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
    }


    saveQuoteClasses(
        quote:   ServerSideQuote,
        classes: any,
        success: any,
        failure: any,
    )
    {
        return this.mergeData(
            quote,
            { classData: classes },
            success,
            failure
        );
    }


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
    saveQuoteMeta(
        quote:    ServerSideQuote,
        new_meta: any,
        success:  Callback,
        failure:  Callback,
    ): void
    {
        const update: MongoUpdate = {};

        for ( var key in new_meta )
        {
            var meta = new_meta[ key ];

            for ( var i in meta )
            {
                update[ 'meta.' + key + '.' + i ] = new_meta[ key ][ i ];
            }
        }

        this.mergeData( quote, update, success, failure );
    }


    /**
     * Saves the quote lock state to the database
     *
     * @param Quote    quote            the quote to save
     * @param Function success_callback function to call on success
     * @param Function failure_callback function to call if save fails
     *
     * @return MongoServerDao self
     */
    saveQuoteLockState(
        quote:            ServerSideQuote,
        success_callback: Callback,
        failure_callback: Callback,
    ): this
    {
        // lock state is saved by default
        return this.saveQuote(
            quote,
            success_callback,
            failure_callback,
            {}
        );
    }


    /**
     * Pulls quote data from the database
     *
     * @param Integer          quote_id id of quote
     * @param Function( data ) callback function to call when data is available
     *
     * @return MongoServerDao self to allow for method chaining
     */
    pullQuote(
        quote_id: PositiveInteger,
        callback: ( data: Record<string, any> | null ) => void
    ): this
    {
        var dao = this;

        // XXX: TODO: Do not read whole of record into memory; filter out
        // revisions!
        this._collection!.find( { id: quote_id }, { limit: <PositiveInteger>1 },
            function( _err, cursor )
            {
                cursor.toArray( function( _err: NullableError, data: any[] )
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
    }


    getMinQuoteId( callback: ( min_id: number ) => void ): this
    {
        // just in case it's asynchronous later on
        callback.call( this, this.SEQ_QUOTE_ID_DEFAULT );

        return this;
    }


    getMaxQuoteId( callback: ( min_id: number ) => void ): void
    {
        var dao = this;

        this._seqCollection!.find(
            { _id: this.SEQ_QUOTE_ID },
            { limit: <PositiveInteger>1 },
            function( _err, cursor )
            {
                cursor.toArray( function( _err: NullableError, data: any[] )
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
    }


    getNextQuoteId( callback: ( quote_id: number ) => void ): this
    {
        var dao = this;

        this._seqCollection!.findAndModify(
            { _id: this.SEQ_QUOTE_ID },
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
    }


    /**
     * Create a new revision with the provided quote data
     *
     * The revision will contain the whole the quote. If space is a concern, we
     * can (in the future) calculate a delta instead (Mike recommends the Git
     * model of storing the deltas in previous revisions and the whole of the
     * bucket in the most recently created revision).
     */
    createRevision(
        quote:    ServerSideQuote,
        callback: ErrorCallback,
    ): void
    {
        var _self = this,
            qid   = quote.getId(),
            data  = quote.getBucket().getData();

        this._collection!.update( { id: qid },
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
    }


    getRevision(
        quote:    ServerSideQuote,
        revid:    PositiveInteger,
        callback: ErrorCallback,
    ): void
    {
        revid = <PositiveInteger>+revid;

        // XXX: TODO: Filter out all but the revision we want
        this._collection!.find(
            { id: quote.getId() },
            { limit: <PositiveInteger>1 },
            function( _err, cursor )
            {
                cursor.toArray( function( _err: NullableError, data: any[] )
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
    }


    setWorksheets(
        qid:      QuoteId,
        data:     MongoUpdate,
        callback: NodeCallback<void>,
    ): void
    {
        this._collection!.update( { id: qid },
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
    }


    getWorksheet(
        qid:      QuoteId,
        supplier: string,
        index:    PositiveInteger,
        callback: ( data: WorksheetData | null ) => void,
    ): void
    {
        this._collection!.find(
            { id: qid },
            { limit: <PositiveInteger>1 },
            function( _err, cursor )
            {
                cursor.toArray( function( _err: NullableError, data: any[] )
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
                } );
            }
        );
    }
};
