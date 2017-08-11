/**
 * Staging key/value store
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of liza.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';


const { Class }    = require( 'easejs' );
const Bucket       = require( './Bucket' );
const EventEmitter = require( 'events' ).EventEmitter;


/**
 * Stages and merges values into underlying key/value store
 */
module.exports = Class( 'StagingBucket' )
    .implement( Bucket )
    .extend( EventEmitter,
{
    /**
     * Triggered when data in the bucket is updated, before it's committed
     * @type {string}
     */
    'const EVENT_UPDATE': 'update',

    'const EVENT_STAGING_PRE_UPDATE': 'preStagingUpdate',
    'const EVENT_STAGING_UPDATE': 'stagingUpdate',

    'const EVENT_PRE_COMMIT': 'preCommit',
    'const EVENT_COMMIT':     'commit',

    'const EVENT_STAGING_PRE_REVERT':  'preRevert',
    'const EVENT_STAGING_REVERT':      'revert',
    'const EVENT_STAGING_POST_REVERT': 'postRevert',


    /**
     * Bucket to wrap
     * @type {Bucket}
     */
    'private _bucket': null,


    /**
     * Contains staged (uncommitted) data
     * @type {Object.<string,Array>}
     */
    'private _staged': {},

    /**
     * Represents the current state of the bucket for fast retrieval
     * @type {Object.<string,Array>}
     */
    'private _curdata': {},

    /**
     * Whether data is staged but not committed
     *
     * Ah, brining back the "dirty" term from the good 'ol days of the "dirty
     * bucket"!
     *
     * @type {boolean}
     */
    'private _dirty': false,

    /**
     * Prevent setCommittedValues from bypassing staging
     * @type {boolean}
     */
    'private _noStagingBypass': false,


    /**
     * Initializes staging bucket with the provided data bucket
     *
     * @param {Bucket} bucket bucket in which to store data
     *
     * @return {undefined}
     */
    'public __construct': function( bucket )
    {
        this._bucket = bucket;

        const _self  = this;
        const _event = this.__self.$('EVENT_UPDATE');

        // forward events
        bucket.on( _event, function( data )
        {
            _self.emit( _event, data );
        } );

        this._initState();
    },


    'private _initState': function()
    {
        const data    = this._bucket.getData();
        const retdata = function() {};

        // ensure that we don't modify the original data
        retdata.prototype = data;

        this._curdata = new retdata();
        this._dirty   = false;
    },


    'protected merge': function( src, dest, nonull )
    {
        nonull = !!nonull;

        const len = src.length;

        for ( let i = 0; i < len; i++ )
        {
            let data = src[ i ];

            // don't merge if it's undefined or if null and nulls were not
            // permitted
            if ( data === undefined )
            {
                continue;
            }
            else if ( nonull && ( data === null ) )
            {
                // nulls mark the end of the set
                dest.length = i;
                break;
            }

            // merge with bucket data
            dest[ i ] = data;
        }
    },


    /**
     * Analgous to setValues(), but immediately commits the changes
     *
     * This still calls setValues() to ensure all events are properly kicked
     * off.
     */
    'public setCommittedValues': function( data /*, ...*/ )
    {
        if ( this._noStagingBypass )
        {
            return this.setValues.apply( this, arguments );
        }

        this._bucket.setValues.apply( this._bucket, arguments );

        // no use in triggering a pre-update, since these values are
        // already committed
        this.emit( this.__self.$('EVENT_STAGING_UPDATE'), data );

        return this;
    },


    /**
     * Prevent #setCommittedValues from bypassing staging
     *
     * When set, #setCommittedValues will act as an alias of #setValues.
     *
     * @return {StagingBucket} self
     */
    'public forbidBypass'()
    {
        this._noStagingBypass = true;
        return this;
    },


    /**
     * Determine whether values have changed
     *
     * If all values are identical to the current bucket values (relative to
     * `merge_index`), returns `false`.  Otherwise, this stops at the first
     * recognized change and returns `true`.
     *
     * @param {Object.<string,Array>} data        key/value data or diff
     * @param {boolean}               merge_index compare indexes individually
     *
     * @return {boolean} whether a change was recognized
     */
    'private _hasChanged': function( data, merge_index )
    {
        for ( let name in data )
        {
            let values = data[ name ];
            let cur    = this._curdata[ name ] || [];

            if ( !merge_index && ( values.length !== cur.length ) )
            {
                return true;
            }

            for ( let index in values )
            {
                if ( merge_index && ( values[ index ] === undefined ) )
                {
                    continue;
                }

                if ( values[ index ] !== cur[ index ] )
                {
                    return true;
                }
            }
        }

        return false;
    },


    /**
     * Explicitly sets the contents of the bucket
     *
     * @param {Object.<string,Array>} data associative array of the data
     *
     * @param {boolean} merge_index whether to merge indexes individually
     * @param {boolean} merge_null whether to merge undefined values (vs
     *                              ignore)
     *
     * @return {Bucket} self
     */
    'virtual public setValues': function( data, merge_index, merge_null )
    {
        if ( !this._hasChanged( data, merge_index ) )
        {
            return;
        }

        this.emit( this.__self.$('EVENT_STAGING_PRE_UPDATE'), data );

        for ( let name in data )
        {
            let item = Array.prototype.slice.call( data[ name ], 0 );

            // initialize as array if necessary
            if ( this._staged[ name ] === undefined )
            {
                this._staged[ name ]  = [];
            }

            // since _curdata's prototype is a reference to the internal data of
            // the other bucket (gah!---for perf reasons), we need to take care
            // to ensure that we do not modify it...this accomplishes that
            if ( Object.hasOwnProperty.call( this._curdata, name ) === false )
            {
                if ( this._curdata[ name ] !== undefined )
                {
                    this._curdata[ name ] = Array.prototype.slice.call(
                        this._curdata[ name ], 0
                    );
                }
                else
                {
                    this._curdata[ name ] = [];
                }
            }

            if ( merge_index )
            {
                // merge with previous values
                this.merge( item, this._staged[ name ] );

                // we do not want nulls in our current representation of the
                // data
                this.merge( item, this._curdata[ name ], true );
            }
            else
            {
                // overwrite
                this._staged[ name ]  = item;
                this._curdata[ name ] = item;
            }
        }

        this._dirty = true;
        this.emit( this.__self.$('EVENT_STAGING_UPDATE'), data );

        return this;
    },


    /**
     * Overwrites values in the original bucket
     *
     * @param {Object.<string,Array>} data associative array of the data
     *
     * @return {StagingBucket} self
     */
    'public overwriteValues': function( data )
    {
        const new_data = {};

        for ( let name in data )
        {
            new_data[ name ] = Array.prototype.slice.call( data[ name ], 0 );

            // a terminating null ensures all data is overwritten, rather than
            // just the beginning indexes
            new_data[ name ].push( null );
        }

        return this.setValues( new_data, false );
    },


    /**
     * Returns staged data
     *
     * @return {Object.<string,Array>}
     */
    'public getDiff': function()
    {
        return this._staged;
    },


    /**
     * Returns a field-oriented diff filled with all values rather than a
     * value-oriented diff
     *
     * Only the fields that have changed are returned. Each field contains its
     * actual value---not the diff representation of what portions of the field
     * have changed.
     *
     * return {Object} filled diff
     */
    'virtual public getFilledDiff': function()
    {
        const ret = {};

        // return each staged field
        for ( let field in this._staged )
        {
            // retrieve the current value for this field
            ret[ field ] = Array.prototype.slice.call(
                this._curdata[ field ], 0
            );
        }

        return ret;
    },


    /**
     * Reverts staged changes, preventing them from being committed
     *
     * This will also generate a diff and raise the same events that would be
     * raised by setting values in the conventional manner, allowing reverts to
     * transparently integrate with the remainder of the system.
     *
     * @return {StagingBucket} self
     */
    'public revert': function( evented )
    {
        evented = ( evented === undefined ) ? true : !!evented;

        const data = {};

        // generate data for this revert (so that hooks may properly handle it)
        for ( let name in this._staged )
        {
            let curstaged = this._staged[ name ];
            let orig      = this._bucket.getDataByName( name );

            data[ name ] = [];
            for ( let i in curstaged )
            {
                // if the original value is undefined, then we want to remove
                // the value entirely, *not* set it to undefiend (which would
                // affect the length of the array)
                if ( orig[ i ] === undefined )
                {
                    delete data[ name ][ i ];
                    continue;
                }

                data[ name ][ i ] = orig[ i ];
            }
        }

        if ( evented )
        {
            this.emit( this.__self.$('EVENT_STAGING_PRE_REVERT'), data );
            this.emit( this.__self.$('EVENT_STAGING_PRE_UPDATE'), data );
        }

        this._staged = {};
        this._initState();

        // everything after this point is evented
        if ( !( evented ) )
        {
            return this;
        }

        // trigger revert after update (since we did preRevert before update;
        // this also allows logic to disable further updates; DO NOT CHANGE
        // ORDER WITHOUT LOOKING AT WHAT USES THIS!)
        this.emit( this.__self.$('EVENT_STAGING_UPDATE'), data );
        this.emit( this.__self.$('EVENT_STAGING_REVERT'), data );

        // a distinct event lets hooks know that a revert has been completed
        // (which may be useful for allowing asychronous data to be
        // automatically committed following a revert, rather than once again
        // allowing the staging bucket to be considred dirty)
        this.emit( this.__self.$('EVENT_STAGING_POST_REVERT'), data );

        return this;
    },


    /**
     * Commits staged changes, merging them with the bucket
     *
     * @return {StagingBucket} self
     */
    'public commit': function( store )
    {
        const old = this._staged;

        this.emit( this.__self.$('EVENT_PRE_COMMIT') );

        this._bucket.setValues( this._staged, true, false );
        this._staged = {};

        this.emit( this.__self.$('EVENT_COMMIT') );

        this._initState();

        if ( typeof store === 'object' )
        {
            store.old = old;
        }

        return this;
    },


    /**
     * Clears all data from the bucket
     *
     * @return {Bucket} self
     */
    'public clear': function()
    {
        this._bucket.clear();
        return this;
    },


    /**
     * Calls a function for each each of the values in the bucket
     *
     * @param {function( Object, number )} callback function to call for each
     *                                              value in the bucket
     *
     * @return {Bucket} self
     */
    'virtual public each': function( callback )
    {
        for ( let name in this._curdata )
        {
            callback( this._curdata[ name ], name );
        }

        return this;
    },


    /**
     * Returns the data for the requested field
     *
     * WARNING: This can be a potentially expensive operation if there is a
     * great deal of staged data. The staged data is merged with the bucket data
     * on each call. Do not make frequent calls to retrieve the same data. Cache
     * it instead.
     *
     * @param {string} name field name (with or without trailing brackets)
     *
     * @return {Array} data for the field, or empty array if none
     */
    'virtual public getDataByName': function( name )
    {
        if ( this._curdata[ name ] )
        {
            // important: return a clone so that operations on this data doesn't
            // modify the bucket without us knowing!
            return Array.prototype.slice.call( this._curdata[ name ] );
        }

        return [];
    },


    /**
     * Returns original bucket data by name, even if there is data staged atop
     * of it
     *
     * There is no additional overhead of this operation versus getDataByName()
     *
     * @param {string} name field name (with or without trailing brackets)
     *
     * @return {Array} data for the field, or empty array if none
     */
    'public getOriginalDataByName': function( name )
    {
        return this._bucket.getDataByName( name );
    },


    /**
     * Returns the data as a JSON string
     *
     * @return {string} data represented as JSON
     */
    'public getDataJson': function()
    {
        return this._bucket.getDataJson();
    },


    /**
     * Return raw bucket data
     *
     * todo: remove; breaks encapsulation
     *
     * @return {Object} raw bucket data
     */
    'virtual public getData': function()
    {
        return this._curdata;
    },


    /**
     * Calls a function for each each of the values in the bucket matching the
     * given predicate
     *
     * @param {function(string)}           pred predicate
     * @param {function( Object, number )} c    function to call for each
     *                                          value in the bucket
     *
     * @return {StagingBucket} self
     */
    'public filter': function( pred, c )
    {
        this.each( function( data, name )
        {
            if ( pred( name ) )
            {
                c( data, name );
            }
        } );
    },


    'virtual public hasIndex': function( name, i )
    {
        return ( this._curdata[ name ][ i ] !== undefined );
    },


    'public isDirty': function()
    {
        return this._dirty;
    }
} );
