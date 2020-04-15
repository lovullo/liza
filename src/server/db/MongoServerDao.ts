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
import { MongoCollection, MongoUpdate, MongoDb } from "mongodb";
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
     * @param _db  - mongo database connection
     * @param _env - the name of the current environment
     */
    constructor(
        private readonly _db:  MongoDb,
        private readonly _env: string,
    )
    {
        super();
    }


    /**
     * Initializes error events and attempts to connect to the database
     *
     * connectError event will be emitted on failure.
     *
     * @param success - function to call when connection is complete
     *                          (will not be called if connection fails)
     */
    init( success: () => void ): this
    {
        var dao = this;

        // map db error event (on connection error) to our connectError event
        this._db.on( 'error', function( err: Error )
        {
            dao._ready      = false;
            dao._collection = null;

            dao.emit( 'connectError', err );
        });

        this.connect( success );
        return this;
    }


    /**
     * Attempts to connect to the database
     *
     * connectError event will be emitted on failure.
     *
     * @param success - function to call when connection is complete
     *                          (will not be called if connection fails)
     */
    connect( success: () => void ): this
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
                if ( success instanceof Function )
                {
                    success.call( dao );
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
                        function(
                            _err:   NullableError,
                            _index: { [P: string]: any,
                        } )
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
                    err:        Error,
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
                        function( err: NullableError, cursor )
                        {
                            if ( err )
                            {
                                dao._initQuoteIdSeq( check_ready )
                                return;
                            }

                            cursor.toArray( function( _err: Error, data: any[] )
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


    /**
     * Initialize the quote id sequence collection
     *
     * @param success - a function to call once it has been initialized
     */
    private _initQuoteIdSeq( success: () => void )
    {
        var dao = this;

        this._seqCollection!.insert(
            {
                _id: this.SEQ_QUOTE_ID,
                val: this.SEQ_QUOTE_ID_DEFAULT,
            },
            function( err: NullableError, _docs: any )
            {
                if ( err )
                {
                    dao.emit( 'seqError', err );
                    return;
                }

                dao.emit( 'seqInit', dao.SEQ_QUOTE_ID );
                success.call( dao );
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
     * @param quote     - the quote to save
     * @param success   - function to call on success
     * @param failure   - function to call if save fails
     * @param save_data - quote data to save (optional)
     * @param push_data - quote data to push (optional)
     */
    saveQuote(
        quote:      ServerSideQuote,
        success:    Callback = () => {},
        failure:    Callback = () => {},
        save_data?: any,
        push_data?: any,
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

            failure.call( this, quote );
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
        save_data.env                = this._env;
        save_data.pver               = quote.getProgramVersion();
        save_data.importDirty        = 1;
        save_data.published          = false;
        save_data.lastPremDate       = quote.getLastPremiumDate();
        save_data.retryAttempts      = quote.getRetryAttempts();
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
                    if ( failure instanceof Function )
                    {
                        failure.call( dao, quote );
                    }

                    return;
                }

                // successful
                if ( success instanceof Function )
                {
                    success.call( dao, quote );
                }
            }
        );

        return this;
    }


    /**
     * Merges quote data with the existing (rather than overwriting)
     *
     * @param quote   - quote to save
     * @param data    - quote data
     * @param success - successful callback
     * @param failure - failure callback
     */
    mergeData(
        quote:   ServerSideQuote,
        data:    MongoUpdate,
        success: Callback = () => {},
        failure: Callback = () => {},
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

                    if ( typeof failure === 'function' )
                    {
                        failure( quote );
                    }

                    return;
                }

                if ( typeof success === 'function' )
                {
                    success( quote );
                }
            }
        );

        return this;
    }


    /**
     * Merges bucket data with the existing bucket (rather than overwriting the
     * entire bucket)
     *
     * @param quote   - quote to save
     * @param data    - bucket data
     * @param success - successful callback
     * @param failure - failure callback
     */
    mergeBucket(
        quote:   ServerSideQuote,
        data:    MongoUpdate,
        success: Callback = () => {},
        failure: Callback = () => {},
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
     * @param quote   - the quote to save
     * @param success - function to call on success
     * @param failure - function to call if save fails
     */
    saveQuoteState(
        quote:   ServerSideQuote,
        success: Callback = () => {},
        failure: Callback = () => {},
    ): this
    {
        var update = {
            currentStepId:    quote.getCurrentStepId(),
            topVisitedStepId: quote.getTopVisitedStepId(),
            topSavedStepId:   quote.getTopSavedStepId(),
        };

        return this.mergeData(
            quote, update, success, failure
        );
    }


    /**
     * Saves the quote retry attempts
     *
     * @param quote   - the quote to save
     * @param success - function to call on success
     * @param failure - function to call if save fails
     */
    saveQuoteRateRetries(
        quote:   ServerSideQuote,
        success: Callback = () => {},
        failure: Callback = () => {},
    ): this
    {
        var update = { retryAttempts: quote.getRetryAttempts() };

        return this.mergeData(
            quote, update, success, failure
        );
    }


    /**
     * Saves the quote class data
     *
     * @param quote   - the quote to save
     * @param classed - the classes to save
     * @param success - function to call on success
     * @param failure - function to call if save fails
     */
    saveQuoteClasses(
        quote:   ServerSideQuote,
        classes: any,
        success: Callback = () => {},
        failure: Callback = () => {},
    ): this
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
     * @param quote    - destination quote
     * @param new_meta - bucket-formatted data to write
     * @param success  - callback on success
     * @param failure  - callback on error
     */
    saveQuoteMeta(
        quote:    ServerSideQuote,
        new_meta: Record<string, any>,
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
     * @param quote   - the quote to save
     * @param success - function to call on success
     * @param failure - function to call if save fails
     */
    saveQuoteLockState(
        quote:   ServerSideQuote,
        success: Callback = () => {},
        failure: Callback = () => {},
    ): this
    {
        // lock state is saved by default
        return this.saveQuote( quote, success, failure, {} );
    }


    /**
     * Pulls quote data from the database
     *
     * @param quote_id - id of quote
     * @param callback - function to call when data is available
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


    /**
     * Returns the minimum allowable quote id
     *
     * @param callback - function to call with minimum quote id
     */
    getMinQuoteId( callback: ( min_id: number ) => void ): this
    {
        // just in case it's asynchronous later on
        callback.call( this, this.SEQ_QUOTE_ID_DEFAULT );

        return this;
    }


    /**
     * Returns the current highest quote id
     *
     * @param callback - function to call with current highest quote id
     */
    getMaxQuoteId( callback: ( max_id: number ) => void ): void
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


    /**
     * Returns the next available quote id
     *
     * @param callback - function to call with next available quote id
     */
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
     *
     * @param quote    - the quote to create a revision with
     * @param callback - function to call on error
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


    /**
     * Get a quote revision by its revision id
     *
     * @param quote    - the quote
     * @param revid    - the revision id
     * @param callback - a function to call with results
     */
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


    /**
     * Set worksheet data
     *
     * @param qid      - The quote id
     * @param data     - worksheet data
     * @param failure  - a function to call on error
     */
    setWorksheets(
        qid:     QuoteId,
        data:    MongoUpdate,
        failure: NodeCallback<void>,
    ): void
    {
        this._collection!.update( { id: qid },
            { '$set': { worksheets: { data: data } } },

            // create record if it does not yet exist
            { upsert: true },

            // on complete
            function( err )
            {
                failure( err );
                return;
            }
        );
    }


    /**
     * Retrieve worksheet data for a given quote id and supplier
     *
     * @param qid      - the quote id
     * @param supplier - the supplier to retrieve the worksheet for
     * @param index    - the worksheet index
     * @param callback - a function to call with the results of the lookup
     */
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
